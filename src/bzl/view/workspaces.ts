import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { BzlHttpServerConfiguration } from '../configuration';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

// const workspaceSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace.svg');
// const workspaceGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-workspace-gray.svg');
const workspaceSvg = path.join(__dirname, '..', '..', '..', 'media', 'workspace.svg');
const workspaceGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'workspace-gray.svg');

/**
 * Renders a view for bazel (external) workspaces.
 */
export class BzlWorkspaceListView extends GrpcTreeDataProvider<WorkspaceItem> {
    private static readonly viewId = 'bzl-workspaces';
    static readonly commandSelect = "bzl-workspace.select";
    static readonly commandExplore = "bzl-workspace.explore";

    private currentWorkspace: Workspace | undefined;
    private externals: ExternalWorkspace[] | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    public onDidChangeCurrentExternalWorkspace: vscode.EventEmitter<ExternalWorkspace | undefined> = new vscode.EventEmitter<ExternalWorkspace | undefined>();

    constructor(
        private cfg: BzlHttpServerConfiguration,
        private client: ExternalWorkspaceServiceClient,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
    ) {
        super(BzlWorkspaceListView.viewId);

        this.disposables.push(vscode.commands.registerCommand(BzlWorkspaceListView.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(BzlWorkspaceListView.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.externals = undefined;
        this.setCurrentExternalWorkspace(undefined);
        this.refresh();
    }

    handleCommandExplore(item: WorkspaceItem): void {
        if (!this.currentWorkspace) {
            return;
        }
        let rel = ['local', this.currentWorkspace.id];
        if (item instanceof ExternalWorkspaceItem) {
            rel.push('external', '@' + item.external.name);
        }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.cfg.address}/${rel.join('/')}`));
    }

    handleCommandSelect(label: string): void {
        if (label === 'DEFAULT') {
            this.setCurrentExternalWorkspace(undefined);
            return;
        }

        const ew = this.getExternalWorkspaceById(label.slice(1));
        if (ew === this.currentExternalWorkspace) {
            return;
        }
        this.setCurrentExternalWorkspace(ew);

        const location = this.getExternalWorkspaceAbsoluteLocation(ew?.relativeLocation);
        if (!location) {
            return;
        }

        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("vscode://file/" + location));
    }

    private setCurrentExternalWorkspace(ew: ExternalWorkspace | undefined) {
        if (this.currentExternalWorkspace === ew) {
            return;
        }
        this.currentExternalWorkspace = ew;
        this.onDidChangeCurrentExternalWorkspace.fire(ew);
        this.refresh();
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

    protected async getRootItems(): Promise<WorkspaceItem[] | undefined> {
        return this.listExternals().then(pkgs => this.createExternalWorkspaceMetadataItems(pkgs));
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

    private createExternalWorkspaceMetadataItems(externals: ExternalWorkspace[]): WorkspaceItem[] | undefined {
        if (!this.currentWorkspace) {
            return undefined;
        }

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
            items.push(new ExternalWorkspaceItem(external, icon, location || "",));
        }
        
        return items;
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
            command: BzlWorkspaceListView.commandSelect,
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
        super("@" + external.name, icon);
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