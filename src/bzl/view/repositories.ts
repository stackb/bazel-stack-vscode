import * as grpc from '@grpc/grpc-js';
import * as findUp from 'find-up';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');

/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlRepositoryListView extends GrpcTreeDataProvider<RepositoryItem> {
    private static readonly viewId = 'bzl-repositories';
    public static readonly commandExplore = 'feature.bzl.repository.explore';

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();

    constructor(
        private httpServerAddress: string,
        private client: WorkspaceServiceClient,
        skipRegisterCommands = false,
    ) {
        super(BzlRepositoryListView.viewId);
        if (!skipRegisterCommands) {
            this.registerCommands();
        }
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    registerCommands() {
        super.registerCommands();
        this.disposables.push(
            vscode.commands.registerCommand(BzlRepositoryListView.commandExplore, this.handleCommandExplore, this),
        );
    }

    handleCommandExplore(item: RepositoryItem): void {
        const rel = ['local', item.repo.id];
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`http://${this.httpServerAddress}/${rel.join('/')}`));
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
        await clearContextGrpcStatusValue(this.name);
        return new Promise<Workspace[]>((resolve, reject) => {
            this.client.List({}, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListWorkspacesResponse) => {
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
            if (name === 'i868039') {
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

    // @ts-ignore
    get tooltip(): string {
        return `${this.label} ${this.repo.cwd}`;
    }

    // @ts-ignore
    get description(): string {
        return this.repo.cwd!;
    }

    // @ts-ignore
    get command(): vscode.Command {
        return {
            command: BuiltInCommands.OpenFolder,
            title: 'Open Bazel Repository Folder',
            arguments: [vscode.Uri.file(this.repo.cwd!)],
        };
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