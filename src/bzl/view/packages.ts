import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
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
export class BazelPackageListView implements vscode.Disposable, vscode.TreeDataProvider<TreeNodeItem> {
    private readonly viewId = 'bazel-packages';
    private readonly commandRefresh = "feature.bzl.packages.view.refresh";

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<TreeNodeItem | undefined> = new vscode.EventEmitter<TreeNodeItem | undefined>();
    private onDidChangeCurrentRepository: vscode.EventEmitter<Workspace | undefined> = new vscode.EventEmitter<Workspace | undefined>();
    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;
    private root: TreeNode | undefined;

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

    readonly onDidChangeTreeData: vscode.Event<TreeNodeItem | undefined> = this._onDidChangeTreeData.event;

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.root = undefined;
        this.refresh();
    }

    handleExternalWorkspaceChanged(external: ExternalWorkspace | undefined) {
        this.currentExternalWorkspace = external;
        this.root = undefined;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: TreeNodeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(item?: TreeNodeItem): Promise<TreeNodeItem[] | undefined> {
        if (!item) {
            return this.getRootItems();
        }
        return item.node.items(item.node);
    }

    private async getRootItems(): Promise<TreeNodeItem[] | undefined> {
        let rootDir = this.currentWorkspace?.cwd;
        if (this.currentExternalWorkspace) {
            rootDir = path.join(
                this.currentWorkspace?.outputBase || "", 
                "external",
                this.currentExternalWorkspace.name || "",
            );
        }
        const pkgs = await this.listPackages();
        const root = this.root = treeSort(rootDir || "", pkgs);
        return root.items(undefined);
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

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

class TreeNodeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly node: TreeNode,
    ) {
        super(label,
            node.children.length 
                ? vscode.TreeItemCollapsibleState.Expanded 
                : vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return this.node.dir;
    }

    get description(): string {
        return this.node.dir;
    }

    get command(): vscode.Command | undefined {
        if (this.node.pseudo) {
            return undefined;
        }
        let filename = path.join(this.node.cwd, this.node.dir, "BUILD.bazel");
        if (!fs.existsSync(filename)) {
            filename = path.join(this.node.cwd, this.node.dir, "BUILD");
        }
        if (!fs.existsSync(filename)) {
            return undefined;
        }
        return {
            command: 'vscode.open',
            title: 'Open Package File',
            arguments: [vscode.Uri.parse("vscode://file" + filename)],
        };
    }

    iconPath = {
        light: this.node.icon(),
        dark: this.node.icon(),
    };
}

class TreeNode {
    constructor(
        public cwd: string,
        public dir: string,
        public name?: string,
        public pseudo?: boolean,
        public children: TreeNode[] = [],
        public pkg?: Package,
    ) {
        this.name = path.basename(dir);
        this.pseudo = true;
    }

    addChild(child: TreeNode) {
        this.children.push(child);
    }

    icon(): string {
        return this.pseudo ? "" : packageSvg;
    }
    
    items(rel: TreeNode | undefined): TreeNodeItem[] | undefined {
        if (!this.children.length) {
            return undefined;
        }
        let items: TreeNodeItem[] = [];
        for (const child of this.children) {
            if (child.pseudo) {
                items = items.concat(child.items(rel) || []);
            } else {
                let label = child.dir;
                if (rel) {
                    if (label.startsWith(rel.dir)) {
                        label = label.slice(rel.dir.length);
                    }
                    if (label.startsWith("/")) {
                        label = label.slice(1);
                    }    
                }
                items.push(new TreeNodeItem(label, child));
            }
        }
        return items;
    }
}

function treeSort(cwd: string, pkgs: Package[]): TreeNode {

    const map: Map<string, TreeNode> = new Map();

    const root = new TreeNode(cwd, "/");
    map.set(root.dir, root);
    map.set("", root);
    map.set(".", root);

    /**
     * @type {function(string):!TreeNode}
     */
    const getTree = (dir: string): TreeNode => {
        console.log(`getTree "${dir}"`);
        let t = map.get(dir);
        if (t) {
            return t;
        }

        t = new TreeNode(cwd, dir);
        map.set(dir, t);

        getTree(path.dirname(dir)).addChild(t);

        return t;
    };

    for (const pkg of pkgs) {
        let keyarr = [];
        if (pkg.dir) {
            keyarr.push(pkg.dir);
        }
        if (pkg.name && pkg.name !== ":") {
            keyarr.push(pkg.name);
        }
        const key = keyarr.join("/");

        const t = getTree(key);
        t.pkg = pkg;
    }

    // Go though a second pass and mark all the non-pseudo packages
    for (const pkg of pkgs) {
        let keyarr = [];
        if (pkg.dir) {
            keyarr.push(pkg.dir);
        }
        if (pkg.name && pkg.name !== ":") {
            keyarr.push(pkg.name);
        }
        const key = keyarr.join("/");
        const t = map.get(key);
        if (t) {
            t.pseudo = false;
        }
    }

    // Sort
    map.forEach(v => {
        v.children.sort();
    });

    return root;
}