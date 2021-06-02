import path = require('path');
import fs = require('fs');
import * as psList from 'ps-list';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { Container, MediaIconName } from '../../container';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { CommandName, ContextValue, ViewName } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

/**
 * Renders a view of the list of bazel servers.
 */
export class BazelServerView extends GrpcTreeDataProvider<ServerItem> {

    constructor(
        private onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined>,
    ) {
        super(ViewName.Bazel);
    }

    registerCommands() {
        super.registerCommands();
        this.addCommand(CommandName.BazelSigkill, this.handleCommandSigkill);
        this.addCommand(CommandName.BazelSigint, this.handleCommandSigint);
        this.addCommand(CommandName.BazelJavaLog, this.handleCommandJavaLog);

    }

    handleCommandSigkill(item: ServerItem): void {
        try {
            process.kill(item.server.pid, 'SIGKILL');
        } catch (err) {
            console.warn(`sigkill error: ${err.message}`);
        }
        this.refresh();
    }

    handleCommandSigint(item: ServerItem): void {
        process.kill(item.server.pid, 'SIGINT');
        this.refresh();
    }

    handleCommandJavaLog(item: ServerItem): void {
        const files = fs.readdirSync(item.server.outputBase).filter(filename => {
            const baseName = path.basename(filename);
            return baseName.startsWith('java.log.');
        });
        if (!files.length) {
            return;
        }

        files.sort((a, b) => {
            return fs.statSync(path.join(item.server.outputBase, b)).mtime.getTime() -
                fs.statSync(path.join(item.server.outputBase, a)).mtime.getTime();
        });

        // const log = path.join(item.server.outputBase, 'command.log');
        vscode.commands.executeCommand(BuiltInCommands.Open,
            vscode.Uri.file(path.join(item.server.outputBase, files[0])));
    }

    async getRootItems(): Promise<ServerItem[]> {
        const servers = await this.getServers();
        if (!servers) {
            return [];
        }
        return createServerItems(servers);
    }

    async getServers(): Promise<Server[]> {
        const servers: Server[] = [];
        const procs = await psList();
        procs.forEach(proc => {
            if (proc.name.indexOf('bazel(') !== 0) {
                return;
            }
            const server: Server = {
                name: proc.name,
                pid: proc.pid,
                cwd: getOption(proc, '--workspace_directory') || '',
                outputBase: getOption(proc, '--output_base') || '',
            };
            if (server.cwd === vscode.workspace.rootPath) {
                server.active = true;
                this.onDidChangeCurrentRepository.fire({
                    cwd: server.cwd,
                    outputBase: server.outputBase,
                    pid: server.pid,
                });

            }
            servers.push(server);
            
        });
        return servers;
    }
}

function getOption(proc: psList.ProcessDescriptor, option: string): string | undefined {
    const args = proc.cmd?.split(/\s+/);
    if (!args) {
        return undefined;
    }
    for (const arg of args) {
        if (!arg.startsWith(option)) {
            continue;
        }
        const parts = arg.split('=');
        return parts.slice(1).join('=');
    }
    return undefined;
}

interface Server {
    active?: boolean // if this server cwd is the workspace.rootPath
    name: string
    pid: number
    cwd: string
    outputBase: string
}

function createServerItems(servers: Server[]): ServerItem[] {
    return servers.map(createServerItem);
}

function createServerItem(server: Server): ServerItem {
    return new ServerItem(server);
}

export class ServerItem extends vscode.TreeItem {
    constructor(
        public readonly server: Server,
    ) {
        super(server.name);
        this.description = server.cwd;
        this.iconPath = Container.mediaIconPath(server.active ? MediaIconName.BazelIcon : MediaIconName.BazelWireframe);
        this.contextValue = ContextValue.Server;
    }
}