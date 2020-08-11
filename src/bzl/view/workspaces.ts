import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { BzlHttpServerConfiguration } from '../configuration';

const workspaceSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace.svg');
const workspaceGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace-gray.svg');

export type CurrentWorkspaceProvider = () => Promise<Workspace | undefined>;

/**
 * Renders a view for bazel (external) workspaces.
 */
export class BazelWorkspaceListView implements vscode.Disposable, vscode.TreeDataProvider<WorkspaceItem> {
    private readonly viewId = 'bazel-workspaces';
    private readonly commandRefresh = "feature.bzl.workspaces.view.refresh";
    private readonly commandSelect = "feature.bzl.workspace.select";
    private readonly commandExplore = "feature.bzl.workspace.explore";

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<WorkspaceItem | undefined> = new vscode.EventEmitter<WorkspaceItem | undefined>();
    private currentWorkspace: Workspace | undefined;
    private externals: ExternalWorkspace[] | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    public onDidChangeCurrentWorkspace: vscode.EventEmitter<ExternalWorkspace | undefined> = new vscode.EventEmitter<ExternalWorkspace | undefined>();

    constructor(
        private cfg: BzlHttpServerConfiguration,
        private client: ExternalWorkspaceServiceClient,
        private workspaceProvider: CurrentWorkspaceProvider,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
    }

    readonly onDidChangeTreeData: vscode.Event<WorkspaceItem | undefined> = this._onDidChangeTreeData.event;

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.externals = undefined;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    handleCommandExplore(item: WorkspaceItem): void {
        if (!this.currentWorkspace) {
            return;
        }
        let rel = ['local', this.currentWorkspace.id];
        if (item instanceof ExternalWorkspaceItem) {
            rel.push('external', '@'+item.external.name);
        }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.cfg.address}/${rel.join('/')}`));
    }

    handleCommandSelect(label: string): void {
        if (label === 'DEFAULT') {
            this.setCurrentExternalWorkspace(undefined);
            this.refresh();
            return;
        }

        const ew = this.getExternalWorkspaceById(label.slice(1));
        if (ew === this.currentExternalWorkspace) {
            this.refresh();
            return;
        }
        this.setCurrentExternalWorkspace(ew);

        const location = this.getExternalWorkspaceAbsoluteLocation(ew?.relativeLocation);
        if (!location) {
            this.refresh();
            return;
        }

        this.refresh();

        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("vscode://file/" + location));
    }

    private setCurrentExternalWorkspace(ew: ExternalWorkspace | undefined) {
        this.currentExternalWorkspace = ew;
        this.onDidChangeCurrentWorkspace.fire(ew);
    }

    getExternalWorkspaceAbsoluteLocation(location: string | undefined): string | undefined {
        if (!location) {
            return undefined;
        }
        if (!this.currentWorkspace) {
            return undefined;
        }
        if (location.startsWith("external")) {
            location = path.join(this.currentWorkspace.outputBase!, location);
        } else {
            location = path.join(this.currentWorkspace.cwd!, location);
        }
        return location;
    }

    getExternalWorkspaceById(id: string): ExternalWorkspace | undefined {
        if (!this.externals) {
            return undefined;
        }
        for (const ew of this.externals) {
            if (ew.id === id) {
                return ew;
            }
        }
        return undefined;
    }

    getTreeItem(element: WorkspaceItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ExternalWorkspaceItem): Promise<WorkspaceItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }
    
    private async getRootItems(): Promise<WorkspaceItem[]> {
        return this.listExternals().then(pkgs => this.createExternalWorkspaceMetadataItems(pkgs));
    }

    public async getCurrentExternalWorkspace(): Promise<ExternalWorkspace | undefined> {
        return this.currentExternalWorkspace;
    }

    private async listExternals(): Promise<ExternalWorkspace[]> {
        if (this.externals) {
            return Promise.resolve(this.externals);
        }
        if (!this.currentWorkspace) {
            return Promise.resolve([]);
        }
        return new Promise<ExternalWorkspace[]>((resolve, reject) => {
            this.client.ListExternal({
                workspace: this.currentWorkspace,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ExternalListWorkspacesResponse) => {
                if (err) {
                    console.log(`External.List error`, err);
                    const config = vscode.workspace.getConfiguration("feature.bzl.listExternals");
                    const currentStatus = config.get("status");
                    if (err.code !== currentStatus) {
                        await config.update("status", err.code);
                    }
                    reject(`could not rpc external workspace list: ${err}`);
                } else {
                    this.externals = resp?.workspace;
                    resolve(this.externals);
                }
            });
        });
    }

    private createExternalWorkspaceMetadataItems(externals: ExternalWorkspace[]): WorkspaceItem[] {
        const items = [];
        items.push(new DefaultWorkspaceItem(this.currentExternalWorkspace ? workspaceGraySvg : workspaceSvg));
        
        for (const external of externals) {
            if (!external.id) {
                continue;
            }
            const name = external.name;
            if (!name) {
                continue;
            }
            const ruleClass = external.ruleClass;
            if (!ruleClass) {
                continue;
            }
            // console.log(`rel: ${external.relativeLocation}`);
            if (external.relativeLocation?.startsWith("/DEFAULT.WORKSPACE") && external.name !== 'bazel_tools') {
                continue;
            }
            if (external.relativeLocation?.startsWith("external/bazel_tools/")) {
                continue;
            }
            const icon = (this.currentExternalWorkspace?.id === external.id) ? workspaceSvg : workspaceGraySvg;
            const location = this.getExternalWorkspaceAbsoluteLocation(external.relativeLocation);
            items.push(new ExternalWorkspaceItem(external, icon, location || "", ));
        }
        return items;
    }
    
    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

class WorkspaceItem extends vscode.TreeItem {
    constructor(readonly label: string, readonly icon: string) {
        super(label);
    }

    iconPath = {
        light: this.icon,
        dark: this.icon,
    };

    get command(): vscode.Command | undefined {
        return {
            command: 'feature.bzl.workspace.select',
            title: 'Select external workspace',
            arguments: [this.label],
        };
    }   
    
    get contextValue(): string {
        return "workspace";
    }
}

class DefaultWorkspaceItem extends WorkspaceItem {
    constructor(icon: string) {
        super("DEFAULT", icon);
    }

    get tooltip(): string {
        return this.description;
    }

    get description(): string {
        return 'workspace';
    }
}

class ExternalWorkspaceItem extends WorkspaceItem {
    constructor(
        public readonly external: ExternalWorkspace,
        icon: string,
        private location: string,
    ) {
        super("@"+external.name, icon);
    }

    get tooltip(): string {
        return `${this.external.ruleClass} ${this.location}`;
    }

    get description(): string {
        if (this.external.actual) {
            return this.external.actual;
        }
        return this.external.ruleClass || "";
    }

    get command(): vscode.Command | undefined {
        if (this.location.indexOf("DEFAULT.WORKSPACE") >= 0) {
            return undefined;
        }
        return super.command;
    }    

}