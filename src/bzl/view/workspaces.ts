import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";

const workspaceSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace.svg');
const workspaceGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace-gray.svg');

export type CurrentWorkspaceProvider = () => Promise<Workspace | undefined>;

/**
 * Renders a view for bazel (external) workspaces.
 */
export class BazelWorkspaceListView implements vscode.Disposable, vscode.TreeDataProvider<ExternalWorkspaceItem> {
    private readonly viewId = 'bazel-workspaces';
    private readonly commandRefresh = "feature.bzl.workspaces.view.refresh";
    private readonly commandSelect = "feature.bzl.workspace.select";

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<ExternalWorkspaceItem | undefined> = new vscode.EventEmitter<ExternalWorkspaceItem | undefined>();
    private currentWorkspace: Workspace | undefined;
    private externals: ExternalWorkspace[] | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    public onDidChangeCurrentWorkspace: vscode.EventEmitter<ExternalWorkspace | undefined> = new vscode.EventEmitter<ExternalWorkspace | undefined>();

    constructor(
        private client: ExternalWorkspaceServiceClient,
        private workspaceProvider: CurrentWorkspaceProvider,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandSelect, this.select, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
    }

    readonly onDidChangeTreeData: vscode.Event<ExternalWorkspaceItem | undefined> = this._onDidChangeTreeData.event;

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.externals = undefined;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    select(id: string): void {
        console.log(`selecting ew ${id}`, arguments);
        if (!id) {
            this.setCurrentExternalWorkspace(undefined);
            this.refresh();
            return;
        }
        const ew = this.getExternalWorkspaceById(id);
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
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("vscode://file/" + location));
        this.refresh();
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

    getTreeItem(element: ExternalWorkspaceItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ExternalWorkspaceItem): Promise<ExternalWorkspaceItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }
    
    private async getRootItems(): Promise<ExternalWorkspaceItem[]> {
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
            return Promise.reject('no current workspace');
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

    private createExternalWorkspaceMetadataItems(externals: ExternalWorkspace[]): ExternalWorkspaceItem[] {
        const items = [];
        items.push(new ExternalWorkspaceItem("", "DEFAULT", "", "", 
            this.currentExternalWorkspace ? workspaceGraySvg : workspaceSvg,
        ));
        
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
            const ico = (this.currentExternalWorkspace?.id === external.id) ? workspaceSvg : workspaceGraySvg;
            const location = this.getExternalWorkspaceAbsoluteLocation(external.relativeLocation);
            items.push(new ExternalWorkspaceItem(external.id, '@'+name, ruleClass, location || "", ico));
        }
        return items;
    }
    
    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}


class ExternalWorkspaceItem extends vscode.TreeItem {
    constructor(
        public readonly id: string,
        public readonly label: string,
        private ruleClass: string,
        private location: string,
        private ico: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return `${this.ruleClass} ${this.location}`;
    }

    get description(): string {
        return this.ruleClass;
    }

    get command(): vscode.Command | undefined {
        return {
            command: 'feature.bzl.workspace.select',
            title: 'Select external workspace',
            arguments: [this.id],
        };
    }
    
    iconPath = {
        light: this.ico,
        dark: this.ico,
    };

}