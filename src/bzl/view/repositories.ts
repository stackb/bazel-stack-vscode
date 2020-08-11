import * as grpc from '@grpc/grpc-js';
import * as findUp from 'find-up';
import * as path from 'path';
import * as vscode from "vscode";
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { WorkspaceServiceClient } from "../../proto/build/stack/bezel/v1beta1/WorkspaceService";


const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');
const DescUnknown = "<unknown>";

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BazelRepositoryListView implements vscode.Disposable, vscode.TreeDataProvider<RepositoryItem> {
    private readonly viewId = 'bazel-repositories';
    private readonly commandRefresh = "feature.bzl.repositories.view.refresh";

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<RepositoryItem | undefined> = new vscode.EventEmitter<RepositoryItem | undefined>();
    private currentWorkspace: Workspace | undefined;

    constructor(
        private client: WorkspaceServiceClient
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
    }

    readonly onDidChangeTreeData: vscode.Event<RepositoryItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: RepositoryItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: RepositoryItem): Promise<RepositoryItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }
    
    private async getRootItems(): Promise<RepositoryItem[]> {
        const currentCwd = await this.getCurrentWorkspaceDir();
        return this.listWorkspaces().then(ww => this.createWorkspaceMetadataItems(ww, currentCwd || ""));
    }

    /**
     * Get the current directory where the WORKSPACE file resides.
     */
    private async getCurrentWorkspaceDir(): Promise<string | undefined> {
        return findUp(['WORKSPACE', 'WORKSPACE.bazel'], {
            cwd: vscode.workspace.rootPath,
        }).then(filename => filename ? path.dirname(filename): undefined);
    }

    public async getCurrentRepository(): Promise<Workspace | undefined> {
        if (this.currentWorkspace) {
            return this.currentWorkspace;
        }
        const currentCwd = await this.getCurrentWorkspaceDir();
        const workspaces = await this.listWorkspaces();
        for (const workspace of workspaces) {
            if (workspace.cwd === currentCwd) {
                return workspace;
            }
        }
        return undefined;
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
                this.currentWorkspace = workspace;
            }
            const ico = isCurrentWorkspace ? bazelSvg : bazelWireframeSvg;
            items.push(new RepositoryItem(name, cwd, cwd, cwd, ico));
        }
        return items;
    }
    
    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}


class RepositoryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
        private cwd: string,
        private tt: string,
        private ico: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return this.tt || `${this.label}-${this.desc}`;
    }

    get description(): string {
        return this.desc;
    }

    get command(): vscode.Command {
        return {
            command: 'vscode.openFolder',
            title: 'Open Bazel Repository',
            arguments: [vscode.Uri.file(this.cwd)],
        };
    }
    
    iconPath = {
        light: this.ico,
        dark: this.ico,
    };

}