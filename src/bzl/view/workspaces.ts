import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from 'vscode';
import { getFileUriForLocation } from '../../common/utils';
import { BuiltInCommands } from '../../constants';
import { ExternalListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../bzlclient';
import { clearContextGrpcStatusValue, CommandName, ContextValue, setContextGrpcStatusValue, ViewName, workspaceGraySvgIcon, workspaceSvgIcon } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';

/**
 * Renders a view for bazel (external) workspaces.
 */
export class BzlWorkspaceListView extends BzlClientTreeDataProvider<WorkspaceItem> {

    private currentWorkspace: Workspace | undefined;
    private externals: ExternalWorkspace[] | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    public onDidChangeCurrentExternalWorkspace: vscode.EventEmitter<ExternalWorkspace | undefined> = new vscode.EventEmitter<ExternalWorkspace | undefined>();

    constructor(
        onDidChangeBzlClient: vscode.Event<BzlClient>,
        workspaceChanged: vscode.Event<Workspace | undefined>,
    ) {
        super(ViewName.Workspace, onDidChangeBzlClient);

        this.disposables.push(workspaceChanged(this.handleWorkspaceChanged, this));
    }

    registerCommands() {
        super.registerCommands();
        this.addCommand(CommandName.WorkspaceSelect, this.handleCommandSelect);
        this.addCommand(CommandName.WorkspaceExplore, this.handleCommandExplore);
        this.addCommand(CommandName.WorkspaceOpenOutputBase, this.handleCommandOpenCurrentExternalWorkspaceTerminal);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.externals = undefined;
        this.setCurrentExternalWorkspace(undefined);
        this.refresh();
    }

    handleCommandOpenCurrentExternalWorkspaceTerminal(item: ExternalWorkspaceItem): void {
        if (!(item instanceof ExternalWorkspaceItem)) {
            return;
        }
        const repo = this.currentWorkspace;
        if (!repo) {
            return;
        }
        
        const name = `@${item.external.name} (external workspace)`;
        const dir = path.join(repo.outputBase!, 'external', item.external.name!);

        const terminal = vscode.window.createTerminal(name);
        this.disposables.push(terminal);
        terminal.sendText(`cd ${dir}`, true);
        terminal.show();
    }

    handleCommandExplore(item: WorkspaceItem): void {
        if (!this.currentWorkspace) {
            return;
        }
        let rel = ['local', this.currentWorkspace.id];
        if (item instanceof ExternalWorkspaceItem) {
            rel.push('external', '@' + item.external.name);
        }
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${this.client?.httpURL()}/${rel.join('/')}`));
    }

    handleCommandSelect(item: WorkspaceItem): void {
        if (item.label === 'DEFAULT') {
            this.setCurrentExternalWorkspace(undefined);
            return;
        }

        const ew = this.getExternalWorkspaceById(item.label.slice(1));
        if (ew === this.currentExternalWorkspace) {
            return;
        }
        this.setCurrentExternalWorkspace(ew);

        const location = this.getExternalWorkspaceAbsoluteLocation(ew?.relativeLocation);
        if (!location) {
            return;
        }

        vscode.commands.executeCommand(BuiltInCommands.Open, getFileUriForLocation(location));
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
        if (path.isAbsolute(location)) {
            return location;
        }
        if (!this.currentWorkspace) {
            return undefined;
        }
        if (location.startsWith('external')) {
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
        const externals = await this.listExternals();
        if (!externals) {
            return undefined;
        }
        return this.createExternalWorkspaceMetadataItems(externals);
    }

    private async listExternals(): Promise<ExternalWorkspace[] | undefined> {
        const client = this.client;
        if (!client) {
            return undefined;
        }
        if (!this.currentWorkspace) {
            return undefined;
        }
        if (this.externals) {
            return this.externals;
        }

        await clearContextGrpcStatusValue(this.name);
        this.externals = undefined;
        return new Promise<ExternalWorkspace[]>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 120);
            client.externals.ListExternal({
                workspace: this.currentWorkspace,
            }, new grpc.Metadata(), { deadline: deadline }, async (err?: grpc.ServiceError, resp?: ExternalListWorkspacesResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(this.externals = resp?.workspace);
            });
        });
    }

    private createExternalWorkspaceMetadataItems(externals: ExternalWorkspace[]): WorkspaceItem[] | undefined {
        if (!this.currentWorkspace) {
            return undefined;
        }

        const items = [];
        items.push(new DefaultWorkspaceItem(this.currentExternalWorkspace ? workspaceGraySvgIcon : workspaceSvgIcon));

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
            if (external.relativeLocation?.startsWith('/DEFAULT.WORKSPACE') && external.name !== 'bazel_tools') {
                continue;
            }
            if (external.relativeLocation?.startsWith('external/bazel_tools/')) {
                continue;
            }
            const icon = (this.currentExternalWorkspace?.id === external.id) ? workspaceSvgIcon : workspaceGraySvgIcon;
            const location = this.getExternalWorkspaceAbsoluteLocation(external.relativeLocation);
            items.push(new ExternalWorkspaceItem(external, icon, location || '',));
        }

        return items;
    }

}

export class WorkspaceItem extends vscode.TreeItem {
    constructor(
        public label: string, 
        public iconPath: string,
    ) {
        super(label);
        this.contextValue = ContextValue.Workspace;
        this.command = {
            command: CommandName.WorkspaceSelect,
            title: 'Select external workspace',
            arguments: [this],
        };
    }
}

class DefaultWorkspaceItem extends WorkspaceItem {
    constructor(icon: string) {
        super('DEFAULT', icon);
        this.description = 'workspace';
        this.tooltip = this.description;
    }
}

class ExternalWorkspaceItem extends WorkspaceItem {
    constructor(
        public readonly external: ExternalWorkspace,
        icon: string,
        private location: string,
    ) {
        super('@' + external.name, icon);
        this.tooltip = `${this.external.ruleClass} ${this.location}`;
    }

    // @ts-ignore
    get description(): string {
        if (this.external.actual) {
            return this.external.actual;
        }
        return this.external.ruleClass || '';
    }

    // @ts-ignore
    get command(): vscode.Command | undefined {
        if (this.location.indexOf('DEFAULT.WORKSPACE') >= 0) {
            return undefined;
        }
        return {
            command: CommandName.WorkspaceSelect,
            title: 'Select external workspace',
            arguments: [this],
        };
    }
}
