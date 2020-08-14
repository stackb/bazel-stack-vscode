import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { GrpcTreeDataProvider } from './grpctreedataprovider';
const findProcess = require('find-process');
const Tail = require('tail').Tail;

const serverSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');

type Server = {
    pid: number,
    name: string,
    cmd: string,

    version: string | undefined,
    productName: string | undefined,
    cwd: string | undefined,
    installBase: string | undefined,
    outputBase: string | undefined,
};

/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlServerListView extends GrpcTreeDataProvider<ServerItem> {
    private static readonly viewId = 'bzl-servers';
    private static readonly commandInterrupt = "feature.bzl.server.interrupt";
    private static readonly commandQuit = "feature.bzl.server.quit";
    private static readonly commandKill = "feature.bzl.server.terminate";
    private static readonly commandLog = "feature.bzl.server.command.log";
    private static readonly commandJavaLog = "feature.bzl.server.java.log";

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();

    private commandLogTailer: LogTailer | undefined;
    private javaLogTailer: LogTailer | undefined;

    constructor(
    ) {
        super(BzlServerListView.viewId);
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandInterrupt, this.handleCommandInterrupt, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandQuit, this.handleCommandQuit, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandKill, this.handleCommandKill, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandLog, this.handleCommandLog, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerListView.commandJavaLog, this.handleCommandJavaLog, this));
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    handleCommandInterrupt(item: ServerItem): void {
        this.handleCommandKill(item, 'SIGINT');
    }

    handleCommandLog(item: ServerItem): void {
        const server = item.server;
        if (!server.outputBase) {
            return;
        }
        if (!this.commandLogTailer || this.commandLogTailer.wasDisposed()) {
            const commandLogFile = path.join(server.outputBase, "command.log");
            if (!fs.existsSync(commandLogFile)) {
                return;
            }
            this.commandLogTailer = new LogTailer(
                `${server.productName} ${path.basename(server.cwd!)} command.log`,
                commandLogFile);
        }
        this.commandLogTailer.show();
    }

    handleCommandJavaLog(item: ServerItem): void {
        const server = item.server;
        if (!server.outputBase) {
            return;
        }
        if (!this.javaLogTailer || this.javaLogTailer.wasDisposed()) {
            const javaLogFile = path.join(server.outputBase, "java.log");
            if (!fs.existsSync(javaLogFile)) {
                return;
            }
            this.javaLogTailer = new LogTailer(
                `${server.productName} ${path.basename(server.cwd!)} java.log`,
                javaLogFile);
        }
        this.javaLogTailer.show();
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
            .then((list: Server[]) => list.filter(item => item.name.indexOf('bazel(') >= 0))
            .then((list: Server[]) => {
                return list.map(s => collectBazelVersion(s));
            });
    }

    private createServerMetadataItems(servers: Server[]): ServerItem[] {
        const items = [];
        for (const server of servers) {
            const label = (server.productName && server.version) ? `${server.productName} ${server.version}` : server.name;
            items.push(new ServerItem(server, label, serverSvg));
        }
        return items;
    }
}

class LogTailer implements vscode.Disposable {
    private tail: any;
    private channel: vscode.OutputChannel;

    constructor(
        public name: string,
        public filename: string,
    ) {
        this.channel = vscode.window.createOutputChannel(name);

        const tail = this.tail = new Tail(filename);

        tail.on("line", this.handleLine.bind(this));
        tail.on("error", this.handleError.bind(this));
    }

    show() {
        this.channel.show();
    }

    handleLine(line: string) {
        this.channel.appendLine(line);
    }

    handleError(error: any) {
        console.warn(`tail ${this.filename} error`, error);
        this.dispose();
    }

    dispose() {
        if (this.tail) {
            this.tail.unwatch();
            delete (this.tail);
        }
        if (this.channel) {
            this.channel.dispose();
            delete (this.channel);
        }
    }

    wasDisposed(): boolean {
        return typeof this.channel === 'undefined';
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
        return `${this.server.cwd} (${this.server.pid})`;
    }

    get contextValue(): string {
        return 'server';
    }

    iconPath = {
        light: this.icon,
        dark: this.icon,
    };

}

function collectBazelVersion(server: Server): Server {
    const args = server.cmd.split(/\s+/);

    server.productName = getOptionValue(args, "product_name");
    server.installBase = getOptionValue(args, "install_base");
    server.outputBase = getOptionValue(args, "output_base");
    server.cwd = getOptionValue(args, "workspace_directory");

    if (server.installBase) {
        const buildLabelTxtFilename = path.join(server.installBase, "build-label.txt");
        try {
            const label = fs.readFileSync(buildLabelTxtFilename);
            server.version = label.toString().trim();
        } catch (err) {
            console.warn(`could not determine bazel version ${buildLabelTxtFilename}`, err);
        }
    }

    return server;
}

function getOptionValue(args: string[], name: string): string | undefined {
    for (const arg of args) {
        const key = `--${name}=`;
        if (arg.startsWith(key)) {
            return arg.slice(key.length);
        }
    }
    return undefined;
}