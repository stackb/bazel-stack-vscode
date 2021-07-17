import * as vscode from 'vscode';
import * as luxon from 'luxon';
import { Container, MediaIconName } from '../container';
import {
  CommandName,
  ThemeIconFileSymlinkDirectory,
  ThemeIconServerProcess,
  ViewName,
} from './constants';
import { TreeView } from './treeView';
import Long = require('long');
import { Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import { path } from 'vscode-common';
import {
  SubscriptionConfiguration,
  BazelConfiguration,
  BuildEventServiceConfiguration,
  BzlConfiguration,
  CodeSearchConfiguration,
  LanguageServerConfiguration,
  RemoteCacheConfiguration,
  StarlarkDebuggerConfiguration,
} from './configuration';
import { Info } from '../proto/build/stack/bezel/v1beta1/Info';
import { BzlLanguageClient } from './lsp';
import { Runnable, Status } from './status';
import { Buildifier } from '../buildifier/buildifier';
import { RemoteCache } from './remote_cache';
import { Subscription as Subscription } from './subscription';
import { BuildifierConfiguration } from '../buildifier/configuration';
import { BuildEventService } from './bes';
import { BazelServer } from './bazel';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { Settings } from './settings';
import { StarlarkDebugger } from './debugger';
import { CodeSearch } from './codesearch';
import { Invocations, InvocationsItem } from './invocations';

export interface Expandable {
  getChildren(): Promise<vscode.TreeItem[] | undefined>;
}

export interface Revealable {
  getParent(): vscode.TreeItem | undefined;
}

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<vscode.TreeItem> {
  private subscriptionItem: SubscriptionItem;
  private lspClientItem: StarlarkLanguageServerItem;
  private starlarkDebuggerItem: StarlarkDebuggerItem;
  private bzlServerItem: BzlServerItem;
  private buildifierItem: BuildifierItem;
  private remoteCacheItem: RemoteCacheItem;
  private besBackendItem: BuildEventServiceItem;
  private bazelServerItem: BazelServerItem;
  private codeSearchItem: CodeSearchItem;
  private invocationsItem: InvocationsItem;

  constructor(
    public readonly lspClient: BzlLanguageClient,
    private readonly bzl: Bzl,
    buildifier: Buildifier,
    remoteCache: RemoteCache,
    subscription: Subscription,
    bes: BuildEventService,
    bazel: BazelServer,
    starlarkDebugger: StarlarkDebugger,
    codeSearch: CodeSearch,
    invocations: Invocations
  ) {
    super(ViewName.Workspace);

    const onDidChangeTreeData = this._onDidChangeTreeData.fire.bind(this._onDidChangeTreeData);
    const onShouldRevealTreeItem = (item: vscode.TreeItem) => {
      this.view.reveal(item);
    };

    this.buildifierItem = this.addDisposable(new BuildifierItem(buildifier, onDidChangeTreeData));
    this.remoteCacheItem = this.addDisposable(
      new RemoteCacheItem(remoteCache, onDidChangeTreeData)
    );
    this.subscriptionItem = this.addDisposable(
      new SubscriptionItem(subscription, onDidChangeTreeData)
    );
    this.lspClientItem = this.addDisposable(
      new StarlarkLanguageServerItem(lspClient, onDidChangeTreeData)
    );
    this.bzlServerItem = this.addDisposable(new BzlServerItem(bzl, onDidChangeTreeData));
    this.besBackendItem = this.addDisposable(
      new BuildEventServiceItem(bes, bzl.settings, onDidChangeTreeData)
    );
    this.bazelServerItem = this.addDisposable(new BazelServerItem(bazel, onDidChangeTreeData));
    this.starlarkDebuggerItem = this.addDisposable(
      new StarlarkDebuggerItem(starlarkDebugger, onDidChangeTreeData)
    );
    this.codeSearchItem = this.addDisposable(new CodeSearchItem(codeSearch, onDidChangeTreeData));
    this.invocationsItem = this.addDisposable(
      new InvocationsItem(invocations, bzl.settings, onDidChangeTreeData, onShouldRevealTreeItem)
    );
  }

  registerCommands() {
    super.registerCommands();

    this.addCommand(CommandName.ComponentRefresh, this.handleCommandComponentRefresh);
    this.addCommand(CommandName.BazelKill, this.handleCommandBazelKill);
    this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
    this.addCommand(CommandName.OpenFile, this.handleCommandOpenFile);
  }

  /**
   * getParent implements the interface that works with the TreeView.reveal
   * function.
   * @param element 
   * @returns 
   */
  getParent(element: vscode.TreeItem): vscode.TreeItem | undefined {
    if (isRevealable(element)) {
      return element.getParent();
    }
    return undefined;
  }

  getOrCreateTerminal(name: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(name);
    this.disposables.push(terminal);
    return terminal;
  }

  async handleCommandOpenTerminal(item: vscode.TreeItem): Promise<void> {
    if (!(item.label && item.resourceUri)) {
      return;
    }
    const id = item.label?.toString();
    const terminal = this.getOrCreateTerminal(id);
    terminal.sendText(`cd ${item.resourceUri.fsPath}`);
    terminal.show();
  }

  async handleCommandOpenFile(item: vscode.TreeItem): Promise<void> {
    if (!item.resourceUri) {
      return;
    }
    return vscode.commands.executeCommand(BuiltInCommands.Open, item.resourceUri);
  }

  // async handleCommandUiWorkspace(item: DefaultWorkspaceItem): Promise<void> {
  //   const cfg = await this.bzl.settings.get();
  //   if (!cfg) {
  //     return;
  //   }
  //   if (!item.info) {
  //     return;
  //   }
  //   return vscode.commands.executeCommand(
  //     BuiltInCommands.Open,
  //     vscode.Uri.parse(
  //       `http://${cfg.address}/${item.info.workspaceName || path.basename(item.info.workspaceName)
  //       }`
  //     )
  //   );
  // }

  // async handleCommandUiServer(item: BzlServerItem): Promise<void> {
  //   const cfg = await this.apiClient.settings.get();
  //   return vscode.commands.executeCommand(
  //     BuiltInCommands.Open,
  //     vscode.Uri.parse(`http://${cfg.address}`)
  //   );
  // }

  async handleCommandComponentRefresh(item: RunnableComponentItem<any>): Promise<void> {
    return item.refresh();
  }

  async handleCommandBazelKill(item: WorkspaceServerPidItem): Promise<void> {
    try {
      const action = await vscode.window.showWarningMessage(
        `This will force kill the bazel server process ${item.pid}. Are you sure?`,
        'Confirm',
        'Cancel'
      );
      if (action !== 'Confirm') {
        return;
      }

      await this.lspClient.bazelKill(item.pid);

      return vscode.commands.executeCommand(BuiltInCommands.Reload);
    } catch (e) {
      throw e;
    }
  }

  public async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[] | undefined> {
    if (!element) {
      return this.getRootItems();
    }
    if (isExpandable(element)) {
      return element.getChildren();
    }
    return undefined;
  }

  protected async getRootItems(): Promise<vscode.TreeItem[] | undefined> {
    const items: vscode.TreeItem[] = [
      this.buildifierItem,
      this.starlarkDebuggerItem,
      this.lspClientItem,
      this.remoteCacheItem,
      this.subscriptionItem,
      this.bzlServerItem,
      this.codeSearchItem,
      this.bazelServerItem,
      this.besBackendItem,
      this.invocationsItem,
      this.invocationsItem.currentInvocation,
    ];
    return items;
  }
}

export class RunnableComponentItem<T> extends vscode.TreeItem implements vscode.Disposable {
  disposables: vscode.Disposable[] = [];
  private initialDescription: string | boolean | undefined;
  private previousStatus: Status = Status.UNKNOWN;

  constructor(
    label: string,
    description: string,
    public readonly component: Runnable<T>,
    private onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super(label);
    this.description = description || 'Component';
    this.initialDescription = this.description;
    this.contextValue = 'component';
    component.onDidChangeStatus(this.setStatus, this, this.disposables);
    this.setStatus(component.status);
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    return [this.component.settings];
  }

  setStatus(status: Status) {
    if (status === this.previousStatus) {
      return;
    }

    // In launching state, continue to remain in launch mode unless broken by
    // READY or FAILED.
    if (this.previousStatus === Status.LAUNCHING) {
      switch (status) {
        case Status.READY:
        case Status.FAILED:
          break;
        default:
          return;
      }
    }

    let icon = 'question';
    switch (status) {
      case Status.INITIAL:
        icon = 'circle';
        break;
      case Status.DISABLED:
        icon = 'circle-slash';
        break;
      case Status.STARTING:
        icon = 'loading~spin';
        break;
      case Status.STOPPING:
        icon = 'loading~spin';
        break;
      case Status.STOPPED:
        icon = 'close';
        break;
      case Status.CONFIGURING:
        icon = 'sync~spin';
        break;
      case Status.LAUNCHING:
        icon = 'sync~spin';
        this.description = 'launching...';
        break;
      case Status.READY:
        icon = 'testing-passed-icon';
        this.description = this.initialDescription;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        break;
      case Status.ERROR:
        icon = 'testing-failed-icon';
        this.description = this.initialDescription;
        if (this.component.statusErrorMessage) {
          this.description += ': ' + this.component.statusErrorMessage;
        }
        break;
    }

    this.iconPath = new vscode.ThemeIcon(icon);
    this.tooltip = `Status: ${status}`;
    this.previousStatus = status;

    this.onDidChangeTreeData(this);
  }

  async refresh() {
    await this.component.stop();
    await this.component.start();
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables.length = 0;
  }
}

class SubscriptionItem
  extends RunnableComponentItem<SubscriptionConfiguration>
  implements Expandable
{
  constructor(
    private subscription: Subscription,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Stack Build', 'Subscription', subscription, onDidChangeTreeData);
    this.tooltip = 'Subscription Details';
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();

    if (this.subscription.status === Status.DISABLED) {
      items.push(new DisabledItem('The subscription token is not set.  Login to get started.'));
      items.push(
        new MarkdownItem(
          "Your support assists in improving the Bazel Ecosystem.  If you're using this at work, please encourage your employer to contribute.  If unsatisfied for any reason send an email to hello@stack.build and we'll take care of it :)"
        )
      );
      items.push(
        new MarkdownItem(
          'Hover to learn more about how the token is read.',
          new vscode.MarkdownString(
            [
              '### Subscription Token',
              '',
              'The subscription token is a JWT that has your subscription details encoded inside.  When the extension loads it tries to find it on one of the following locations:',
              '',
              '1. The setting `bsv.bzl.subscription.token`',
              '2. The file `~/.bzl/license.key`.',
              '3. The setting `bsv.bzl.license.token` (legacy).',
            ].join('\n')
          )
        )
      );
      items.push(new GetStartedItem());
    } else {
      items.push(new AccountLinkItem());
    }

    try {
      const cfg = await this.subscription.settings.get();
      if (cfg.token) {
        const license = await this.subscription.client?.getLicense(cfg.token);
        if (license) {
          const exp = luxon.DateTime.fromSeconds(
            Long.fromValue(license.expiresAt?.seconds as Long).toNumber()
          );
          items.push(
            new LicenseItem('ID', `${license.id}`, 'Registered user ID', license.avatarUrl),
            new LicenseItem('Name', `${license.name}`, 'Registered user name'),
            new LicenseItem('Email', `${license.email}`, 'Registered user email address'),
            new LicenseItem(
              'Subscription',
              `${license.subscriptionName}`,
              'Name of the subscription you are registered under'
            ),
            new LicenseItem('Expiration', `${exp.toISODate()}`, 'Expiration date of this license')
          );
        }
      }
    } catch (e) {
      console.log('license get error', e);
    }

    return items;
  }
}

class AccountLinkItem extends vscode.TreeItem {
  constructor() {
    super('Account');
    this.description = 'Home';
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.command = {
      title: 'Account Home',
      command: BuiltInCommands.Open,
      arguments: [vscode.Uri.parse('https://bzl.io/settings')],
    };
  }
}

class StarlarkLanguageServerItem
  extends RunnableComponentItem<LanguageServerConfiguration>
  implements Expandable
{
  constructor(lspClient: BzlLanguageClient, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Starlark', 'Language Server', lspClient, onDidChangeTreeData);
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class BuildifierItem
  extends RunnableComponentItem<BuildifierConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(buildifier: Buildifier, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Buildifier', 'Formatter', buildifier, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class RemoteCacheItem
  extends RunnableComponentItem<RemoteCacheConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(
    private remoteCache: RemoteCache,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Remote Cache', 'Service', remoteCache, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();
    items.push(this.createLaunchItem());
    items.push(await this.createUsageItem());
    return items;
  }

  createLaunchItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Launch');
    item.description = 'LRU Disk Cache';
    item.iconPath = new vscode.ThemeIcon('debug-start');
    item.command = {
      title: 'Launch',
      command: CommandName.LaunchRemoteCache,
    };
    return item;
  }

  async createUsageItem(): Promise<vscode.TreeItem> {
    const cfg = await this.remoteCache.settings.get();
    const flag = `--remote_cache=${cfg.address}`;
    const item = new UsageItem(flag);
    item.command = {
      title: 'Copy',
      command: CommandName.CopyToClipboard,
      arguments: [flag],
    };
    return item;
  }
}

class BzlServerItem
  extends RunnableComponentItem<BzlConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(private bzl: Bzl, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Bzl', 'Service', bzl, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();
    const cfg = await this.bzl.settings.get();

    if (this.bzl.status === Status.DISABLED) {
      items.push(new DisabledItem('The Stack.Build subscription is not enabled.'));
    } else {
      items.push(new BzlMetadataItem(this.bzl));
      items.push(this.createLaunchItem());
    }
    items.push(new BzlFrontendLinkItem(cfg, 'Frontend', 'User Interface', ''));
    return items;
  }

  createLaunchItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Launch');
    item.description = 'Server';
    item.iconPath = new vscode.ThemeIcon('debug-start');
    item.command = {
      title: 'Launch',
      command: CommandName.LaunchBzlServer,
    };
    return item;
  }
}

class BzlMetadataItem extends vscode.TreeItem implements Expandable {
  constructor(public bzl: Bzl) {
    super('Info');
    this.contextValue = 'info';
    this.iconPath = new vscode.ThemeIcon('info');
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const md = await this.bzl.client?.getMetadata();
    if (!md) {
      const item = new vscode.TreeItem('Not Available');
      item.description = 'Bzl Info could not be retrieved (API server not available)';
      item.iconPath = new vscode.ThemeIcon('info');
      return [item];
    }
    const icon = Container.media(MediaIconName.StackBuild);
    return [
      new MetadataItem('Version', `${md.version}`, icon, undefined, md.commitId),
      new MetadataItem('Base Directory', md.baseDir!, icon),
    ];
  }
}

export class BzlFrontendLinkItem extends vscode.TreeItem {
  constructor(cfg: BzlConfiguration, label: string, description: string, rel: string) {
    super(label);
    this.description = description;
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.command = {
      title: 'Frontend Link',
      command: BuiltInCommands.Open,
      arguments: [vscode.Uri.parse(`http://${cfg.address.authority}/${rel}`)],
    };
  }
}

class BuildEventServiceItem
  extends RunnableComponentItem<BuildEventServiceConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(
    private bes: BuildEventService,
    private bzlSettings: Settings<BzlConfiguration>,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Build Event', 'Service', bes, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();

    if (this.bes.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
    }

    items.push(await this.createUsageItem());
    return items;
  }

  async createUsageItem(): Promise<vscode.TreeItem> {
    const cfg = await this.bes.settings.get();
    const bzl = await this.bzlSettings.get();
    const flag = `--bes_backend=${cfg.address} --bes_results_url=${bzl.address}/pipeline`;
    const item = new UsageItem(flag);
    item.command = {
      title: 'Copy',
      command: CommandName.CopyToClipboard,
      arguments: [flag],
    };
    return item;
  }
}

class StarlarkDebuggerItem
  extends RunnableComponentItem<StarlarkDebuggerConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(debug: StarlarkDebugger, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Starlark', 'Debugger', debug, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();
    items.push(this.createLaunchItem());
    items.push(this.createUsageItem());
    return items;
  }

  createUsageItem(): vscode.TreeItem {
    const md = new vscode.MarkdownString();
    md.appendCodeblock(
      `
    continue (alias: c) ---- Run until breakpoint or program termination.
    continueall (alias: cc)  Resume all threads until breakpoint or program termination.
    step (alias: s) -------- Step over the next statement and any functions that it may call.
    stepin (alias: si) ----- If the thread is paused on a statement that contains a function call, step into that function.
    stepout (alias: so) ---- Continue execution until the current function has been exited and then pause.

    break (alias: b)  Sets a breakpoint.
    clear ----------- Deletes breakpoint.
    clearall -------- Deletes all breakpoints.

    eval (alias: e) --- Evaluate a Starlark statement in a thread's current environment.
    globals (alias: g)  Print global variables.
    locals (alias: l) - Print local variables.
    values (alias: v) - List child values.

    pause (alias: p) - Pause thread(s).
    thread (alias: t)  List or change active paused thread(s).

    stack (alias: f)  List stack frames.

    exit (alias: quit | q)  Exit the debugger.
    help (alias: h) ------- Prints the help message.
    `,
      'text'
    );
    return new UsageItem(
      'Click on a "debug" codelens link to start a debug session. Hover to learn more.',
      md
    );
  }

  createLaunchItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Launch');
    item.description = 'Client CLI';
    item.iconPath = new vscode.ThemeIcon('debug-start');
    item.command = {
      title: 'Launch',
      command: CommandName.LaunchDebugCLI,
    };
    return item;
  }
}

class CodeSearchItem
  extends RunnableComponentItem<CodeSearchConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(
    private codeSearch: CodeSearch,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Code Search', 'Service', codeSearch, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();

    if (this.codeSearch.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
    }

    items.push(this.createUsageItem());
    return items;
  }

  createUsageItem(): vscode.TreeItem {
    return new UsageItem('Click on a "codelens" action link within a BUILD file.');
  }
}

class BazelServerItem
  extends RunnableComponentItem<BazelConfiguration>
  implements vscode.Disposable, Expandable
{
  constructor(private bazel: BazelServer, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Bazel', 'Service', bazel, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();

    if (this.bazel.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
    }

    const info = await this.bazel.getBazelInfo();
    if (info) {
      const cfg = await this.bazel.bzl.settings.get();
      const ws = await this.bazel.bzl.getWorkspace();
      items.push(new BazelInfoItem(this.bazel));
      // items.push(new DefaultWorkspaceItem(cfg, info));
      items.push(new BzlFrontendLinkItem(cfg, 'Package', 'Browser', path.join(ws.id!)));
      items.push(new BzlFrontendLinkItem(cfg, 'Flag', 'Browser', path.join(ws.id!, 'flags')));
      items.push(new ExternalRepositoriesItem(this.bazel.bzl));
    }
    return items;
  }
}

class BazelInfoItem extends vscode.TreeItem implements Expandable {
  constructor(public bazel: BazelServer) {
    super('Info');
    this.contextValue = 'info';
    this.iconPath = Container.media(MediaIconName.BazelIcon);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const info = await this.bazel.getBazelInfo();
    if (!info) {
      const item = new vscode.TreeItem('Not Available');
      item.description = 'Bazel Info could not be retrieved (API server not available)';
      item.iconPath = new vscode.ThemeIcon('info');
      return [item];
    }
    return [
      new WorkspaceServerPidItem('server_pid', info.serverPid),
      new WorkspaceInfoPathItem('workspace', info.workspace),
      new WorkspaceInfoPathItem('output_base', info.outputBase),
      new WorkspaceInfoPathItem('execution_root', info.executionRoot),
      new WorkspaceInfoPathItem('bazel-bin', info.bazelBin),
      new WorkspaceInfoPathItem('bazel-testlogs', info.bazelTestlogs),
    ];
  }
}

// class BazelInfosItem extends vscode.TreeItem implements Expandable {
//   constructor(public infos: Info[]) {
//     super('Info');
//     this.contextValue = 'info';
//     this.iconPath = new vscode.ThemeIcon('info');
//     this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
//   }

//   async getChildren(): Promise<vscode.TreeItem[] | undefined> {
//     const infos = this.infos.map(i => new InfoItem(i));
//     infos.sort((a, b): number => b.contextValue!.localeCompare(a.contextValue!) || 0);
//     return infos;
//   }
// }

// class InfoItem extends vscode.TreeItem {
//   constructor(public info: Info) {
//     super(info.key!);
//     this.contextValue = infoContextValue(info.key);
//     this.description = this.contextValue ? true : info.value;
//     this.resourceUri = this.contextValue ? vscode.Uri.file(info.value!) : undefined;
//     this.tooltip = info.description;
//     this.iconPath = new vscode.ThemeIcon('info');
//     this.command = {
//       title: info.description!,
//       command: CommandName.CopyToClipboard,
//       arguments: [info.value],
//     };

//     if (this.contextValue === 'folder') {
//       this.iconPath = new vscode.ThemeIcon('folder-active');
//     } else if (this.contextValue === 'file') {
//       this.iconPath = vscode.ThemeIcon.File;
//       this.command = {
//         title: info.description!,
//         command: CommandName.OpenFile,
//         arguments: [this],
//       };
//     }
//   }
// }

// class DefaultWorkspaceItem extends vscode.TreeItem implements Expandable {

//   constructor(
//     private readonly cfg: BzlConfiguration,
//     public readonly info: BazelInfo,
//   ) {
//     super('Default Workspace');
//     this.contextValue = 'default';
//     this.iconPath = Container.media(MediaIconName.Workspace);
//     this.collapsibleState = vscode.TreeItemCollapsibleState.None;
//     if (info.workspaceName) {
//       this.description = '@' + info.workspaceName;
//     } else {
//       this.description = '@';
//     }
//   }
// }

class ExternalRepositoriesItem extends vscode.TreeItem implements Expandable {
  constructor(private bzl: Bzl) {
    super('External Repositories');
    this.contextValue = 'externals';
    this.tooltip = 'List of external repositories of this workspace';
    this.iconPath = Container.media(MediaIconName.Workspace);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const cfg = await this.bzl.settings.get();
    const ws = await this.bzl.getWorkspace();
    const resp = await this.bzl.client?.listExternalWorkspaces(ws);
    if (!resp) {
      return undefined;
    }
    const items: vscode.TreeItem[] = resp.map(ew => new ExternalWorkspaceItem(ws.cwd!, ew));
    items.unshift(
      new BzlFrontendLinkItem(cfg, 'Externals', 'Browser', path.join(ws.id!, 'external'))
    );
    return items;
  }
}

class ExternalWorkspaceItem extends vscode.TreeItem implements Expandable {
  constructor(cwd: string, private ew: ExternalWorkspace) {
    super(ew.ruleClass!);
    this.contextValue = 'external';
    // this.description = ew.ruleClass;
    this.description = '@' + ew.name;
    this.tooltip = ew.relativeLocation;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;

    if (!ew.relativeLocation?.startsWith('/DEFAULT.WORKSPACE')) {
      this.makeOpenCommand(cwd, ew);
    }
  }

  makeOpenCommand(cwd: string, ew: ExternalWorkspace) {
    let filename = ew.relativeLocation || '';
    if (filename.startsWith('/')) {
      filename = filename.slice(1);
    }
    const parts = filename.split(':');
    let line = 0;
    let col = 0;
    if (parts.length > 2) {
      col = parseInt(parts.pop()!);
      line = parseInt(parts.pop()!);
      filename = parts.join('/');
    }

    const uri = vscode.Uri.file(path.join(cwd, filename));

    this.command = {
      title: 'Open Location',
      command: BuiltInCommands.Open,
      arguments: [uri.with({ fragment: `${line},${col}` })],
    };
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return undefined;
  }
}

class WorkspaceInfoPathItem extends vscode.TreeItem {
  constructor(label: string, value: string) {
    super(label);
    this.id = label;
    this.description = value;
    this.contextValue = 'server_path';
    this.iconPath = ThemeIconFileSymlinkDirectory;
  }
}

class WorkspaceServerPidItem extends vscode.TreeItem {
  constructor(label: string, public readonly pid: number) {
    super(label);
    this.description = `${pid}`;
    this.contextValue = 'server_pid';
    this.iconPath = ThemeIconServerProcess;
  }
}

class MetadataItem extends vscode.TreeItem {
  constructor(
    label: string,
    description: string,
    iconPath: vscode.ThemeIcon | vscode.Uri,
    contextValue?: string,
    tooltip?: string
  ) {
    super(label);
    this.description = description;
    this.iconPath = iconPath;
    this.tooltip = tooltip;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    this.contextValue = contextValue;
    this.command = {
      title: 'Copy to Clipboard',
      command: CommandName.CopyToClipboard,
      arguments: [description],
    };
  }
}

export class GetStartedItem extends vscode.TreeItem {
  constructor() {
    super('Get Started');
    this.description = 'Login or Sign Up';
    this.iconPath = new vscode.ThemeIcon('debug-start');
    this.command = {
      title: 'Sign In',
      tooltip: 'Learn more',
      command: CommandName.SignIn,
    };
  }
}

export class LicenseItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public description: string,
    public tooltip: string,
    iconUrl?: string
  ) {
    super(label);
    this.iconPath = iconUrl ? vscode.Uri.parse(iconUrl) : Container.media(MediaIconName.StackBuild);
  }
}

export class MarkdownItem extends vscode.TreeItem {
  constructor(description: string, markdown?: vscode.MarkdownString) {
    super('Note');
    this.description = description;
    this.tooltip = markdown || description;
    this.iconPath = new vscode.ThemeIcon('squirrel');
  }
}

export class UsageItem extends vscode.TreeItem {
  constructor(description: string, markdown?: vscode.MarkdownString) {
    super('Usage');
    this.description = description;
    this.tooltip = markdown || description;
    this.iconPath = new vscode.ThemeIcon('info');
  }
}

export class DisabledItem extends vscode.TreeItem {
  constructor(reason: string) {
    super('Disabled Reason');
    this.description = reason;
    this.tooltip = reason;
    this.iconPath = new vscode.ThemeIcon('circle-slash');
  }
}

function isExpandable(item: any): item is Expandable {
  return 'getChildren' in item;
}

function isRevealable(item: any): item is Revealable {
  return 'getParent' in item;
}

function infoContextValue(key: string | undefined): string {
  switch (key) {
    case 'bazel-bin':
    case 'bazel-genfiles':
    case 'bazel-testlogs':
    case 'execution_root':
    case 'install_base':
    case 'java-home':
    case 'output_base':
    case 'output_path':
    case 'repository_cache':
    case 'workspace':
      return 'folder';
    case 'server_log':
    case 'command_log':
      return 'file';
    default:
      return '';
  }
}

function infoMap(infoList: Info[]): Map<string, Info> {
  const m = new Map<string, Info>();
  for (const info of infoList) {
    m.set(info.key!, info);
  }
  return m;
}

// private handleConfigurationChange(cfg: BezelConfiguration) {
//   this.cfg = cfg;

//   this.starlarkLanguageServerItem.handleConfigurationChange(cfg);
//   this.remoteCacheItem.handleConfigurationChange(cfg);
// }

// private async handleBzlLanguageClientChange(lspClient: BzlLanguageClient) {
//   this.lspClient = lspClient;
//   this.starlarkLanguageServerItem.handleBzlLanguageClientChange(lspClient);
//   if (!lspClient) {
//     return;
//   }
// }

// private handleBzlServerClientChange(apiClient: BzlAPIClient) {
//   this.apiClient = apiClient;
//   if (!apiClient) {
//     return;
//   }

//   this.bzlServerItem.handleBzlServerClientChange(apiClient);

//   this.tryLoadBazelInfo(apiClient, 0);
// }
