import * as path from 'path';
import * as vscode from 'vscode';
import { utils } from 'vscode-common';
import { BuiltInCommands, Telemetry } from '../../constants';
import { Container, MediaIconName } from '../../container';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../client';
import { CommandName, ContextValue, ViewName } from '../constants';
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
        this.addCommand(CommandName.WorkspaceOpenTerminal, this.handleCommandOpenTerminal);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.externals = undefined;
        this.setCurrentExternalWorkspace(undefined);
        this.refresh();
    }

    handleCommandOpenTerminal(item: ExternalWorkspaceItem): void {
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
        terminal.sendText(`cd '${dir}'`, true);
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
        if (!location || location.startsWith('/DEFAULT.WORKSPACE')) {
            return;
        }

        vscode.commands.executeCommand(BuiltInCommands.Open, utils.getFileUriForLocation(location));
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
        if (!this.currentWorkspace) {
            return undefined;
        }
        Container.telemetry.sendTelemetryEvent(Telemetry.BzlWorkspaceList);
        const externals = this.externals = await this.client?.listExternalWorkspaces(this.currentWorkspace);
        if (!externals) {
            return undefined;
        }
        return this.createExternalWorkspaceMetadataItems(externals);
    }

    private createExternalWorkspaceMetadataItems(externals: ExternalWorkspace[]): WorkspaceItem[] | undefined {
        if (!this.currentWorkspace) {
            return undefined;
        }

        const items = [];
        items.push(new DefaultWorkspaceItem(Container.mediaIconPath(this.currentExternalWorkspace ? MediaIconName.WorkspaceGray : MediaIconName.Workspace)));

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
            const icon = Container.mediaIconPath((this.currentExternalWorkspace?.id === external.id) ? MediaIconName.Workspace : MediaIconName.WorkspaceGray);
            const location = this.getExternalWorkspaceAbsoluteLocation(external.relativeLocation);
            items.push(new ExternalWorkspaceItem(external, icon, location || '',));
        }

        return items;
    }

}

export class WorkspaceItem extends vscode.TreeItem {
    constructor(
        public label: string,
        public iconPath: vscode.Uri,
    ) {
        super(label);
        this.command = {
            command: CommandName.WorkspaceSelect,
            title: 'Select external workspace',
            arguments: [this],
        };
    }
}

class DefaultWorkspaceItem extends WorkspaceItem {
    constructor(icon: vscode.Uri) {
        super('DEFAULT', icon);
        this.description = 'workspace';
        this.tooltip = this.description;
        this.contextValue = ContextValue.DefaultWorkspace;
    }
}

class ExternalWorkspaceItem extends WorkspaceItem {
    constructor(
        public readonly external: ExternalWorkspace,
        icon: vscode.Uri,
        private location: string,
    ) {
        super('@' + external.name, icon);
        this.tooltip = `${this.external.ruleClass} ${this.location}`;
        this.description = this.external.actual ? this.external.actual : (this.external.ruleClass || '');
        this.contextValue = ContextValue.ExternalWorkspace;

        if (location.indexOf('DEFAULT.WORKSPACE') === -1) {
            this.command = {
                command: CommandName.WorkspaceSelect,
                title: 'Select external workspace',
                arguments: [this],
            };
        }
    }
}
