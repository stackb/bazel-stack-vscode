import * as grpc from '@grpc/grpc-js';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { RunContext } from '../../bazelrc/codelens';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { LabelKind } from '../../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListPackagesResponse } from '../../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesResponse } from '../../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { splitLabel } from '../configuration';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const packageSvg = path.join(__dirname, '..', '..', '..', 'media', 'package.svg');
const packageGraySvg = path.join(__dirname, '..', '..', '..', 'media', 'package-gray.svg');

/**
 * Renders a view for bazel packages.
 */
export class BzlPackageListView extends GrpcTreeDataProvider<Node> {
    static readonly viewId = 'bzl-packages';
    static readonly commandSelect = 'bzl-package.select';
    static readonly commandExplore = 'bzl-package.explore';
    static readonly commandRunAll = 'bzl-package.allBuild';
    static readonly commandTestAll = 'bzl-package.allTest';
    static readonly commandCopyLabel = 'bzl-package.copyLabel';
    static readonly commandGoToTarget = 'bzl-package.goToTarget';

    static selectedNode: Node | undefined;

    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;
    private packages: Package[] | undefined;
    private packageRules: Map<string, LabelKind[]> = new Map();
    private root: RootNode | undefined;

    constructor(
        private httpServerAddress: string,
        private client: PackageServiceClient,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
        externalWorkspaceChanged: vscode.EventEmitter<ExternalWorkspace | undefined>,
    ) {
        super(BzlPackageListView.viewId);

        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(externalWorkspaceChanged.event(this.handleExternalWorkspaceChanged, this));
    }

    registerCommands() {
        super.registerCommands();
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandRunAll, this.handleCommandBuildAll, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandTestAll, this.handleCommandTestAll, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandCopyLabel, this.handleCommandCopyLabel, this));
        this.disposables.push(vscode.commands.registerCommand(BzlPackageListView.commandGoToTarget, this.handleCommandToGoTarget, this));
    }

    /**
     * Override refresh to clear the package list.
     */
    refresh() {
        this.root = undefined;
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
        if (!this.root) {
            return;
        }

        const items: QuickPickNode[] = [];
        this.root.visitAll(child => 
            items.push(new QuickPickNode(child)));

        const picker = vscode.window.createQuickPick<QuickPickNode>();

        picker.placeholder = 'Goto Bazel Target';
        picker.items = items;
        picker.buttons = [{
            iconPath: '$(reload)',
            tooltip: 'Load All Rules //... (this can be slow)'
        }];
        picker.show();

        const choice = await new Promise<QuickPickNode | undefined>(resolve => {
            picker.onDidHide(() => resolve(undefined));
            picker.onDidAccept(() => {
                if (picker.selectedItems.length === 0) {
                    picker.busy = true;
                    picker.enabled = false;
                    picker.title = 'You must enter a target';
                    picker.busy = false;
                    picker.enabled = true;
                } else {
                    resolve(picker.selectedItems[0]);
                }
                picker.hide();
            });
        });

        picker.dispose();

        if (!choice) {
            return;
        }

        await this.view.reveal(choice.node, {
            select: true,
            focus: true,
            expand: 1,
        });
    }

    async handleCommandCopyLabel(node: Node): Promise<void> {
        return vscode.env.clipboard.writeText(node.bazelLabel);
    }

    async handleCommandBuildAll(node: Node): Promise<void> {
        return this.handleCommandRunAll(node, 'build');
    }

    async handleCommandTestAll(node: Node): Promise<void> {
        return this.handleCommandRunAll(node, 'test');
    }

    async handleCommandRunAll(node: Node, command: string): Promise<void> {
        if (!this.currentWorkspace) {
            return;
        }

        let label = node.bazelLabel;
        if (node instanceof PackageNode) {
            label += ':all';
        }
        
        const runCtx: RunContext = {
            cwd: this.currentWorkspace?.cwd!,
            command: command,
            args: [label],
        };

        return vscode.commands.executeCommand('feature.bazelrc.runCommand', runCtx);
    }

    async handleCommandSelect(node: Node): Promise<void> {
        if (node instanceof PackageNode) {
            return this.handleCommandSelectPackage(node);
        } else if (node instanceof RuleNode) {
            return this.handleCommandSelectRule(node);
        }
    }

    async handleCommandSelectRule(node: RuleNode): Promise<void> {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('vscode://file'+node.labelKind.location!));
    }

    async handleCommandSelectPackage(node: PackageNode): Promise<void> {
        const repo = this.currentWorkspace;
        if (!repo) {
            return;
        }
        let rootDir = repo.cwd;
        if (node.external) {
            rootDir = path.join(repo.outputBase!, 'external', (node.external.actual || node.external.name)!);
        }

        const dirname = path.join(rootDir!, node.path);
        let filename = path.join(dirname, 'BUILD.bazel');
        if (!fs.existsSync(filename)) {
            filename = path.join(dirname, 'BUILD');
        }
        if (fs.existsSync(filename)) {
            vscode.commands.executeCommand('vscode.open', vscode.Uri.file(filename));
        }

        return this.fetchPackageRules(node);
    }

    async fetchPackageRules(node: PackageNode): Promise<void> {
        const dir = node.path;
        if (this.packageRules.has(dir)) {
            return;
        }

        const repo = this.currentWorkspace;
        if (!repo) {
            return;
        }
        const external = this.currentExternalWorkspace;
        const rules = await this.listRules(repo, external, node.pkg);
        this.packageRules.set(dir, rules);

        if (rules) {
            for (const rule of rules) {
                const parts = splitLabel(rule.label!);
                const child = new RuleNode(node, rule, ':' + parts?.target);
                node.prependChild(child);
            }    
        }

        this._onDidChangeTreeData.fire(node);
    }

    handleCommandExplore(node: Node): void {
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

        const pkg = node instanceof PackageNode ? node.pkg : (node as RuleNode).parent.pkg;
        if (!pkg) {
            return;
        }

        if (pkg.dir) {
            rel.push(pkg.dir);
        }
        if (pkg.name) {
            rel.push(pkg.name);
        }

        if (node instanceof RuleNode) {
            rel.push(node.label.slice(1)); // remove ':' from ':foo'
        }

        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.httpServerAddress}/${rel.join('/')}`));
    }

    async getChildren(node?: Node): Promise<Node[] | undefined> {
        if (!node) {
            return this.getRootItems();
        }
        return node.getChildren();
    }

    public async getParent(node?: Node): Promise<Node | undefined> {
        if (!node) {
            return undefined;
        }
        return node.parent;
    }

    protected async getRootItems(): Promise<Node[] | undefined> {
        if (!this.currentWorkspace) {
            return undefined;
        }
        let pkgs = this.packages;
        if (!pkgs) {
            pkgs = await this.listPackages(this.currentWorkspace, this.currentExternalWorkspace);
        }
        const root = this.root = this.treeSort(this.currentExternalWorkspace, pkgs);
        return root.getChildren();
    }

    private async listPackages(workspace: Workspace, external?: ExternalWorkspace): Promise<Workspace[]> {
        await clearContextGrpcStatusValue(this.name);

        return new Promise<Workspace[]>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 120);
            this.client.ListPackages({
                workspace: workspace,
                externalWorkspace: external,
            }, new grpc.Metadata(), { deadline: deadline }, async (err?: grpc.ServiceError, resp?: ListPackagesResponse) => {
                await setContextGrpcStatusValue(this.name, err);
                resolve(this.packages = resp?.package);
            });
        });
    }

    private async listRules(workspace: Workspace, external?: ExternalWorkspace, pkg?: Package): Promise<LabelKind[]> {
        const contextKey = this.name + '-rules';
        await clearContextGrpcStatusValue(contextKey);
        return new Promise<LabelKind[]>((resolve, reject) => {
            this.client.ListRules({
                workspace: workspace,
                externalWorkspace: external,
                package: pkg,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListRulesResponse) => {
                await setContextGrpcStatusValue(contextKey, err);
                resolve(resp?.rule);
            });
        });
    }

    treeSort(external: ExternalWorkspace | undefined, pkgs: Package[] = []): RootNode {

        // Sort such that we always see parent packages before children
        pkgs.sort((a, b) => getPackageKey(a).length - getPackageKey(b).length);

        const map: Map<string, Node> = new Map();
        const getParentKey = (key: string): string => {
            let iterations = 0;
            while (iterations++ < 1000) {
                if (map.has(key)) {
                    return key;
                }
                key = path.dirname(key);
            }
            throw new Error('buggy treeSort: please report issue');
        };

        const root = new RootNode('.');
        map.set(root.label, root);

        for (const pkg of pkgs) {
            const key = getPackageKey(pkg);
            const parentKey = getParentKey(key);
            const parent = map.get(parentKey);
            if (!parent) {
                throw new Error(`could not find parent "${parentKey}" for package "${key}"`);
            }
            let label = key;
            if (!(parent instanceof RootNode)) {
                label = key.slice(parentKey.length);
                if (label.startsWith('/')) {
                    label = label.slice(1);
                }    
            }
            const node = new PackageNode(parent, external, pkg, label);
            map.set(label, node);
            parent.addChild(node);
        }

        return root;
    }
}

function getPackageKey(pkg: Package): string {
    let parts = [];
    if (pkg.dir) {
        parts.push(pkg.dir);
    }
    if (pkg.name && pkg.name !== ':') {
        parts.push(pkg.name);
    }
    return parts.join('/');
}

class QuickPickNode implements vscode.QuickPickItem {
    constructor(
        public node: Node,
    ) {
    }

    get label(): string {
        return this.node.bazelLabel;
    }

    get description(): string {
        return this.node.themeIcon;
    }

}

export class Node extends vscode.TreeItem {
    constructor(
        readonly parent: Node | undefined,
        readonly label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
    ) {
        super(label, collapsibleState);
    }

    get bazelLabel(): string {
        return '';
    }

    get themeIcon(): string {
        return '';
    }

    get command(): vscode.Command {
        return {
            command: BzlPackageListView.commandSelect,
            title: 'Select Target',
            arguments: [this],
        };
    }

    addChild(child: Node) {
        throw new Error('UnsupportedOperation');
    }

    getChildren(): Node[] | undefined {
        return undefined;
    }

    visitAll(callback: (node: Node) => void) {
        callback(this);
    }

}

class RootNode extends Node {
    public children: Node[] = [];

    constructor(
        label: string,
    ) {
        super(undefined, label, vscode.TreeItemCollapsibleState.Expanded);
    }

    addChild(child: Node) {
        this.children.push(child);
    }

    getChildren(): Node[] | undefined {
        return this.children;
    }

    visitAll(callback: (node: Node) => void) {
        this.children.forEach(child => child.visitAll(callback));
    }

}

class PackageNode extends Node {
    private children: Node[] = [];

    constructor(
        readonly parent: Node | undefined,
        readonly external: ExternalWorkspace | undefined,
        public pkg: Package,
        label: string,
    ) {
        super(parent, label, vscode.TreeItemCollapsibleState.Expanded);
    }

    get bazelLabel(): string {
        let ws = '@';
        if (this.external) {
            ws += this.external.name!;
        }
        return `${ws}//${getPackageKey(this.pkg)}`;
    }

    get themeIcon(): string {
        return '$(package)';
    }

    addChild(child: Node) {
        this.children.push(child);
    }

    prependChild(child: Node) {
        this.children.unshift(child);
    }

    getChildren(): Node[] | undefined {
        return this.children;
    }

    get path(): string {
        const parts = [];
        if (this.pkg.dir) {
            parts.push(this.pkg.dir);
        }
        if (this.pkg.name) {
            parts.push(this.pkg.name);
        }
        return parts.join('/');
    }

    visitAll(callback: (node: Node) => void) {
        super.visitAll(callback);
        this.children.forEach(child => child.visitAll(callback));
    }

    get contextValue(): string {
        return 'package';
    }

    get iconPath(): vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon | undefined {
        return this === BzlPackageListView.selectedNode ? packageSvg : packageGraySvg;
    }

    get description(): string {
        return `${this.external ? '@'+this.external.name : ''}//${getPackageKey(this.pkg)}`;
    }

    get tooltip(): string {
        return this.label || 'ROOT build file';
    }

}

class RuleNode extends Node {
    private icon: vscode.Uri;

    constructor(
        readonly parent: PackageNode,
        readonly labelKind: LabelKind,
        label: string,
    ) {
        super(parent, label, vscode.TreeItemCollapsibleState.None);
        this.icon = vscode.Uri.parse(`https://results.bzl.io/v1/image/rule-class-dot/${labelKind.kind}.svg`);
    }

    get bazelLabel(): string {
        return this.labelKind.label!;
    }

    get themeIcon(): string {
        return '$(symbol-interface)';
    }

    get contextValue(): string {
        return 'rule';
    }

    get iconPath(): vscode.Uri | { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon | undefined {
        return this.icon;
    }

    get description(): string {
        return `(${this.labelKind.kind}) ${this.labelKind.label}`;
    }

    get tooltip(): string {
        return `${this.labelKind.kind} ${this.labelKind.label}`;
    }

}

