import * as findUp from 'find-up';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { Container, MediaIconName } from '../../container';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../bzlclient';
import { CommandName, ContextValue, FileName, ViewName } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
const slash = require('slash');

/**
 * Renders a view of bazel repositories on the current workstation.
 */
export class BzlRepositoryListView extends BzlClientTreeDataProvider<RepositoryItem> {

    public onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();
    private currentRepo: Workspace | undefined;
    private wasManuallyRefreshed = false;

    constructor(
        onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        super(ViewName.Repository, onDidChangeBzlClient);
        this.disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.refresh, this));
    }

    registerCommands() {
        super.registerCommands();
        this.addCommand(CommandName.RepositoryExplore, this.handleCommandExplore);
        this.addCommand(CommandName.RepositorySelect, this.handleCommandSelect);
        this.addCommand(CommandName.RepositoryOpenTerminal, this.handleCommandOpenTerminal);
    }

    protected handleCommandRefresh() {
        this.wasManuallyRefreshed = true;
        super.handleCommandRefresh();
    }

    handleCommandSelect(item: RepositoryItem): void {
        this.currentRepo = item.repo;
        this.refresh();
    }

    handleCommandExplore(item: RepositoryItem): void {
        const rel = ['local', item.repo.id];
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${this.client?.httpURL()}/${rel.join('/')}`));
    }

    handleCommandOpenTerminal(item: RepositoryItem): void {
        if (!(item instanceof RepositoryItem)) {
            return;
        }
        const terminal = vscode.window.createTerminal(item.repo.baseName);
        this.disposables.push(terminal);
        terminal.sendText(`cd ${item.repo.cwd}`, true);
        terminal.show();
    }

    protected async getRootItems(): Promise<RepositoryItem[] | undefined> {
        const currentCwd = await this.getCurrentWorkspaceDir();
        const workspaces = await this.client?.listWorkspaces(this.wasManuallyRefreshed);
        return this.createWorkspaceMetadataItems(workspaces, currentCwd!);
    }

    /**
     * Get the current directory where the WORKSPACE file resides.
     */
    private async getCurrentWorkspaceDir(): Promise<string | undefined> {
        return findUp([FileName.WORKSPACE, FileName.WORKSPACEBazel], {
            cwd: vscode.workspace.rootPath,
        }).then(filename => filename ? slash(path.dirname(filename)) : undefined);
    }

    private createWorkspaceMetadataItems(workspaces: Workspace[] | undefined, currentCwd: string): RepositoryItem[] | undefined {
        if (!this.client) {
            return;
        }
        if (!workspaces) {
            return;
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
            const ico = Container.media(isCurrentWorkspace ? MediaIconName.BazelIcon : MediaIconName.BazelWireframe);
            items.push(new RepositoryItem(this.client, workspace, name, ico));
        }
        return items;
    }
}

export class RepositoryItem extends vscode.TreeItem {
    constructor(
        public readonly client: BzlClient,
        public readonly repo: Workspace,
        public readonly desc: string,
        public iconPath: string,
    ) {
        super(desc);
        this.description = this.repo.cwd;
        this.tooltip = `${this.desc} ${this.repo.cwd}`;
        this.contextValue = ContextValue.Repository;
    }

    // @ts-ignore
    get command(): vscode.Command {
        if (this.client.isRemoteClient) {
            return {
                command: CommandName.RepositorySelect,
                title: 'Select Remote Repository',
                arguments: [this],
            };
        }
        return {
            command: BuiltInCommands.OpenFolder,
            title: 'Open Bazel Repository Folder',
            arguments: [vscode.Uri.file(this.repo.cwd!)],
        };
    }

}