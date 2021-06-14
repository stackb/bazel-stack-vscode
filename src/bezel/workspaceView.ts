import * as vscode from 'vscode';
import { Container, MediaIconName } from '../container';
import { CommandName, ThemeIconFileSymlinkDirectory, ThemeIconFolderOpened, ThemeIconPackage, ThemeIconRepo, ThemeIconServerProcess, ViewName } from './constants';
import { setWorkspaceContextValue } from './feature';
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { TreeView } from './treeView';

// workspaceNotFoundErrorMessage is the error message returned by the lsp server
// when the workspace is not found.
const workspaceNotFoundErrorMessage = 'WORKSPACE_NOT_FOUND';

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<WorkspaceItem> {

    private info: BazelInfoResponse | undefined;

    constructor(
        private client: BezelLSPClient,
    ) {
        super(ViewName.Workspace);
    }

    registerCommands() {
        super.registerCommands();

        this.addCommand(CommandName.Kill, this.handleCommandServerKill);
        this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
    }

    getOrCreateTerminal(name: string): vscode.Terminal {
        const terminal = vscode.window.createTerminal(name);
        this.disposables.push(terminal);
        return terminal;
    }

    async handleCommandOpenTerminal(item: WorkspaceInfoPathItem): Promise<void> {
        const terminal = this.getOrCreateTerminal(item.id!);
        terminal.sendText(`cd ${item.description}`);
        terminal.show();
    }

    async handleCommandServerKill(item: WorkspaceServerPidItem): Promise<void> {
        if (!this.info) {
            return;
        }

        const action = await vscode.window.showWarningMessage(`This will forcefully restart the bazel server for ${this.info?.workspace}. Are you sure?`, 'Confirm', 'Cancel');
        if (action !== 'Confirm') {
            return;
        }

        await this.client.bazelKill(this.info.serverPid);

        return this.refresh();
    }

    public async getChildren(element?: WorkspaceItem): Promise<WorkspaceItem[] | undefined> {
        if (!element) {
            return this.getRootItems();
        }
        if (element instanceof WorkspaceNameItem) {
            return element.getChildren();
        } 
        return undefined;
    }

    protected async getRootItems(): Promise<WorkspaceItem[] | undefined> {
        try {
            const info = await this.client.bazelInfo();
            this.info = info;
            setWorkspaceContextValue('LOADED');
            return [
                new WorkspaceNameItem(info),
                // new WorkspacePackagesItem(this.client),
                // new WorkspaceExternalsItem(this.client),
            ];    
        } catch (e) {
            if (e.message === workspaceNotFoundErrorMessage) {
                setWorkspaceContextValue(workspaceNotFoundErrorMessage);
            }
            return [];
        }
    }

}

class WorkspaceItem extends vscode.TreeItem {
    constructor(label: string) {
        super(label);
    }
}

class WorkspaceNameItem extends WorkspaceItem {
    constructor(private info: BazelInfoResponse) {
        super('@' + info.workspaceName);
        this.contextValue = 'server_name';
        this.description = info.workspace;
        this.iconPath = Container.media(MediaIconName.BazelIcon);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }

    getChildren(): WorkspaceItem[] {
        return [
            new WorkspaceServerPidItem('server_pid', this.info.serverPid),
            new WorkspaceInfoPathItem('output_base', this.info.outputBase),
            new WorkspaceInfoPathItem('execution_root', this.info.executionRoot),
            new WorkspaceInfoPathItem('bazel-bin', this.info.bazelBin),
            new WorkspaceInfoPathItem('bazel-testlogs', this.info.bazelTestlogs),
        ]
    }

}

class WorkspaceInfoPathItem extends WorkspaceItem {
    constructor(label: string, value: string) {
        super(label);
        this.id = label;
        this.description = value;
        this.contextValue = 'server_path';
        this.iconPath = ThemeIconFileSymlinkDirectory;
    }
}

class WorkspaceServerPidItem extends WorkspaceItem {
    constructor(label: string, value: number) {
        super(label);
        this.description = `${value}`;
        this.contextValue = 'server_pid';
        this.iconPath = ThemeIconServerProcess;
    }
}

class WorkspacePackagesItem extends WorkspaceItem {
    constructor(private client: BezelLSPClient) {
        super('Packages');
        this.description = 'bazel packages';
        this.iconPath = ThemeIconPackage;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
}

class WorkspaceExternalsItem extends WorkspaceItem {
    constructor(private client: BezelLSPClient) {
        super('Externals');
        this.description = 'bazel external workspaces';
        this.iconPath = ThemeIconRepo;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    }
}