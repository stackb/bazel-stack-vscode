import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { API } from '../api';
import { BzlClient } from '../bzl/client';
import { CodesearchPanel } from '../bzl/codesearch/panel';
import { BazelBuildEvent } from '../bzl/commandrunner';
import { IExtensionFeature, md5Hash } from '../common';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { BEPRunner } from './bepRunner';
import { BazelCodelensProvider } from './codelens';
import { CodeSearch } from './codesearch';
import { BezelConfiguration, createBezelConfiguration } from './configuration';
import { CommandName, ViewName } from './constants';
import { ExecRootView } from './execrootView';
import { BuildEventProtocolView } from './invocationView';
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { uiUrlForLabel } from './ui';
import { BezelWorkspaceView } from './workspaceView';

export const BezelFeatureName = 'bsv.bazel';

// workspaceNotFoundErrorMessage is the error message returned by the lsp server
// when the workspace is not found.
const workspaceNotFoundErrorMessage = 'WORKSPACE_NOT_FOUND';

export class BezelFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BezelFeatureName;

    private bazelTerminal: vscode.Terminal | undefined;
    private cfg: BezelConfiguration | undefined;
    private client: BezelLSPClient | undefined;
    private codesearchPanel: CodesearchPanel | undefined;
    private debugCLITerminal: vscode.Terminal | undefined;
    private disposables: vscode.Disposable[] = [];
    private lastBazelArgs: string[] = [];
    private bepRunner: BEPRunner | undefined;
    private execrootView: ExecRootView | undefined;
    private bazelInfo: BazelInfoResponse | undefined;
    private onDidBazelInfoChange: vscode.EventEmitter<BazelInfoResponse> = new vscode.EventEmitter();
    private onDidChangeClient: vscode.EventEmitter<BezelLSPClient> = new vscode.EventEmitter();
    private onDidChangeBzlClient: vscode.EventEmitter<BzlClient> = new vscode.EventEmitter();
    private onDidReceiveBazelBuildEvent: vscode.EventEmitter<BazelBuildEvent> = new vscode.EventEmitter();

    constructor(private api: API) {
    }

    /**
     * @override
     */
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        // vscode.window.showInformationMessage(`Bezel Activating...`);
        setWorkspaceContextValue('LOADING');

        const cfg = this.cfg = await createBezelConfiguration(ctx, config);

        try {
            const client = await this.startLspClient(cfg);
            await this.activateInternal(client);
        } catch (e) {
            setWorkspaceContextValue('LOADING_ERROR');
            vscode.window.showErrorMessage(`failed to load bazel activity panel: ${e.message}`);
        }
    }

    async fetchBazelInfo(): Promise<void> {
        if (!this.client) {
            return;
        }
        try {
            const info = await this.client.bazelInfo();
            this.bazelInfo = info;
            setWorkspaceContextValue('LOADED');
            this.onDidBazelInfoChange.fire(info);
        } catch (e) {
            if (e.message === workspaceNotFoundErrorMessage) {
                setWorkspaceContextValue(workspaceNotFoundErrorMessage);
            }
            throw e;
        }
    }

    async activateInternal(client: BezelLSPClient) {
        this.disposables.push(this.onDidChangeClient);
        this.disposables.push(this.onDidChangeBzlClient);
        this.disposables.push(this.onDidReceiveBazelBuildEvent);
        this.disposables.push(this.onDidBazelInfoChange);

        this.bepRunner = new BEPRunner(this.onDidChangeBzlClient.event);
        this.disposables.push(this.bepRunner);

        this.execrootView = new ExecRootView(client);
        this.disposables.push(this.execrootView);
        this.disposables.push(new BezelWorkspaceView(this.onDidBazelInfoChange.event, client));
        this.disposables.push(new BuildEventProtocolView(
            this.api,
            this.onDidChangeBzlClient.event,
            this.bepRunner.onDidReceiveBazelBuildEvent.event,
        ));
        this.disposables.push(new BazelCodelensProvider(
            this.cfg?.codelens!, 
            this.onDidChangeClient.event,
        ));
        this.disposables.push(vscode.window.onDidCloseTerminal(terminal => {
            switch (terminal.name) {
                case 'bazel':
                    this.bazelTerminal?.dispose();
                    this.bazelTerminal = undefined;
                case 'debug-cli':
                    this.debugCLITerminal?.dispose();
                    this.debugCLITerminal = undefined;
            }
        }));

        this.disposables.push(new CodeSearch(this.onDidChangeClient.event));

        this.addCommand(CommandName.Redo, this.handleCommandRedo);
        this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyLabel);
        this.addCommand(CommandName.Build, this.handleCommandBuild);
        this.addCommand(CommandName.BuildEvents, this.handleCommandBuildEvents);
        this.addCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
        this.addCommand(CommandName.Test, this.handleCommandTest);
        this.addCommand(CommandName.TestEvents, this.handleCommandTestEvents);
        this.addCommand(CommandName.DebugTest, this.handleCommandTestDebug);
        this.addCommand(CommandName.Codesearch, this.handleCommandCodesearch);
        this.addCommand(CommandName.UI, this.handleCommandUI);

        this.onDidChangeClient.fire(client);

        try {
            this.fetchBazelInfo();
        } catch (e) {
            vscode.window.showErrorMessage(`failed to fetch bazel info: ${e.message}`);
        }
    }

    protected async startLspClient(cfg: BezelConfiguration): Promise<BezelLSPClient> {

        const client = this.client = new BezelLSPClient(
            this.onDidChangeBzlClient,
            cfg.bzl.executable,
            cfg.bzl.address,
            cfg.bzl.command);

        client.start();

        await client.onReady();

        return client;
    }

    protected addCommand(name: string, command: (...args: any) => any) {
        this.disposables.push(vscode.commands.registerCommand(name, command, this));
    }

    public deactivate() {
        this.dispose();
    }

    getOrCreateCodesearchPanel(queryExpression: string): CodesearchPanel {
        if (!this.codesearchPanel) {
            this.codesearchPanel = new CodesearchPanel(Container.context.extensionPath, 'Codesearch', `Codesearch ${queryExpression}`, vscode.ViewColumn.One);
            this.codesearchPanel.onDidDispose(() => {
                this.codesearchPanel = undefined;
            }, this, this.disposables);
        }
        return this.codesearchPanel;
    }

    async handleCommandRedo(): Promise<void> {
        if (this.lastBazelArgs.length === 0) {
            return;
        }
        return this.runInBazelTerminal(this.lastBazelArgs);
    }

    async handleCommandCopyLabel(label: string): Promise<void> {
        vscode.window.setStatusBarMessage(
            `"${label}" copied to clipboard`,
            3000
        );
        return vscode.env.clipboard.writeText(label);
    }

    async handleCommandBuild(label: string): Promise<void> {
        this.handleCommandBuildTerminal(label);
    }

    async handleCommandBuildTerminal(label: string): Promise<void> {
        const args = ['build', label]
        args.push(...this.cfg!.bazel.buildFlags);
        this.runInBazelTerminal(args);
    }

    async handleCommandBuildEvents(label: string): Promise<void> {
        this.runEvents('build', label);
    }

    async handleCommandTestEvents(label: string): Promise<void> {
        this.runEvents('test', label);
    }

    async runEvents(command: string, label: string): Promise<void> {
        this.execrootView?.reset();

        if (!this.client?.ws) {
            return;
        }

        const ws = this.client.ws;

        const request: RunRequest = {
            arg: [command, label, '--color=yes'],
            workspace: ws,
        };

        return this.bepRunner!.runTask(request,
            (
                err: grpc.ServiceError | undefined,
                md: grpc.Metadata | undefined,
                response: RunResponse | undefined
            ) => {
                if (err) {
                    console.warn('run error', err);
                    return;
                }
            }
        );
    }

    async handleCommandTest(label: string): Promise<void> {
        this.execrootView?.reset();

        const args = ['test', label]
        args.push(...this.cfg!.bazel.buildFlags);
        args.push(...this.cfg!.bazel.testFlags);
        this.runInBazelTerminal(args);
    }

    async handleCommandBuildDebug(label: string): Promise<void> {
        const action = await vscode.window.showInformationMessage(this.debugInfoMessage(), 'OK', 'Cancel');
        if (action !== 'OK') {
            return;
        }
        const args = ['build', label]
        args.push(...this.cfg!.bazel.buildFlags);
        args.push(...this.cfg!.bazel.starlarkDebuggerFlags);
        this.runInBazelTerminal(args);
        this.runInDebugCLITerminal(['debug']);
    }

    async handleCommandTestDebug(label: string): Promise<void> {
        const action = await vscode.window.showInformationMessage(this.debugInfoMessage(), 'OK', 'Cancel');
        if (action !== 'OK') {
            return;
        }
        const args = ['test', label]
        args.push(...this.cfg!.bazel.buildFlags);
        args.push(...this.cfg!.bazel.testFlags);
        args.push(...this.cfg!.bazel.starlarkDebuggerFlags);
        this.runInBazelTerminal(args);
    }

    async handleCommandCodesearch(label: string): Promise<void> {
        const expr = `deps(${label})`;
        const name = md5Hash(expr);

        vscode.commands.executeCommand(CommandName.CodesearchSearch, {
            cwd: this.client?.info?.workspace,
            args: [expr],
        });
    }

    async handleCommandUI(label: string): Promise<void> {
        if (!(this.client && this.client.getWorkspaceID())) {
            return;
        }
        const rel = uiUrlForLabel(this.client.getWorkspaceID(), label);

        vscode.commands.executeCommand(
            BuiltInCommands.Open,
            vscode.Uri.parse(`http://${this.client?.getAddress()}/${rel}`),
        );
    }

    debugInfoMessage(): string {
        return `This will start the Bazel starlark debug server in one terminal and the debug client CLI in a second terminal.  Running the bazel server in starlark debug mode blocks all other operations and may require server shutdown to end the debug session.  Are you sure you want to continue?`
    }

    getOrCreateBazelTerminal(): vscode.Terminal {
        if (!this.bazelTerminal) {
            this.bazelTerminal = vscode.window.createTerminal('bazel');
            this.disposables.push(this.bazelTerminal);
        }
        return this.bazelTerminal;
    }

    getOrCreateDebugCLITerminal(): vscode.Terminal {
        if (!this.debugCLITerminal) {
            this.debugCLITerminal = vscode.window.createTerminal('debug-cli');
            this.disposables.push(this.debugCLITerminal);
        }
        return this.debugCLITerminal;
    }

    runInBazelTerminal(args: string[]): void {
        this.execrootView?.reset();

        this.lastBazelArgs = args;
        args.unshift(this.cfg!.bazel.executable);

        this.runInTerminal(this.getOrCreateBazelTerminal(), args);

    }

    runInDebugCLITerminal(args: string[]): void {
        args.unshift('--debug_working_directory=.')
        args.unshift(this.cfg!.bzl.executable);

        this.runInTerminal(this.getOrCreateDebugCLITerminal(), args);
    }

    runInTerminal(terminal: vscode.Terminal, args: string[]): void {
        terminal.sendText(args.join(' '), true);
        terminal.show();
    }

    /**
     * @override
     */
    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}


export function setWorkspaceContextValue(value: string): Thenable<unknown> {
    return vscode.commands.executeCommand('setContext', ViewName.Workspace + '.status', value);
}
