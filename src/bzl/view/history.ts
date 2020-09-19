import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as vscode from 'vscode';
import { CommandHistory } from '../../proto/build/stack/bezel/v1beta1/CommandHistory';
import { HistoryClient } from '../../proto/build/stack/bezel/v1beta1/History';
import { ListCommandHistoryResponse } from '../../proto/build/stack/bezel/v1beta1/ListCommandHistoryResponse';
import { RunRequest } from '../../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../../proto/build/stack/bezel/v1beta1/RunResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { setContextGrpcStatusValue } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';
import Long = require('long');

interface CommandRunner {
    runTask(
        request: RunRequest,
        matchers: string[],
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
    ): Promise<void>;
}

/**
 * Renders a view for bazel command history.
 */
export class BzCommandHistoryView extends GrpcTreeDataProvider<CommandHistoryItem> {
    private static readonly viewId = 'bzl-history';
    static readonly commandSelect = 'bzl-history.select';
    static readonly commandExplore = 'bzl-history.explore';
    static readonly commandRun = 'bzl-history.run';

    private currentWorkspace: Workspace | undefined;

    constructor(
        private httpServerAddress: string,
        private client: HistoryClient,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
        commandDidRun: vscode.EventEmitter<RunRequest>,
        private commandRunner: CommandRunner,

        skipRegisterCommands = false,
    ) {
        super(BzCommandHistoryView.viewId);
        if (!skipRegisterCommands) {
            this.registerCommands();
        }
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(commandDidRun.event(this.handleCommandDidRun, this));
    }

    registerCommands() {
        super.registerCommands();
        this.disposables.push(vscode.commands.registerCommand(BzCommandHistoryView.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(BzCommandHistoryView.commandExplore, this.handleCommandExplore, this));        
        this.disposables.push(vscode.commands.registerCommand(BzCommandHistoryView.commandRun, this.handleCommandRun, this));        
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.refresh();
    }

    handleCommandDidRun(request: RunRequest) {
        this.refresh();
    }

    handleCommandSelect(label: string): void {
    }

    handleCommandExplore(item: CommandHistoryItem): void {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.httpServerAddress}/command/${item.history.id}`));
    }

    async handleCommandRun(item: CommandHistoryItem): Promise<any> {
        if (!this.currentWorkspace) {
            return;
        }

        const request: RunRequest = {
            arg: item.history.arg,
            workspace: this.currentWorkspace,
        };

        const callback = (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => {
            if (err) {
                console.warn('run error', err);
                return;
            }
            if (md) {
                console.warn('run metadata', md);
                return;
            }
        };
        const matchers: string[] = ['starlark', 'javac'];
        // const matchers: string[] = ['starlark', 'go', '$go', '$tsc', 'proto'];
        return this.commandRunner.runTask(request, matchers, callback);
    }

    protected async getRootItems(): Promise<CommandHistoryItem[] | undefined> {
        const commands = await this.listHistory();
        if (!commands) {
            return undefined;
        }
        return this.createItems(commands);
    }

    private async listHistory(): Promise<CommandHistory[] | undefined> {
        return new Promise<CommandHistory[]>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 120);
            this.client.List({}, new grpc.Metadata(), { deadline: deadline }, async (err?: grpc.ServiceError, resp?: ListCommandHistoryResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(resp?.history);
            });
        });
    }

    private createItems(commands: CommandHistory[]): CommandHistoryItem[] | undefined {
        if (!this.currentWorkspace) {
            return undefined;
        }

        const items: CommandHistoryItem[] = [];
        for (const command of commands) {
            if (this.currentWorkspace.cwd !== command.cwd) {
                continue;
            }
            items.push(new CommandHistoryItem(command));
        }

        items.sort((a, b) => {
            return b.updated.toMillis() - a.updated.toMillis();
        });
        
        return items;
    }

}

export class CommandHistoryItem extends vscode.TreeItem {
    updated: luxon.DateTime;

    constructor(readonly history: CommandHistory) {
        super(history.command!);
        this.contextValue = 'history';
        this.updated = luxon.DateTime.fromSeconds(Long.fromValue(history.updateTime?.seconds as Long).toNumber());
        this.description = (history.arg?.slice(1) || []).join(' ') + (history.ruleClass ? ` (${history.ruleClass.join(', ')})` : '');
        this.tooltip = `${this.updated.toRelative()}: ${this.label} ${this.description} (${history.cwd})`;
        this.iconPath = getCommandIcon(history.command!, history.ruleClass);
    }

}

function getCommandIcon(command: string, ruleClasses: string[] | undefined): vscode.Uri | vscode.ThemeIcon {
    if (ruleClasses && ruleClasses.length) {
        return vscode.Uri.parse(`https://results.bzl.io/v1/image/rule/${ruleClasses[0]}.svg`);
    }
    return getCommandThemeIcon(command);
}

function getCommandThemeIcon(command: string): vscode.ThemeIcon {
    switch (command) {
        case 'build':
            return new vscode.ThemeIcon('play');
        case 'test':
            return new vscode.ThemeIcon('run-all');
        case 'run':
            return new vscode.ThemeIcon('play-circle');
        case 'query':
            return new vscode.ThemeIcon('question');
        default:
            return new vscode.ThemeIcon('circle-outline');
    }
}

