import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { RunContext } from '../../bazelrc/codelens';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ListPackagesResponse } from '../../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { BzlHttpServerConfiguration } from '../configuration';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const packageSvg = path.join(__dirname, '..', '..', '..', 'media', 'package.svg');
const packageGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'package-gray.svg');

/**
 * Renders a view for bazel packages.
 */
export class BzlPackageListView extends GrpcTreeDataProvider<TreeNodeItem> {
    static readonly viewId = 'bzl-packages';
    static readonly commandSelect = "bzl-package.select";
    static readonly commandExplore = "bzl-package.xplore";
    static readonly commandRunAll = "bzl-package.allBuild";
    static readonly commandTestAll = "bzl-package.allTest";

    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;
    private packages: Package[] | undefined;
    private selectedItem: TreeNodeItem | undefined;

    constructor(
        private cfg: BzlHttpServerConfiguration,
        private client: PackageServiceClient,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
        externalWorkspaceChanged: vscode.EventEmitter<ExternalWorkspace | undefined>,
    ) {
        super(BzlPackageListView.viewId);

        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandRunAll, this.handleCommandBuildAll, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandTestAll, this.handleCommandTestAll, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(externalWorkspaceChanged.event(this.handleExternalWorkspaceChanged, this));
    }

    /**
     * Override refresh to clear the package list.
     */
    refresh() {
        this.packages = undefined;
        super.refresh();
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        this.refresh();
    }

    handleExternalWorkspaceChanged(external: ExternalWorkspace | undefined) {
        this.currentExternalWorkspace = external;
        this.refresh();
    }

    handleCommandBuildAll(item: TreeNodeItem): void {
        this.handleCommandRunAll("build", item.node.dir);
    }

    handleCommandTestAll(item: TreeNodeItem): void {
        this.handleCommandRunAll("test", item.node.dir);
    }

    handleCommandRunAll(command: string, dir: string): void {
        if (!this.currentWorkspace) {
            return;
        }
        const cwd = this.currentWorkspace.cwd!;
        let ws = "@";
        if (this.currentExternalWorkspace) {
            ws += this.currentExternalWorkspace.name!;
        }
        const label = `${ws}//${dir}:all`;

        const runCtx: RunContext = {
            cwd: cwd,
            command: command,
            args: [label],
        };
        
        vscode.commands.executeCommand('feature.bazelrc.runCommand', runCtx);
    }

    handleCommandSelect(item: TreeNodeItem): void {
        let rootDir = item.node.repo.cwd;
        if (item.node.external) {
            rootDir = path.join(
                item.node.repo.outputBase!,
                "external",
                (item.node.external.actual || item.node.external.name)!,
            );
        }

        const dirname = path.join(rootDir!, item.node.dir);
        let filename = path.join(dirname, "BUILD.bazel");
        if (!fs.existsSync(filename)) {
            filename = path.join(dirname, "BUILD");
        }
        if (!fs.existsSync(filename)) {
            return undefined;
        }

        if (this.selectedItem) {
            this.selectedItem.iconPath.dark = packageGraySvg;
            this.selectedItem.iconPath.light = packageGraySvg;
            this._onDidChangeTreeData.fire(this.selectedItem);
        }
        this.selectedItem = item;
        item.iconPath.dark = packageSvg;
        item.iconPath.light = packageSvg;
        
        this._onDidChangeTreeData.fire(item);
        
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filename));
    }

    handleCommandExplore(item: TreeNodeItem): void {
        if (!this.currentWorkspace) {
            return;
        }
        let rel = ['local', this.currentWorkspace.id];
        if (this.currentExternalWorkspace) {
            rel.push('external', '@' + this.currentExternalWorkspace.name);
        } else {
            rel.push('@');
        }
        rel.push('package');
        if (item.node.dir) {
            rel.push(item.node.dir);
        } else {
            rel.push(item.node.name);
        }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.cfg.address}/${rel.join('/')}`));
    }

    async getChildren(item?: TreeNodeItem): Promise<TreeNodeItem[] | undefined> {
        if (!item) {
            return this.getRootItems();
        }
        return item.node.items(item.node);
    }

    protected async getRootItems(): Promise<TreeNodeItem[] | undefined> {
        if (!this.currentWorkspace) {
            return undefined;
        }
        let pkgs = this.packages;
        if (!pkgs) {
            pkgs = await this.listPackages();
        }
        const root = this.treeSort(this.currentWorkspace, this.currentExternalWorkspace, pkgs);
        return root.items(undefined);
    }

    private async listPackages(): Promise<Workspace[]> {
        if (!this.currentWorkspace) {
            return Promise.resolve([]);
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
                    this.packages = resp?.package;
                    resolve(resp?.package);
                }
            });
        });
    }

    treeSort(repo: Workspace, external: ExternalWorkspace | undefined, pkgs: Package[]): TreeNode {

        const map: Map<string, TreeNode> = new Map();

        const root = new TreeNode(repo, external, "/");
        map.set(root.dir, root);
        map.set(".", root);

        /**
         * @type {function(string):!TreeNode}
         */
        const getTree = (dir: string): TreeNode => {
            let t = map.get(dir);
            if (t) {
                return t;
            }

            t = new TreeNode(repo, external, dir);
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
        return this.node.dir || 'ROOT build file';
    }

    get description(): string {
        return `@${this.node.external ? this.node.external.name : ''}//${this.node.dir || ':'}`;
    }

    get command(): vscode.Command | undefined {
        if (this.node.pseudo) {
            return undefined;
        }
        return {
            command: BzlPackageListView.commandSelect,
            title: 'Open Package File',
            arguments: [this],
        };
    }

    get contextValue(): string {
        return 'package';
    }

    iconPath = {
        light: packageGraySvg,
        dark: packageGraySvg,
    };
}

class TreeNode {
    constructor(
        public repo: Workspace,
        public external: ExternalWorkspace | undefined,
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
                continue;
            }
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
        return items;
    }
}
