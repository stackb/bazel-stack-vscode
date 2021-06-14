import * as vscode from 'vscode';
import { areFunctions } from 'vscode-common/out/types';
import { threadId } from 'worker_threads';
import { API } from '../api';
import { IExtensionFeature } from '../common';
import { BezelConfiguration, createBezelConfiguration } from './configuration';
import { CommandName, ViewName } from './constants';
import { BezelLSPClient } from './lsp';
import { BezelWorkspaceView } from './workspaceView';

export const BezelFeatureName = 'bsv.bazel';

export class BezelFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BezelFeatureName;

    private client: BezelLSPClient | undefined;
    private bazelTerminal: vscode.Terminal | undefined;
    private debugCLITerminal: vscode.Terminal | undefined;
    private cfg: BezelConfiguration | undefined;
    private lastBazelArgs: string[] = [];

    private disposables: vscode.Disposable[] = [];

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
            await this.activeInternal(client);
        } catch (e) {
            setWorkspaceContextValue('LOADING_ERROR');
            vscode.window.showErrorMessage(`failed to load bazel activity panel: ${e.message}`);
        }
    }

    async activeInternal(client: BezelLSPClient) {
        this.disposables.push(new BezelWorkspaceView(client));
        this.disposables.push(vscode.window.onDidCloseTerminal(terminal => {
            switch(terminal.name) {
                case 'bazel':
                this.bazelTerminal?.dispose();
                this.bazelTerminal = undefined;
                case 'debug-cli':
                    this.debugCLITerminal?.dispose();
                    this.debugCLITerminal = undefined;
                }
        }));

        this.addCommand(CommandName.Redo, this.handleCommandRedo);
        this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyLabel);
        this.addCommand(CommandName.Build, this.handleCommandBuildLabel);
        this.addCommand(CommandName.DebugBuild, this.handleCommandBuildDebugLabel);
        this.addCommand(CommandName.Test, this.handleCommandTestLabel);
        this.addCommand(CommandName.DebugTest, this.handleCommandTestDebugLabel);

    }

    protected async startLspClient(cfg: BezelConfiguration): Promise<BezelLSPClient> {
        const client = this.client = new BezelLSPClient(
            cfg.bzl.executable,
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

    async handleCommandBuildLabel(label: string): Promise<void> {
        const args = ['build', label]
        args.push(...this.cfg!.bazel.buildFlags);
        this.runInBazelTerminal(args);
    }

    async handleCommandTestLabel(label: string): Promise<void> {
        const args = ['test', label]
        args.push(...this.cfg!.bazel.buildFlags);
        args.push(...this.cfg!.bazel.testFlags);
        this.runInBazelTerminal(args);
    }

    async handleCommandBuildDebugLabel(label: string): Promise<void> {
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

    async handleCommandTestDebugLabel(label: string): Promise<void> {
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
        this.lastBazelArgs = args;
        args.unshift(this.cfg!.bazel.executable);
        const terminal = this.getOrCreateBazelTerminal();
        terminal.sendText(args.join(' '), true);
        terminal.show();
    }

    runInDebugCLITerminal(args: string[]): void {
        args.unshift('--debug_working_directory=.')
        args.unshift(this.cfg!.bzl.executable);

        const terminal = this.getOrCreateDebugCLITerminal();
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
