import * as path from 'path';
import * as vscode from "vscode";
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { GrpcTreeDataProvider } from './grpctreedataprovider';
const findProcess = require('find-process');

const serverSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');

type Server = {
    pid: number,
    name: string,
    cmd: string,
};

/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlServerListView extends GrpcTreeDataProvider<ServerItem> {
    private static readonly viewId = 'bzl-servers';
    private static readonly commandInterrupt = "feature.bzl.server.interrupt";
    private static readonly commandQuit = "feature.bzl.server.quit";
    private static readonly commandKill = "feature.bzl.server.terminate";

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();

    constructor(
    ) {
        super(BzlServerListView.viewId);
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandInterrupt, this.handleCommandInterrupt, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandQuit, this.handleCommandQuit, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandKill, this.handleCommandKill, this));
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    handleCommandInterrupt(item: ServerItem): void {
        this.handleCommandKill(item, 'SIGINT');
    }

    handleCommandQuit(item: ServerItem): void {
        this.handleCommandKill(item, 'SIGQUIT');
    }

    handleCommandTerminate(item: ServerItem): void {
        this.handleCommandKill(item, 'SIGTERM');
    }

    handleCommandKill(item: ServerItem, signal: string): void {
        try {
            process.kill(item.server.pid, signal);
            setTimeout(() => this.refresh(), 500);
        } catch (err) {
            console.warn(`could not send ${signal} ${JSON.stringify(item.server)}`, err);
        }
    }

    protected async getRootItems(): Promise<ServerItem[]> {
        const servers = await this.listServers();
        return this.createServerMetadataItems(servers);
    }

    private async listServers(): Promise<Server[]> {
        return findProcess('name', 'bazel', false)
            .then((list: Server[]) => list.filter(item => item.name.indexOf('bazel(') >= 0));
    }

    private createServerMetadataItems(servers: Server[]): ServerItem[] {
        const items = [];
        for (const server of servers) {
            items.push(new ServerItem(server, server.name, serverSvg));
        }
        return items;
    }
}


class ServerItem extends vscode.TreeItem {
    constructor(
        public readonly server: Server,
        public readonly label: string,
        private icon: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return this.server.cmd;
    }

    get description(): string {
        return "" + this.server.pid;
    }

    get contextValue(): string {
        return 'server';
    }

    iconPath = {
        light: this.icon,
        dark: this.icon,
    };

}