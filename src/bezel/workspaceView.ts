import * as vscode from 'vscode';
import * as luxon from 'luxon';
import { ThemeIconSignIn } from './constants';
import { Container, MediaIconName } from '../container';
import {
  CommandName,
  ThemeIconFileSymlinkDirectory,
  ThemeIconServerProcess,
  ViewName,
} from './constants';
import { TreeView } from './treeView';
import Long = require('long');
import { BazelInfo, Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import { path } from 'vscode-common';
import { AccountConfiguration, BazelConfiguration, BuildEventServiceConfiguration, BzlConfiguration, LanguageServerConfiguration, RemoteCacheConfiguration } from './configuration';
import { Info } from '../proto/build/stack/bezel/v1beta1/Info';
import { BzlLanguageClient } from './lsp';
import { Runnable, Status } from './status';
import { Buildifier } from '../buildifier/buildifier';
import { RemoteCache } from './remote_cache';
import { Account } from './account';
import { BuildifierConfiguration } from '../buildifier/configuration';
import { BuildEventService } from './bes';
import { BazelServer } from './bazel';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';

interface Expandable {
  getChildren(): Promise<vscode.TreeItem[] | undefined>;
}

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<vscode.TreeItem> {
  licenseToken: string | undefined;

  private accountItem: AccountItem;
  private lspClientItem: StarlarkLanguageServerItem;
  private bzlBackendItem: BzlBackendItem;
  private bzlFrontendItem: BzlFrontendItem;
  private buildifierItem: BuildifierItem;
  private remoteCacheItem: RemoteCacheItem;
  private besBackendItem: BesBackendItem;
  private bazelServerItem: BazelServerItem;
  // defaultWorkspaceItem = new DefaultWorkspaceItem(this);

  protected _onDidChangeBazelInfo: vscode.EventEmitter<BazelInfo> =
    new vscode.EventEmitter<BazelInfo>();
  readonly onDidChangeBazelInfo: vscode.Event<BazelInfo> = this._onDidChangeBazelInfo.event;

  constructor(
    public readonly lspClient: BzlLanguageClient,
    private readonly bzl: Bzl,
    buildifier: Buildifier,
    remoteCache: RemoteCache,
    account: Account,
    bes: BuildEventService,
    bazel: BazelServer,
  ) {
    super(ViewName.Workspace);

    const onDidChangeTreeData = this._onDidChangeTreeData.fire.bind(this._onDidChangeTreeData);

    this.buildifierItem = this.addDisposable(new BuildifierItem(buildifier, onDidChangeTreeData));
    this.remoteCacheItem = this.addDisposable(new RemoteCacheItem(remoteCache, onDidChangeTreeData));
    this.accountItem = new AccountItem(account, onDidChangeTreeData);
    this.lspClientItem = new StarlarkLanguageServerItem(lspClient, onDidChangeTreeData);
    this.bzlBackendItem = new BzlBackendItem(bzl, onDidChangeTreeData);
    this.bzlFrontendItem = new BzlFrontendItem(bzl, onDidChangeTreeData);
    this.besBackendItem = new BesBackendItem(bes, onDidChangeTreeData);
    this.bazelServerItem = new BazelServerItem(bazel, onDidChangeTreeData);
  }

  registerCommands() {
    super.registerCommands();

    this.addCommand(CommandName.ComponentRefresh, this.handleCommandComponentRefresh);
    this.addCommand(CommandName.BazelKill, this.handleCommandBazelKill);
    this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
    this.addCommand(CommandName.OpenFile, this.handleCommandOpenFile);
    this.addCommand(CommandName.UiWorkspace, this.handleCommandUiWorkspace);
    // this.addCommand(CommandName.UiServer, this.handleCommandUiServer);
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

  async handleCommandUiWorkspace(item: DefaultWorkspaceItem): Promise<void> {
    const cfg = await this.bzl.settings.get();
    if (!cfg) {
      return;
    }
    if (!item.info) {
      return;
    }
    return vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(
        `http://${cfg.address}/${item.info.workspaceName || path.basename(item.info.workspaceName)
        }`
      )
    );
  }

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

  public async getChildren(element?: WorkspaceItem): Promise<WorkspaceItem[] | undefined> {
    if (!element) {
      return this.getRootItems();
    }
    if (isExpandable(element)) {
      return element.getChildren();
    }
    return undefined;
  }

  protected async getRootItems(): Promise<WorkspaceItem[] | undefined> {
    const items: WorkspaceItem[] = [
      this.accountItem,
      this.buildifierItem,
      this.lspClientItem,
      this.bzlBackendItem,
      this.bzlFrontendItem,
      this.besBackendItem,
      this.remoteCacheItem,
      this.bazelServerItem,
    ];
    return items;
  }
}

class WorkspaceItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}

class RunnableComponentItem<T> extends vscode.TreeItem implements vscode.Disposable {
  disposables: vscode.Disposable[] = [];

  constructor(
    label: string,
    public readonly component: Runnable<T>,
    private onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super(label);
    this.contextValue = 'component';
    component.onDidChangeStatus(this.setStatus, this, this.disposables);
    this.setStatus(component.status);
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [this.component.settings];
    if (this.component.status == Status.ERROR) {
      items.unshift(new RunnableErrorItem(this.component));
    }
    return items;
  }

  setStatus(status: Status) {
    this.tooltip = `Status: ${status}`;
    let icon = 'question';
    switch (status) {
      case Status.INITIAL:
        icon = 'circle';
        break;
      case Status.STARTING:
        icon = 'loading~spin';
        break;
      case Status.READY:
        icon = 'testing-passed-icon';
        break;
      case Status.LOADING:
        icon = 'loading~spin';
        break;
      case Status.STOPPING:
        icon = 'loading~spin';
        break;
      case Status.CONFIGURING:
        icon = 'sync~spin';
        break;
      case Status.STOPPED:
        icon = 'close';
        break;
      case Status.ERROR:
        icon = 'testing-failed-icon';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        break;
    }
    this.iconPath = new vscode.ThemeIcon(icon);
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

class RunnableErrorItem<T> extends vscode.TreeItem {
  constructor(runnable: Runnable<T>) {
    super('Error');
    this.description = runnable.statusErrorMessage;
    this.iconPath = new vscode.ThemeIcon('debug-breakpoint');
  }
}

class AccountItem extends RunnableComponentItem<AccountConfiguration> implements Expandable {
  constructor(
    private account: Account,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Stack Build', account, onDidChangeTreeData);
    this.description = 'Account';
    this.tooltip = 'Subscription Details';
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();
    items.push(new AccountLinkItem());

    try {
      const license = await this.account.client?.getLicense(this.account.licenseToken);
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
          new LicenseItem('Expiration', `${exp.toISODate()}`, 'Expiration date of this license'),
        );
      }  
    } catch (e) {
      console.log(`license get error`, e);
    }

    return items;
  }
}

class AccountLinkItem extends vscode.TreeItem {
  constructor() {
    super('Account');
    this.description = 'Details';
    this.iconPath = new vscode.ThemeIcon('link-external');
    this.command = {
      title: 'Account Home',
      command: BuiltInCommands.Open,
      arguments: [vscode.Uri.parse(`https://bzl.io/settings`)],
    }
  }
}

class StarlarkLanguageServerItem extends RunnableComponentItem<LanguageServerConfiguration> implements Expandable {
  constructor(
    lspClient: BzlLanguageClient,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Starlark', lspClient, onDidChangeTreeData);
    this.description = 'Language Server';
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class BuildifierItem extends RunnableComponentItem<BuildifierConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    buildifier: Buildifier,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Buildifier', buildifier, onDidChangeTreeData);
    this.description = `Formatter`;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class RemoteCacheItem extends RunnableComponentItem<RemoteCacheConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    remoteCache: RemoteCache,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Remote Cache', remoteCache, onDidChangeTreeData);
    this.description = 'Backend';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class BzlBackendItem extends RunnableComponentItem<BzlConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    bzl: Bzl,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Bzl', bzl, onDidChangeTreeData);
    this.description = 'Backend';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  //     const md = await api.getMetadata();
  //     const icon = Container.media(MediaIconName.StackBuild);
  //     items.push(
  //       new MetadataItem('Version', `${md.version}`, icon, undefined, md.commitId),
  //       new MetadataItem('Address', md.httpAddress!, icon, 'server_address'),
  //       new MetadataItem('Base Directory', md.baseDir!, icon),
  //     );
  //     if (this.cfg?.executable) {
  //       items.push(
  //         new MetadataItem('Executable', this.cfg?.executable, icon),
  //       );
  //     }

}

class BzlFrontendItem extends RunnableComponentItem<BzlConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    bzl: Bzl,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Bzl', bzl, onDidChangeTreeData);
    this.description = 'Frontend';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class BesBackendItem extends RunnableComponentItem<BuildEventServiceConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    bes: BuildEventService,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Build Event Service', bes, onDidChangeTreeData);
    this.description = 'Backend';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class BazelServerItem extends RunnableComponentItem<BazelConfiguration> implements vscode.Disposable, Expandable {
  constructor(
    private bazel: BazelServer,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
  ) {
    super('Bazel', bazel, onDidChangeTreeData);
    this.description = 'Backend';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const items = await super.getChildren();
    const info = await this.bazel.getBazelInfo();
    if (info) {
      items.push(new BazelInfoItem(info));
      items.push(new DefaultWorkspaceItem(info));
      items.push(new ExternalRepositoriesItem(this.bazel.bzl));
    }
    return items;
  } 
}

class BazelInfoItem extends WorkspaceItem implements Expandable {
  constructor(public info: BazelInfo) {
    super('Info');
    this.contextValue = 'info';
    this.description = info.workspace;
    this.tooltip = info.workspace;
    this.iconPath = Container.media(MediaIconName.BazelIcon);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return [
      new WorkspaceServerPidItem('server_pid', this.info.serverPid),
      new WorkspaceInfoPathItem('workspace', this.info.workspace),
      new WorkspaceInfoPathItem('output_base', this.info.outputBase),
      new WorkspaceInfoPathItem('execution_root', this.info.executionRoot),
      new WorkspaceInfoPathItem('bazel-bin', this.info.bazelBin),
      new WorkspaceInfoPathItem('bazel-testlogs', this.info.bazelTestlogs),
    ];
  }
}

// class BazelInfosItem extends WorkspaceItem implements Expandable {
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

class DefaultWorkspaceItem extends vscode.TreeItem implements Expandable {

  constructor(public readonly info: BazelInfo) {
    super('Default Workspace');
    this.contextValue = 'default';
    this.iconPath = Container.media(MediaIconName.Workspace);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    if (info.workspaceName) {
      this.description = '@' + info.workspaceName;
    } else {
      this.description = '@';
    }
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return [
      // TODO: package items
    ];
  }
}

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
    const ws = cfg._ws;
    const resp = await this.bzl.client?.listExternalWorkspaces(ws);
    if (!resp) {
      return undefined;
    }
    return resp.map(ew => new ExternalWorkspaceItem(ws.cwd!, ew));
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

class WorkspaceInfoPathItem extends WorkspaceItem {
  constructor(label: string, value: string) {
    super(label);
    this.id = label;
    this.description = value;
    this.contextValue = 'server_path';
    this.iconPath = ThemeIconFileSymlinkDirectory;
  }
}

class WorkspaceServerPidItem extends WorkspaceItem {
  constructor(label: string, public readonly pid: number) {
    super(label);
    this.description = `${pid}`;
    this.contextValue = 'server_pid';
    this.iconPath = ThemeIconServerProcess;
  }
}

class MetadataItem extends WorkspaceItem {
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
    }
  }
}

export class SignUpItem extends WorkspaceItem {
  constructor() {
    super('Sign In');
    this.description = 'Enable Invocation View, CodeSearch, UI...';
    (this.iconPath = ThemeIconSignIn),
      (this.command = {
        title: 'Sign In',
        tooltip: 'Learn more',
        command: CommandName.SignIn,
      });
  }
}

export class LicenseItem extends WorkspaceItem {
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

function isExpandable(item: any): item is Expandable {
  return 'getChildren' in item;
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
