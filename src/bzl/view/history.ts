import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as vscode from 'vscode';
import { CommandCodeLensProvider, ICommandCodeLensProviderRegistry } from '../../api';
import { BazelCommands, BazelCommands as bazelCommands } from '../../bazelrc/configuration';
import { BuiltInCommands } from '../../constants';
import { InputStep, MultiStepInput } from '../../multiStepInput';
import { CommandHistory } from '../../proto/build/stack/bezel/v1beta1/CommandHistory';
import { RunRequest } from '../../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../../proto/build/stack/bezel/v1beta1/RunResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { Timestamp } from '../../proto/google/protobuf/Timestamp';
import { BzlClient } from '../client';
import { CommandTaskRunner } from '../commandrunner';
import { CommandName, ContextValue, FileName, ThemeIconCircleOutline, ThemeIconDebugContinue, ThemeIconDebugStackframe, ThemeIconDebugStart, ThemeIconQuestion, ViewName } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');
import path = require('path');
import fs = require('graceful-fs');

const DapstarDebugTypeName = 'dapstar';

interface CommandRunSpec {
    command: string
    args: string[]
}

function isCommandRunSpec(value: unknown): value is CommandRunSpec {
    if (!value) {
        return false;
    }
    return typeof (value as CommandRunSpec).command === 'string';
}

/**
 * Renders a view for bazel command history.
 */
export class BzlCommandHistoryView extends BzlClientTreeDataProvider<CommandHistoryItem> implements CommandCodeLensProvider {

    private currentWorkspace: Workspace | undefined;
    private currentItems: CommandHistoryItem[] | undefined;
    private selectedItem: CommandHistoryItem | undefined;
    private lastRun: RunRequest | undefined;

    constructor(
        onDidChangeBzlClient: vscode.Event<BzlClient>,
        workspaceChanged: vscode.Event<Workspace | undefined>,
        commandDidRun: vscode.Event<RunRequest>,
        private commandTaskRunner: CommandTaskRunner,
        commandCodelensProviderRegistry: ICommandCodeLensProviderRegistry,
    ) {
        super(ViewName.History, onDidChangeBzlClient);
        workspaceChanged(this.handleWorkspaceChanged, this, this.disposables);
        commandDidRun(this.handleCommandDidRun, this, this.disposables);

        // vscode.debug.registerDebugConfigurationProvider(
        //     DapstarDebugConfigurationProviderName,
        //     new DapstarDebugConfigurationProvider());

        registerBazelCommandCodeLensProviders(commandCodelensProviderRegistry, this);
    }

    registerCommands() {
        super.registerCommands();
        this.addCommand(CommandName.HistorySelect, this.handleCommandSelect);
        this.addCommand(CommandName.HistoryExplore, this.handleCommandExplore);
        this.addCommand(CommandName.HistoryRun, this.handleCommandRun);
        this.addCommand(CommandName.HistoryDebug, this.handleCommandDebug);
        this.addCommand(CommandName.HistoryDelete, this.handleCommandDelete);
        this.addCommand(CommandName.HistoryAdd, this.handleCommandAdd);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.refresh();
    }

    handleCommandDidRun(request: RunRequest) {
        this.lastRun = request;
        this.refresh();
    }

    handleCommandSelect(item: CommandHistoryItem): void {
        this.selectedItem = item;
    }

    handleCommandExplore(item: CommandHistoryItem): void {
        vscode.commands.executeCommand(BuiltInCommands.Open,
            vscode.Uri.parse(`${this.client?.httpURL()}/command/${item.history.id}`));
    }

    async selectMostRecentItem(): Promise<CommandHistoryItem | undefined> {
        let item: CommandHistoryItem | undefined;
        if (this.selectedItem) {
            item = this.selectedItem;
        } else if (this.currentItems && this.currentItems.length) {
            item = this.currentItems[0];
        }
        if (!item) {
            return undefined;
        }
        this.view.reveal(item, {
            select: true,
            focus: false,
        });

        return item;
    }

    async handleCommandDebug(item?: CommandHistoryItem | CommandRunSpec): Promise<any> {
        this.handleCommandRun(item, true /* debug */);
    }

    async handleCommandRun(item?: CommandHistoryItem | CommandRunSpec, debug?: boolean): Promise<any> {
        if (!this.currentWorkspace) {
            return;
        }

        // If there is no item provided, it was called via keybinding or menu.
        // Find the most recent one
        if (!item) {
            // first check if there was a recent run
            if (this.lastRun) {
                return this.run(this.lastRun.arg, debug);
            }

            item = await this.selectMostRecentItem();
            if (!item) {
                return;
            }
        }

        if (item instanceof CommandHistoryItem) {
            this.selectedItem = item;
            return this.run(item.history.arg, debug);
        }

        if (isCommandRunSpec(item)) {
            return this.run([item.command].concat(item.args), debug);
        }
    }

    async run(args: string[] | undefined, debug?: boolean): Promise<any> {
        if (!args) {
            return;
        }

        if (debug && vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const verbose = true;
            const port = 7300;
            args.push(
                '--experimental_skylark_debug',
                `--experimental_skylark_debug_server_port=${port}`,
                `--experimental_skylark_debug_verbose_logging=${verbose}`,
            );

            vscode.debug.startDebugging(undefined, {
                cwd: this.currentWorkspace?.cwd,
                name: 'Starlark',
                request: 'launch',
                type: 'dapstar',
            });
        }

        const request: RunRequest = {
            arg: args,
            workspace: this.currentWorkspace,
        };

        const callback = (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => {
            if (debug) {
                maybeTerminateDebugSession(vscode.debug.activeDebugSession, DapstarDebugTypeName, err, response);
            }
            if (err) {
                console.warn('run error', err);
                return;
            }
        };

        // if (debug) {
        //     return Promise.resolve();
        // }
        this.commandTaskRunner.runTask(request, callback);
    }

    async handleCommandDelete(item?: CommandHistoryItem): Promise<any> {
        if (!this.currentWorkspace) {
            return;
        }
        if (!item) {
            return;
        }

        await this.client?.deleteCommandHistoryById(item.history.id!);

        this.refresh();
    }

    async handleCommandAdd(): Promise<void> {
        let command = '';
        let args: string[] = [];

        const inputArgs: InputStep = async (input) => {
            const argstr = await input.showInputBox({
                title: 'Command Arguments',
                totalSteps: 2,
                step: 2,
                value: '',
                prompt: `${command} TARGET [--options]`,
                validate: async (value: string) => { return ''; },
                shouldResume: async () => false,
            });
            args = argstr.split(/\s+/);
            return undefined;
        };

        const pickCommand: InputStep = async (input) => {
            const picked = await input.showQuickPick({
                title: 'Command Name',
                totalSteps: 2,
                step: 1,
                items: Array.from(bazelCommands.values()).map(name => { return { label: name }; }),
                placeholder: 'Choose a bazel command',
                shouldResume: async () => false,
            });
            command = picked.label;
            return inputArgs;
        };

        await MultiStepInput.run(pickCommand);

        if (!command) {
            return;
        }
        args.unshift(command);

        return this.run(args);

    }

    public getParent(item?: CommandHistoryItem): CommandHistoryItem | undefined {
        return undefined;
    }

    protected async getRootItems(): Promise<CommandHistoryItem[] | undefined> {
        if (!this.client) {
            return undefined;
        }
        let commands = (await this.client.listHistory(this.currentWorkspace?.cwd!)) || [];
        commands = commands.concat(await this.listLaunchItems());
        if (!commands) {
            return undefined;
        }
        return this.currentItems = this.createItems(commands);
    }

    private async listLaunchItems(): Promise<CommandHistory[]> {
        if (!this.currentWorkspace) {
            return [];
        }
        const filename = path.join(this.currentWorkspace.cwd!, FileName.LaunchBazelrc);
        if (!fs.existsSync(filename)) {
            return [];
        }
        const items: CommandHistory[] = [];
        const lines = fs.readFileSync(filename).toString().split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line) {
                continue;
            }
            if (line.startsWith('#')) {
                continue;
            }

            const tokens = line.split(/\s+/);
            if (tokens.length < 1) {
                continue;
            }

            let command = tokens.shift()!;
            const ruleClasses = command.split(':');
            if (ruleClasses.length > 1) {
                command = ruleClasses.shift()!;
            }
            tokens.unshift(command);

            items.push({
                id: '',
                cwd: this.currentWorkspace.cwd,
                outputBase: this.currentWorkspace.outputBase,
                arg: tokens,
                command: command,
                createTime: timestampNow(),
                updateTime: timestampNow(),
                ruleClass: ruleClasses,
            });
        }
        return items;
    }


    private createItems(commands: CommandHistory[]): CommandHistoryItem[] | undefined {
        if (!this.currentWorkspace) {
            return undefined;
        }

        let items: CommandHistoryItem[] = [];
        for (const command of commands) {
            if (this.currentWorkspace.cwd !== command.cwd) {
                continue;
            }
            items.push(new CommandHistoryItem(command));
        }

        items = items.filter(item => item.updated);

        items.sort((a, b) => {
            return b.updated.toMillis() - a.updated.toMillis();
        });

        return items;
    }

    async provideCommandCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken,
        lineNum: number,
        colNum: number,
        command: string,
        args: string[],
    ): Promise<vscode.CodeLens[] | undefined> {
        const cwd = path.dirname(document.uri.fsPath);

        const range = new vscode.Range(
            new vscode.Position(lineNum, colNum),
            new vscode.Position(lineNum, colNum + command.length));

        const lenses: vscode.CodeLens[] = [];
        lenses.push(new vscode.CodeLens(range, createRunCommand(command, args)));
        if (command === 'build' || command === 'test') {
            lenses.push(new vscode.CodeLens(range, createRunCommand(command, args, true)));
        }
        return lenses;
    }

}

function maybeTerminateDebugSession(
    session: vscode.DebugSession | undefined,
    sessionType: string,
    error: grpc.ServiceError | undefined,
    response: RunResponse | undefined) {

    if (!session) {
        return;
    }
    if (session.type !== sessionType) {
        return;
    }
    if (error || response?.finished) {
        session.customRequest('shutdown');
        return;
    }
}

export class CommandHistoryItem extends vscode.TreeItem {
    updated: luxon.DateTime;

    constructor(readonly history: CommandHistory) {
        super((history.arg?.slice(1) || []).join(' '));

        this.updated = luxon.DateTime.fromSeconds(Long.fromValue(history.updateTime?.seconds as Long).toNumber());
        let when = this.updated.toRelative();
        if (when === 'in 0 seconds') {
            when = 'just now';
        }
        this.contextValue = ContextValue.History;
        this.description = history.ruleClass?.join(', ') || '';
        this.tooltip = `${history.arg?.join(' ')} (${this.description}) [${when} in ${history.cwd}]`;
        this.iconPath = getCommandIcon(history);
        this.command = {
            title: 'Select',
            command: CommandName.HistorySelect,
            arguments: [this],
        };
    }

}

function getCommandIcon(history: CommandHistory): vscode.Uri | vscode.ThemeIcon {
    // lack of an ID means it came from the launch.bazelrc file
    // if (history.ruleClass && history.ruleClass.length) {
    //     return ruleClassIconUri(history.ruleClass[0]);
    // }
    return getCommandThemeIcon(history.command!);
}

function getCommandThemeIcon(command: string): vscode.ThemeIcon {
    switch (command) {
        case 'build':
            return ThemeIconDebugStart;
        case 'test':
            return ThemeIconDebugStackframe;
        case 'run':
            return ThemeIconDebugContinue;
        case 'query':
            return ThemeIconQuestion;
        default:
            return ThemeIconCircleOutline;
    }
}

function timestampNow(): Timestamp {
    const now = Math.floor(Date.now() / 1000);
    return { seconds: Long.fromNumber(now) };
}

function registerBazelCommandCodeLensProviders(registry: ICommandCodeLensProviderRegistry, provider: CommandCodeLensProvider) {
    // NOTE: this overrides the providers registered from
    // src/bazelrc/codelens.ts
    BazelCommands.forEach(command => {
        registry.registerCommandCodeLensProvider(command, provider);
    });
}

/**
 * Creates a Command from the given run context object.
 * 
 * @param runCtx 
 */
function createRunCommand(command: string, args: string[], debug?: boolean): vscode.Command {
    return {
        arguments: [{
            command: command,
            args: args,
        }],
        command: debug ? CommandName.HistoryDebug : CommandName.HistoryRun,
        title: debug ? 'debug' : command,
        tooltip: `${debug ? '(starlark debug) ' : ''} ${command} ${args.join(' ')}`,
    };
}


/**
 * A debug configuration provider for starlark debugging configurations.
 */
class DapstarDebugConfigurationProvider {
    /**
     * Provides [debug configuration](#DebugConfiguration) to the debug service.
     * If more than one debug configuration provider is registered for the same
     * type, debug configurations are concatenated in arbitrary order.
     *
     * @param folder The workspace folder for which the configurations are used
     * or `undefined` for a folderless setup.
     * @param token A cancellation token.
     * @return An array of [debug configurations](#DebugConfiguration).
     */
    provideDebugConfigurations?(folder: vscode.WorkspaceFolder | undefined, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return [{
            type: 'launch',
            name: 'Dapstar',
            request: '?',
        }];
    }

    /**
     * Resolves a [debug configuration](#DebugConfiguration) by filling in
     * missing values or by adding/changing/removing attributes. If more than
     * one debug configuration provider is registered for the same type, the
     * resolveDebugConfiguration calls are chained in arbitrary order and the
     * initial debug configuration is piped through the chain. Returning the
     * value 'undefined' prevents the debug session from starting. Returning the
     * value 'null' prevents the debug session from starting and opens the
     * underlying debug configuration instead.
     *
     * @param folder The workspace folder from which the configuration
     * originates from or `undefined` for a folderless setup.
     * @param debugConfiguration The [debug configuration](#DebugConfiguration)
     * to resolve.
     * @param token A cancellation token.
     * @return The resolved debug configuration or undefined or null.
     */
    resolveDebugConfiguration?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
        return undefined;
    }

    /**
     * This hook is directly called after 'resolveDebugConfiguration' but with
     * all variables substituted. It can be used to resolve or verify a [debug
     * configuration](#DebugConfiguration) by filling in missing values or by
     * adding/changing/removing attributes. If more than one debug configuration
     * provider is registered for the same type, the
     * 'resolveDebugConfigurationWithSubstitutedVariables' calls are chained in
     * arbitrary order and the initial debug configuration is piped through the
     * chain. Returning the value 'undefined' prevents the debug session from
     * starting. Returning the value 'null' prevents the debug session from
     * starting and opens the underlying debug configuration instead.
     *
     * @param folder The workspace folder from which the configuration
     * originates from or `undefined` for a folderless setup.
     * @param debugConfiguration The [debug configuration](#DebugConfiguration)
     * to resolve.
     * @param token A cancellation token.
     * @return The resolved debug configuration or undefined or null.
     */
    resolveDebugConfigurationWithSubstitutedVariables?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
        return undefined;
    }
}
