import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as vscode from 'vscode';
import { BazelCommands as bazelCommands } from '../../bazelrc/configuration';
import { BuiltInCommands } from '../../constants';
import { InputStep, MultiStepInput } from '../../multiStepInput';
import { CommandHistory } from '../../proto/build/stack/bezel/v1beta1/CommandHistory';
import { DeleteCommandHistoryResponse } from '../../proto/build/stack/bezel/v1beta1/DeleteCommandHistoryResponse';
import { ListCommandHistoryResponse } from '../../proto/build/stack/bezel/v1beta1/ListCommandHistoryResponse';
import { RunRequest } from '../../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../../proto/build/stack/bezel/v1beta1/RunResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { Timestamp } from '../../proto/google/protobuf/Timestamp';
import { BzlClient } from '../bzlclient';
import { CommandTaskRunner } from '../commandrunner';
import { CommandName, ContextValue, FileName, setContextGrpcStatusValue, ThemeIconCircleOutline, ThemeIconDebugContinue, ThemeIconDebugStackframe, ThemeIconDebugStart, ThemeIconQuestion, ViewName } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');
import path = require('path');
import fs = require('graceful-fs');

/**
 * Renders a view for bazel command history.
 */
export class BzlCommandHistoryView extends BzlClientTreeDataProvider<CommandHistoryItem> {

    private currentWorkspace: Workspace | undefined;
    private currentItems: CommandHistoryItem[] | undefined;
    private selectedItem: CommandHistoryItem | undefined;

    constructor(
        onDidChangeBzlClient: vscode.Event<BzlClient>,
        workspaceChanged: vscode.Event<Workspace | undefined>,
        commandDidRun: vscode.Event<RunRequest>,
        private commandTaskRunner: CommandTaskRunner,
    ) {
        super(ViewName.History, onDidChangeBzlClient);
        workspaceChanged(this.handleWorkspaceChanged, this, this.disposables);
        commandDidRun(this.handleCommandDidRun, this, this.disposables);
    }

    registerCommands() {
        super.registerCommands();
        this.addCommand(CommandName.HistorySelect, this.handleCommandSelect);
        this.addCommand(CommandName.HistoryExplore, this.handleCommandExplore);
        this.addCommand(CommandName.HistoryRun, this.handleCommandRun);
        this.addCommand(CommandName.HistoryDelete, this.handleCommandDelete);
        this.addCommand(CommandName.HistoryAdd, this.handleCommandAdd);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.refresh();
    }

    handleCommandDidRun(request: RunRequest) {
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

    async handleCommandRun(item?: CommandHistoryItem): Promise<any> {
        if (!this.currentWorkspace) {
            return;
        }

        // If there is no item provided, it was called via keybinding or menu.
        // Find the most recent one
        if (!item) {
            item = await this.selectMostRecentItem();
            if (!item) {
                return;
            }
        }

        this.selectedItem = item;
        return this.run(item.history.arg);
    }

    async run(args: string[] | undefined): Promise<any> {
        if (!args) {
            return;
        }

        const request: RunRequest = {
            arg: args,
            workspace: this.currentWorkspace,
        };

        const callback = (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => {
            if (err) {
                console.warn('run error', err);
                return;
            }
        };

        return this.commandTaskRunner.runTask(request, callback);
    }

    async handleCommandDelete(item?: CommandHistoryItem): Promise<any> {
        if (!this.currentWorkspace) {
            return;
        }
        if (!item) {
            return;
        }

        await this.deleteById(item.history.id!);

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
        let commands = (await this.listHistory()) || [];
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

    private async listHistory(): Promise<CommandHistory[] | undefined> {
        const client = this.client;
        if (!client) {
            return undefined;
        }
        return new Promise<CommandHistory[]>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 120);
            client.history.List({
                cwd: this.currentWorkspace?.cwd
            }, new grpc.Metadata(), { deadline: deadline }, async (err?: grpc.ServiceError, resp?: ListCommandHistoryResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(resp?.history);
            });
        });
    }

    private async deleteById(id: string): Promise<DeleteCommandHistoryResponse | undefined> {
        const client = this.client;
        if (!client) {
            return undefined;
        }
        return new Promise<DeleteCommandHistoryResponse>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 120);
            client.history.Delete({
                id: id
            }, new grpc.Metadata(), { deadline: deadline }, async (err?: grpc.ServiceError, resp?: DeleteCommandHistoryResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(resp);
            });
        });
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