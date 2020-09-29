import * as grpc from '@grpc/grpc-js';
import * as findUp from 'find-up';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../bzlclient';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';

const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');

/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlRepositoryListView extends BzlClientTreeDataProvider<RepositoryItem> {
    private static readonly viewId = 'bzl-repositories';
    public static readonly commandExplore = BzlRepositoryListView.viewId + '.explore';
    public static readonly commandSelect = BzlRepositoryListView.viewId + '.select';

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();
    private currentRepo: Workspace | undefined;

    constructor(
        private onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        super(BzlRepositoryListView.viewId, onDidChangeBzlClient);
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    registerCommands() {
        super.registerCommands();
        this.disposables.push(
            vscode.commands.registerCommand(BzlRepositoryListView.commandExplore, this.handleCommandExplore, this),
        );
        this.disposables.push(
            vscode.commands.registerCommand(BzlRepositoryListView.commandSelect, this.handleCommandSelect, this),
        );
    }

    handleCommandSelect(item: RepositoryItem): void {
        this.currentRepo = item.repo;
        this.refresh();
    }

    handleCommandExplore(item: RepositoryItem): void {
        const rel = ['local', item.repo.id];
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${this.client?.httpURL()}/${rel.join('/')}`));
    }

    protected async getRootItems(): Promise<RepositoryItem[] | undefined> {
        const currentCwd = await this.getCurrentWorkspaceDir();
        const workspaces = await this.listWorkspaces();
        return this.createWorkspaceMetadataItems(workspaces, currentCwd!);
    }

    /**
     * Get the current directory where the WORKSPACE file resides.
     */
    private async getCurrentWorkspaceDir(): Promise<string | undefined> {
        return findUp(['WORKSPACE', 'WORKSPACE.bazel'], {
            cwd: vscode.workspace.rootPath,
        }).then(filename => filename ? path.dirname(filename) : undefined);
    }

    private async listWorkspaces(): Promise<Workspace[]> {
        const client = this.client;
        if (!client) {
            return [];
        }
        await clearContextGrpcStatusValue(this.name);
        return new Promise<Workspace[]>((resolve, reject) => {
            client.workspaces.List({}, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListWorkspacesResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(resp?.workspace);
            });
        });
    }

    private createWorkspaceMetadataItems(workspaces: Workspace[], currentCwd: string): RepositoryItem[] | undefined {
        if (!workspaces) {
            return undefined;
        }
        const items = [];
        for (const workspace of workspaces) {
            if (workspace.tombstone) {
                continue;
            }
            if (!(workspace.cwd && workspace.outputBase)) {
                continue;
            }
            const name = workspace.name ? '@' + workspace.name : workspace.baseName;
            if (!name) {
                continue;
            }
            const cwd = workspace.cwd;
            if (!cwd) {
                continue;
            }

            let isCurrentWorkspace = false;
            if (this.currentRepo && this.currentRepo.cwd === workspace.cwd) {
                isCurrentWorkspace = true;
            } else if (cwd === currentCwd) {
                isCurrentWorkspace = true;
            }
            if (isCurrentWorkspace) {
                this.currentRepo = workspace;
                this.onDidChangeCurrentRepository.fire(workspace);
            }
            const ico = isCurrentWorkspace ? bazelSvg : bazelWireframeSvg;
            items.push(new RepositoryItem(this.client!, workspace, name, ico));
        }
        return items;
    }

}

export class RepositoryItem extends vscode.TreeItem {
    constructor(
        public readonly client: BzlClient,
        public readonly repo: Workspace,
        public readonly desc: string,
        private icon: string,
    ) {
        super(desc);
    }

    // @ts-ignore
    get tooltip(): string {
        return `${this.desc} ${this.repo.cwd}`;
    }

    // @ts-ignore
    get description(): string {
        return this.repo.cwd!;
    }

    // @ts-ignore
    get command(): vscode.Command {
        if (this.client.isRemoteClient) {
            return {
                command: BzlRepositoryListView.commandSelect,
                title: 'Select Remote Repository',
                arguments: [this],
            };
        } else {
            return {
                command: BuiltInCommands.OpenFolder,
                title: 'Open Bazel Repository Folder',
                arguments: [vscode.Uri.file(this.repo.cwd!)],
            };    
        }
    }

    // @ts-ignore
    get contextValue(): string {
        return 'repository';
    }

    iconPath = {
        light: this.icon,
        dark: this.icon,
    };

}