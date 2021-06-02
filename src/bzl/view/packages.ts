import * as grpc from '@grpc/grpc-js';
import * as fs from 'graceful-fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { utils } from 'vscode-common';
import { BuiltInCommands, Telemetry } from '../../constants';
import { Container, MediaIconName } from '../../container';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { LabelKind } from '../../proto/build/stack/bezel/v1beta1/LabelKind';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { RunRequest } from '../../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../../proto/build/stack/bezel/v1beta1/RunResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../client';
import { CommandTaskRunner } from '../commandrunner';
import { getLabelAbsolutePath, LabelParts, splitLabel } from '../configuration';
import {
  CommandName,
  ContextValue,
  FileName,
  ruleClassIconUri,
  ThemeIconReload,
  ViewName
} from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';

/**
 * Renders a view for bazel packages.
 */
export class BzlPackageListView extends BzlClientTreeDataProvider<Node> {
  static selectedNode: Node | undefined;

  private currentWorkspace: Workspace | undefined;
  private currentExternalWorkspace: ExternalWorkspace | undefined;
  private targets: Map<string, LabelKind[]> = new Map();
  private root: RootNode | undefined;

  constructor(
    private commandRunner: CommandTaskRunner,
    onDidChangeBzlClient: vscode.Event<BzlClient>,
    workspaceChanged: vscode.Event<Workspace | undefined>,
    externalWorkspaceChanged: vscode.Event<ExternalWorkspace | undefined>
  ) {
    super(ViewName.Package, onDidChangeBzlClient);
    this.disposables.push(workspaceChanged(this.handleWorkspaceChanged, this));
    this.disposables.push(
      externalWorkspaceChanged(this.handleExternalWorkspaceChanged, this)
    );
  }

  registerCommands() {
    super.registerCommands();
    this.addCommand(CommandName.PackageSelect, this.handleCommandSelect);
    this.addCommand(CommandName.PackageRun, this.handleCommandRun);
    this.addCommand(CommandName.PackageBuildAll, this.handleCommandBuildAll);
    this.addCommand(CommandName.PackageTestAll, this.handleCommandTestAll);
    this.addCommand(CommandName.PackageExplore, this.handleCommandExplore);
    this.addCommand(CommandName.PackageCopyLabel, this.handleCommandCopyLabel);
    this.addCommand(
      CommandName.PackageGoToTarget,
      this.handleCommandToGoTarget
    );
  }

  /**
   * Override refresh to clear the package list.
   */
  refresh() {
    this.root = undefined;
    this.targets.clear();
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
    this.root.visitAll((child) => items.push(new QuickPickNode(child)));

    const picker = vscode.window.createQuickPick<QuickPickNode>();

    picker.placeholder = 'Goto Bazel Target';
    picker.items = items;
    picker.buttons = [
      {
        iconPath: ThemeIconReload,
        tooltip: 'Load All Rules //... (this can be slow)',
      },
    ];
    picker.show();

    const choice = await new Promise<QuickPickNode | undefined>((resolve) => {
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

    return this.handleCommandSelect(choice.node);
  }

  async handleCommandCopyLabel(node: Node): Promise<void> {
    vscode.window.setStatusBarMessage(
      `"${node.bazelLabel}" copied to clipboard`,
      3000
    );
    return vscode.env.clipboard.writeText(node.bazelLabel);
  }

  async handleCommandRun(node: LabelKindNode): Promise<void> {
    return this.handleCommandRunAll(node, 'run');
  }

  async handleCommandBuildAll(node: LabelKindNode): Promise<void> {
    return this.handleCommandRunAll(node, 'build');
  }

  async handleCommandTestAll(node: LabelKindNode): Promise<void> {
    return this.handleCommandRunAll(node, 'test');
  }

  async handleCommandRunAll(node: Node, command: string): Promise<any> {
    if (!this.currentWorkspace) {
      return;
    }

    let label = node.bazelLabel;
    if (node instanceof PackageNode) {
      label += ':all';
    }

    const request: RunRequest = {
      arg: [command, label, '--color=yes'],
      workspace: this.currentWorkspace,
    };

    return this.commandRunner!.runTask(
      request,
      (
        err: grpc.ServiceError | undefined,
        md: grpc.Metadata | undefined,
        response: RunResponse | undefined
      ) => {
        if (err) {
          console.warn('run error', err);
          return;
        }
      }
    );
  }

  async handleCommandSelect(node: Node): Promise<void> {
    if (node instanceof PackageNode) {
      return this.handleCommandSelectPackage(node);
    } else if (node instanceof RuleNode) {
      return this.handleCommandSelectRule(node);
    } else if (node instanceof SourceFileNode) {
      return this.handleCommandSelectSourceFile(node);
    }
  }

  async handleCommandSelectRule(node: RuleNode): Promise<void> {
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      utils.getFileUriForLocation(node.labelKind.location!)
    );
  }

  async handleCommandSelectSourceFile(node: SourceFileNode): Promise<void> {
    vscode.commands.executeCommand(BuiltInCommands.Open, node.resourceUri);
  }

  async handleCommandSelectPackage(node: PackageNode): Promise<void> {
    node.hasChildrenRequested = true;

    const repo = this.currentWorkspace;
    if (!repo) {
      return;
    }
    let rootDir = repo.cwd;
    if (node.external) {
      rootDir = path.join(
        repo.outputBase!,
        'external',
        (node.external.actual || node.external.name)!
      );
    }

    const dirname = path.join(rootDir!, node.path);
    let filename = path.join(dirname, FileName.BUILDBazel);
    if (!fs.existsSync(filename)) {
      filename = path.join(dirname, FileName.BUILD);
    }
    if (fs.existsSync(filename)) {
      vscode.commands.executeCommand(
        BuiltInCommands.Open,
        vscode.Uri.file(filename).with({
          fragment: '0,0',
        })
      );
    }

    return this.fetchPackageRules(node);
  }

  async fetchPackageRules(node: PackageNode): Promise<void> {
    const dir = node.path;
    if (this.targets.has(dir)) {
      return;
    }
    if (!this.currentWorkspace) {
      return;
    }

    const targets =
      (await this.client?.listRules(
        this.currentWorkspace,
        this.currentExternalWorkspace,
        node.pkg
      )) || [];
    this.targets.set(dir, targets);

    const children: LabelKindNode[] = [];
    if (targets) {
      for (const target of targets) {
        const parts = splitLabel(target.label!);
        if (!parts) {
          continue;
        }
        switch (target.kind) {
          case 'generated file': {
            console.log(`Skipping genfile ${target.kind} ${target.label}`);
            break;
          }
          case 'source file': {
            children.push(
              new SourceFileNode(node, target, this.currentWorkspace!, parts)
            );
            break;
          }
          default: {
            children.push(new RuleNode(node, target, parts.target));
            break;
          }
        }
      }
    }

    children.sort((a, b) =>
      String(b.description).localeCompare(String(a.description))
    );

    for (const child of children) {
      node.prependChild(child);
    }

    node.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.view.reveal(node, {
      select: true,
      focus: true,
      expand: 1,
    });
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

    const pkg =
      node instanceof PackageNode ? node.pkg : (node as RuleNode).parent.pkg;
    if (!pkg) {
      return;
    }

    if (pkg.dir) {
      rel.push(pkg.dir);
    }
    if (pkg.name) {
      rel.push(pkg.name);
    }

    if (node instanceof LabelKindNode) {
      rel.push(node.desc);
    }

    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`${this.client?.httpURL()}/${rel.join('/')}`)
    );
  }

  async getChildren(node?: Node): Promise<Node[] | undefined> {
    if (!node) {
      return this.getRootItems();
    }
    if (node instanceof PackageNode) {
      if (!node.hasChildrenRequested) {
        await this.handleCommandSelectPackage(node);
      }
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

    Container.telemetry.sendTelemetryEvent(Telemetry.BzlPackageList);

    const pkgs = await this.client?.listPackages(
      this.currentWorkspace,
      this.currentExternalWorkspace
    );
    const root = (this.root = this.treeSort(
      this.currentExternalWorkspace,
      pkgs
    ));
    return root.getChildren();
  }

  treeSort(
    external: ExternalWorkspace | undefined,
    pkgs: Package[] = []
  ): RootNode {
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
      throw new Error(
        `buggy treeSort: please report issue: (residual path='${key}')`
      );
    };

    const root = new RootNode('.');
    map.set(root.desc, root);

    for (const pkg of pkgs) {
      const key = getPackageKey(pkg);
      const parentKey = getParentKey(key);
      const parent = map.get(parentKey);
      if (!parent) {
        throw new Error(
          `could not find parent "${parentKey}" for package "${key}"`
        );
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
  constructor(public node: Node) { }

  get label(): string {
    return this.node.bazelLabel;
  }

  get description(): string {
    return this.node.resourceUri ? '$(file)' : this.node.themeIcon;
  }
}

export class Node extends vscode.TreeItem {
  constructor(
    readonly parent: Node | undefined,
    readonly desc: string,
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(desc, collapsibleState);
  }

  get bazelLabel(): string {
    return '';
  }

  get themeIcon(): string {
    return '';
  }

  // @ts-ignore
  get command(): vscode.Command {
    return {
      command: CommandName.PackageSelect,
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

  constructor(label: string) {
    super(undefined, label, vscode.TreeItemCollapsibleState.Expanded);
  }

  addChild(child: Node) {
    this.children.push(child);
  }

  getChildren(): Node[] | undefined {
    return this.children;
  }

  visitAll(callback: (node: Node) => void) {
    this.children.forEach((child) => child.visitAll(callback));
  }
}

class PackageNode extends Node {
  private children: Node[] = [];
  public hasChildrenRequested = false;

  constructor(
    readonly parent: Node | undefined,
    readonly external: ExternalWorkspace | undefined,
    public pkg: Package,
    label: string
  ) {
    super(parent, label, vscode.TreeItemCollapsibleState.Collapsed);
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
    this.children.forEach((child) => child.visitAll(callback));
  }

  // @ts-ignore
  get contextValue(): string {
    return ContextValue.Package;
  }

  // @ts-ignore
  get iconPath():
    | vscode.Uri
    | { light: vscode.Uri; dark: vscode.Uri }
    | vscode.ThemeIcon
    | undefined {
    return Container.mediaIconPath(
      this === BzlPackageListView.selectedNode
        ? MediaIconName.Package
        : MediaIconName.PackageGray
    );
  }

  // @ts-ignore
  get description(): string {
    return `${this.external ? '@' + this.external.name : ''}//${getPackageKey(
      this.pkg
    )}`;
  }

  // @ts-ignore
  get tooltip(): string {
    return this.desc || 'ROOT build file';
  }
}

class LabelKindNode extends Node {
  constructor(
    readonly parent: PackageNode,
    readonly labelKind: LabelKind,
    label: string
  ) {
    super(parent, label, vscode.TreeItemCollapsibleState.None);
    this.id = labelKind.label;
    this.contextValue = labelKind.kind;
    this.description = `(${this.labelKind.kind}) ${this.labelKind.label}`;
    this.tooltip = this.description;
  }

  get bazelLabel(): string {
    return this.labelKind.label!;
  }
}

class RuleNode extends LabelKindNode {
  constructor(parent: PackageNode, labelKind: LabelKind, label: string) {
    super(parent, labelKind, label);
    this.iconPath = ruleClassIconUri(labelKind.kind!);
  }

  get themeIcon(): string {
    return '$(symbol-interface)';
  }
}

class SourceFileNode extends LabelKindNode {
  constructor(
    readonly parent: PackageNode,
    readonly labelKind: LabelKind,
    workspace: Workspace,
    parts: LabelParts
  ) {
    super(parent, labelKind, parts.target);
    this.iconPath = vscode.ThemeIcon.File;
    this.resourceUri = vscode.Uri.file(getLabelAbsolutePath(workspace, parts));
  }
}
