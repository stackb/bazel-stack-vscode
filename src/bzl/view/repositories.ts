import * as grpc from '@grpc/grpc-js';
import * as findUp from 'find-up';
import * as path from 'path';
import * as vscode from "vscode";
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { WorkspaceServiceClient } from "../../proto/build/stack/bezel/v1beta1/WorkspaceService";
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');


/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlRepositoryListView extends GrpcTreeDataProvider<RepositoryItem> {
    private static readonly viewId = 'bzl-repositories';
    private static readonly commandExplore = "feature.bzl.repository.explore";

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();

    constructor(
        private httpServerAddress: string,
        private client: WorkspaceServiceClient
    ) {
        super(BzlRepositoryListView.viewId);
        this.disposables.push(vscode.commands.registerCommand(BzlRepositoryListView.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    handleCommandExplore(item: RepositoryItem): void {
        const rel = ['local', item.repo.id];
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.httpServerAddress}/${rel.join('/')}`));
    }

    protected async getRootItems(): Promise<RepositoryItem[]> {
        const currentCwd = await this.getCurrentWorkspaceDir();
        return this.listWorkspaces().then(ww => this.createWorkspaceMetadataItems(ww, currentCwd!));
    }

    /**
     * Get the current directory where the WORKSPACE file resides.
     */
    private async getCurrentWorkspaceDir(): Promise<string | undefined> {
        return findUp(['WORKSPACE', 'WORKSPACE.bazel'], {
            cwd: vscode.workspace.rootPath,
        }).then(filename => filename ? path.dirname(filename): undefined);
    }

    private async listWorkspaces(): Promise<Workspace[]> {
        return new Promise<Workspace[]>((resolve, reject) => {
            this.client.List({}, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListWorkspacesResponse) => {
                if (err) {
                    console.log(`Workspace.List error`, err);
                    const config = vscode.workspace.getConfiguration("feature.bzl.listWorkspaces");
                    const currentStatus = config.get("status");
                    if (err.code !== currentStatus) {
                        await config.update("status", err.code);
                    }
                    reject(`could not rpc workspace list: ${err}`);
                } else {
                    resolve(resp?.workspace);
                }
            });
        });
    }

    private createWorkspaceMetadataItems(workspaces: Workspace[], currentCwd: string): RepositoryItem[] {
        const items = [];
        for (const workspace of workspaces) {
            if (workspace.tombstone) {
                continue;
            }
            if (!(workspace.cwd && workspace.outputBase)) {
                continue;
            }
            const name = workspace.name ? '@'+workspace.name : workspace.baseName;
            if (!name) {
                continue;
            }
            const cwd = workspace.cwd;
            if (!cwd) {
                continue;
            }
            const isCurrentWorkspace = cwd === currentCwd;
            if (isCurrentWorkspace) {
                this.onDidChangeCurrentRepository.fire(workspace);
            }
            const ico = isCurrentWorkspace ? bazelSvg : bazelWireframeSvg;
            items.push(new RepositoryItem(workspace, name, ico));
        }
        return items;
    }
    
}

export class RepositoryItem extends vscode.TreeItem {
    constructor(
        public readonly repo: Workspace,
        public readonly label: string,
        private icon: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return `${this.label} ${this.repo.cwd}`;
    }

    get description(): string {
        return this.repo.cwd!;
    }

    get command(): vscode.Command {
        return {
            command: 'vscode.openFolder',
            title: 'Open Bazel Repository Folder',
            arguments: [vscode.Uri.file(this.repo.cwd!)],
        };
    }
    
    get contextValue(): string {
        return 'repository';
    }
    
    iconPath = {
        light: this.icon,
        dark: this.icon,
    };

}