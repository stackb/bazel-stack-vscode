import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ListPackagesResponse } from '../../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";

const packageSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-packages.svg');

export type CurrentWorkspaceProvider = () => Promise<Workspace | undefined>;
export type CurrentExternalWorkspaceProvider = () => Promise<ExternalWorkspace | undefined>;

/**
 * Renders a view for bazel packages.
 */
export class BazelPackageListView implements vscode.Disposable, vscode.TreeDataProvider<PackageItem> {
    private readonly viewId = 'bazel-packages';
    private readonly commandRefresh = "feature.bzl.packages.view.refresh";

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<PackageItem | undefined> = new vscode.EventEmitter<PackageItem | undefined>();
    private onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();
    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    constructor(
        private client: PackageServiceClient,
        private workspaceProvider: CurrentWorkspaceProvider,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
        private externalWorkspaceProvider: CurrentExternalWorkspaceProvider,
        externalWorkspaceChanged: vscode.EventEmitter<ExternalWorkspace | undefined>,
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(externalWorkspaceChanged.event(this.handleExternalWorkspaceChanged, this));
    }

    readonly onDidChangeTreeData: vscode.Event<PackageItem | undefined> = this._onDidChangeTreeData.event;

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.refresh();
    }

    handleExternalWorkspaceChanged(external: ExternalWorkspace | undefined) {
        this.currentExternalWorkspace = external;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: PackageItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: PackageItem): Promise<PackageItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }
    
    private async getRootItems(): Promise<PackageItem[]> {
        return this.listPackages().then(pkgs => this.createPackageMetadataItems(pkgs));
    }

    private async listPackages(): Promise<Workspace[]> {
        if (!this.currentWorkspace) {
            return Promise.reject('no current workspace');
        }
        return new Promise<Workspace[]>((resolve, reject) => {
            this.client.ListPackages({
                workspace: this.currentWorkspace,
                externalWorkspace: this.currentExternalWorkspace,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListPackagesResponse) => {
                if (err) {
                    console.log(`Package.List error`, err);
                    const config = vscode.workspace.getConfiguration("feature.bzl.listPackages");
                    const currentStatus = config.get("status");
                    if (err.code !== currentStatus) {
                        await config.update("status", err.code);
                    }
                    reject(`could not rpc package list: ${err}`);
                } else {
                    resolve(resp?.package);
                }
            });
        });
    }

    private createPackageMetadataItems(pkgs: Package[]): PackageItem[] {
        const items: PackageItem[] = [];
        if (!pkgs) {
            return items;
        }
        for (const pkg of pkgs) {
            const name = pkg.name;
            if (!name) {
                continue;
            }
            const dir = pkg.dir;
            if (!dir) {
                continue;
            }
            const ico = packageSvg;
            items.push(new PackageItem(name, dir, dir, dir, ico));
        }
        return items;
    }
    
    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}


class PackageItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
        private dir: string,
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
            command: 'vscode.openFile',
            title: 'Open Package File',
            arguments: [vscode.Uri.file(path.join(this.dir, "BUILD.bazel"))],
        };
    }
    
    iconPath = {
        light: this.ico,
        dark: this.ico,
    };

}