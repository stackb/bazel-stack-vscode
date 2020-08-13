import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { RunContext } from '../../bazelrc/codelens';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { LabelKind } from '../../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListPackagesResponse } from '../../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesResponse } from '../../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { BzlHttpServerConfiguration, splitLabel } from '../configuration';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const packageSvg = path.join(__dirname, '..', '..', '..', 'media', 'package.svg');
const packageGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'package-gray.svg');
// const ruleIcon = path.join(__dirname, '..', '..', '..', 'media', 'rule.svg');

/**
 * Renders a view for bazel packages.
 */
export class BzlPackageListView extends GrpcTreeDataProvider<TreeNodeItem> {
    static readonly viewId = 'bzl-packages';
    static readonly commandSelect = "bzl-package.select";
    static readonly commandExplore = "bzl-package.explore";
    static readonly commandRunAll = "bzl-package.allBuild";
    static readonly commandTestAll = "bzl-package.allTest";
    static readonly commandCopyLabel = "bzl-package.copyLabel";
    static readonly commandGoToTarget = "bzl-package.goToTarget";

    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;
    private packages: Package[] | undefined;
    private packageRules: Map<string,LabelKind[]> = new Map();
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
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandCopyLabel, this.handleCommandCopyLabel, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandGoToTarget, this.handleCommandToGoTarget, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(externalWorkspaceChanged.event(this.handleExternalWorkspaceChanged, this));
    }

    /**
     * Override refresh to clear the package list.
     */
    refresh() {
        this.packages = undefined;
        this.packageRules.clear();
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

    async handleCommandToGoTarget(): Promise<void> {
        const roots = await this.getRootItems();
        if (!roots) {
            return;
        }

        const items: Map<string, TreeNodeItem> = new Map();
        roots.forEach(root => root.visitAll(item => 
            items.set(item.node.bazelLabel, item)));
        
        const pick = await vscode.window.showQuickPick(Array.from(items.keys()), {
            ignoreFocusOut: true,
            placeHolder: "Goto Bazel Target",
        });
        
        if (!pick) {
            return;
        }
        const pickedItem = items.get(pick);
        if (!pickedItem) {
            return;
        }
        await this.view.reveal(pickedItem, {
            select: true,
            focus: true,
            expand: true,
        });
    }

    async handleCommandCopyLabel(item: TreeNodeItem): Promise<void> {
        return vscode.env.clipboard.writeText(item.node.bazelLabel);
    }

    handleCommandBuildAll(item: TreeNodeItem): void {
        this.handleCommandRunAll("build", item.node.bazelLabel);
    }

    handleCommandTestAll(item: TreeNodeItem): void {
        this.handleCommandRunAll("test", item.node.bazelLabel);
    }

    handleCommandRunAll(command: string, label: string): void {
        if (!this.currentWorkspace) {
            return;
        }
        const runCtx: RunContext = {
            cwd: this.currentWorkspace?.cwd!,
            command: command,
            args: [label],
        };

        vscode.commands.executeCommand('feature.bazelrc.runCommand', runCtx);
    }

    async handleCommandSelect(item: TreeNodeItem): Promise<void> {
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
            this.selectedItem.iconPath = packageGraySvg;
            this._onDidChangeTreeData.fire(this.selectedItem);
        }
        this.selectedItem = item;
        item.node.iconPath = packageSvg;

        if (!this.packageRules.has(item.node.dir)) {
            const rules = await this.listRules(
                this.currentWorkspace!,
                this.currentExternalWorkspace,
                item.node.pkg);
            this.packageRules.set(item.node.dir, rules);
            for (const rule of rules) {
                const labelKind = new LabelKindItem(item.node.repo, item.node.external, item.node.pkg!, rule);
                item.node.children.unshift(labelKind);
            }    
        }

        this._onDidChangeTreeData.fire(item);

        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filename));
    }

    handleCommandExplorePackage(item: TreeNodeItem): void {
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
        if (item.node.pkg?.dir) {
            rel.push(item.node.pkg?.dir);
        }
        if (item.node.pkg?.name) {
            rel.push(item.node.pkg.name);
        }

        if (item.node instanceof LabelKindItem) {
            rel.push(item.node.dir.slice(1));
        }
        
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.cfg.address}/${rel.join('/')}`));
    }

    async getChildren(item?: TreeNodeItem): Promise<TreeNodeItem[] | undefined> {
        if (!item) {
            return this.getRootItems();
        }
        return item.node.items(item);
    }

    public async getParent(element?: TreeNodeItem): Promise<TreeNodeItem | undefined> {
        if (!element) {
            return undefined;
        }
        return element.parent;
    }

    protected async getRootItems(): Promise<TreeNodeItem[] | undefined> {
        if (!this.currentWorkspace) {
            return undefined;
        }
        let pkgs = this.packages;
        if (!pkgs) {
            pkgs = await this.listPackages(this.currentWorkspace, this.currentExternalWorkspace);
        }
        const root = this.treeSort(this.currentWorkspace, this.currentExternalWorkspace, pkgs);
        return root.items(undefined);
    }

    private async listPackages(workspace: Workspace, external?: ExternalWorkspace): Promise<Workspace[]> {
        return new Promise<Workspace[]>((resolve, reject) => {
            this.client.ListPackages({
                workspace: workspace,
                externalWorkspace: external,
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

    private async listRules(workspace: Workspace, external?: ExternalWorkspace, pkg?: Package): Promise<LabelKind[]> {
        return new Promise<LabelKind[]>((resolve, reject) => {
            this.client.ListRules({
                workspace: workspace,
                externalWorkspace: external,
                package: pkg,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListRulesResponse) => {
                if (err) {
                    console.log(`Rule.List error`, err);
                    const config = vscode.workspace.getConfiguration("feature.bzl.listPackages");
                    const currentStatus = config.get("status");
                    if (err.code !== currentStatus) {
                        await config.update("status", err.code);
                    }
                    reject(`could not rpc rule list: ${err}`);
                } else {
                    resolve(resp?.rule);
                }
            });
        });
    }

    treeSort(repo: Workspace, external: ExternalWorkspace | undefined, pkgs: Package[]): TreeNode {

        const map: Map<string, TreeNode> = new Map();

        const root = new PackageTreeNode(repo, external, "/");
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

            t = new PackageTreeNode(repo, external, dir);
            map.set(dir, t);

            getTree(path.dirname(dir)).children.push(t);

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
        public readonly parent: TreeNodeItem | undefined,
        public readonly label: string,
        public readonly node: TreeNode,
    ) {
        super(label, node.collapsibleState);
    }

    visitAll(callback: (node: TreeNodeItem) => void) {
        callback(this);
        this.node.items(this)?.forEach(child => {
            callback(child);
            child.visitAll(callback);
        });
    }

    get tooltip(): string {
        return this.node.tooltip;
    }

    get description(): string {
        return this.node.description;
    }

    get command(): vscode.Command | undefined {
        const cmd = this.node.command;
        if (!cmd) {
            return undefined;
        }
        cmd.arguments = [this];
        return cmd;
    }

    get contextValue(): string {
        return this.node.contextValue;
    }

    set collapsibleState(state: vscode.TreeItemCollapsibleState) {
        super.collapsibleState = state;
    }

    get collapsibleState(): vscode.TreeItemCollapsibleState {
        return this.node.collapsibleState;
    }

    set iconPath(iconPath: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon | undefined) {
        this.node.iconPath = iconPath;
    }

    get iconPath(): vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon | undefined {
        return this.node.iconPath;
    }
}

interface TreeNode {
    pseudo?: boolean;
    repo: Workspace;
    pkg?: Package;
    external: ExternalWorkspace | undefined;
    dir: string;
    name?: string;
    children: TreeNode[];
    tooltip: string;
    description: string;
    command: vscode.Command | undefined;
    contextValue: string;
    collapsibleState: vscode.TreeItemCollapsibleState;
    bazelLabel: string;

    iconPath?: vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon;

    items(rel: TreeNodeItem | undefined): TreeNodeItem[] | undefined;
}

class PackageTreeNode implements TreeNode {
    constructor(
        public readonly repo: Workspace,
        public readonly external: ExternalWorkspace | undefined,
        public dir: string,
        public name?: string,
        public pseudo?: boolean,
        public children: TreeNode[] = [],
        public pkg?: Package,
    ) {
        this.name = path.basename(dir);
        this.pseudo = true;
    }

    items(rel: TreeNodeItem | undefined): TreeNodeItem[] | undefined {
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
                if (label.startsWith(rel.node.dir)) {
                    label = label.slice(rel.node.dir.length);
                }
                if (label.startsWith("/")) {
                    label = label.slice(1);
                }
            }
            items.push(new TreeNodeItem(rel, label, child));
        }
        return items;
    }

    get tooltip(): string {
        return this.dir || 'ROOT build file';
    }

    get description(): string {
        return `@${this.external ? this.external.name : ''}//${this.dir || ':'}`;
    }

    get command(): vscode.Command | undefined {
        if (this.pseudo) {
            return undefined;
        }
        return {
            command: BzlPackageListView.commandSelect,
            title: 'Open Package File',
        };
    }

    get contextValue(): string {
        return 'package';
    }

    get collapsibleState(): vscode.TreeItemCollapsibleState {
        return vscode.TreeItemCollapsibleState.Expanded;
    }

    get collapsibleState2(): vscode.TreeItemCollapsibleState {
        return this.children.length
            ? vscode.TreeItemCollapsibleState.Expanded
            : vscode.TreeItemCollapsibleState.None;
    }

    get bazelLabel(): string {
        let ws = "@";
        if (this.external) {
            ws += this.external.name!;
        }
        return `${ws}//${this.dir}:all`;
    }

    iconPath = {
        light: packageGraySvg,
        dark: packageGraySvg,
    };
}

class LabelKindItem implements TreeNode {
    constructor(
        public readonly repo: Workspace,
        public readonly external: ExternalWorkspace | undefined,
        public readonly pkg: Package,
        public readonly labelKind: LabelKind,
        public readonly children: TreeNode[] = [],
    ) {
    }

    items(rel: TreeNodeItem | undefined): TreeNodeItem[] | undefined {
        return undefined;
    }

    get bazelLabel(): string {
        return this.labelKind.label!;
    }

    get dir(): string {
        const parts = splitLabel(this.labelKind.label!);
        return ":"+parts?.target;
    }

    get tooltip(): string {
        return `${this.labelKind.kind} ${this.labelKind.label}`;
    }

    get description(): string {
        return `${this.labelKind.label}`;
    }

    get contextValue(): string {
        return 'rule';
    }

    get command(): vscode.Command | undefined {
        return undefined;
    }

    get collapsibleState(): vscode.TreeItemCollapsibleState {
        return vscode.TreeItemCollapsibleState.None;
    }

    iconPath = {
        light: vscode.Uri.parse(`https://results.bzl.io/v1/image/rule-class-dot/${this.labelKind.kind}.svg`),
        dark: vscode.Uri.parse(`https://results.bzl.io/v1/image/rule-class-dot/${this.labelKind.kind}.svg`),
    };
}

