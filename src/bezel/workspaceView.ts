import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import * as luxon from 'luxon';
import { ThemeIconSignIn } from './constants';
import { Container, MediaIconName } from '../container';
import { License } from '../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import {
  CommandName,
  ThemeIconFileSymlinkDirectory,
  ThemeIconServerProcess,
  ViewName,
} from './constants';
import { TreeView } from './treeView';
import Long = require('long');
import { BzlClient } from './bzl';
import { BuiltInCommands, openExtensionSetting } from '../constants';
import { path } from 'vscode-common';
import { BezelConfiguration } from './configuration';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { Info } from '../proto/build/stack/bezel/v1beta1/Info';
import { BazelInfo } from './lsp';

interface Expandable {
  getChildren(): Promise<vscode.TreeItem[] | undefined>;
}

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<WorkspaceItem> {
  cfg: BezelConfiguration | undefined;
  client: BzlClient | undefined;
  licenseClient: LicensesClient | undefined;
  licenseToken: string | undefined;

  private bzlServerItem = new BzlServerItem(this);
  private remoteCacheItem = new RemoteCacheItem(this);
  private bazelServerItem = new BazelServerItem(this);
  defaultWorkspaceItem = new DefaultWorkspaceItem(this);

  protected _onDidChangeBazelInfo: vscode.EventEmitter<BazelInfo> =
    new vscode.EventEmitter<BazelInfo>();
  readonly onDidChangeBazelInfo: vscode.Event<BazelInfo> = this._onDidChangeBazelInfo.event;

  constructor(
    onDidBzlClientChange: vscode.Event<BzlClient>,
    onDidLicenseClientChange: vscode.Event<LicensesClient>,
    onDidLicenseTokenChange: vscode.Event<string>,
    onDidConfigurationChange: vscode.Event<BezelConfiguration>
  ) {
    super(ViewName.Workspace);

    onDidBzlClientChange(this.handleBzlClientChange, this, this.disposables);
    onDidLicenseClientChange(this.handleLicenseClientChange, this, this.disposables);
    onDidLicenseTokenChange(this.handleLicenseTokenChange, this, this.disposables);
    onDidConfigurationChange(this.handleConfigurationChange, this, this.disposables);
  }

  registerCommands() {
    super.registerCommands();

    this.addCommand(CommandName.BazelKill, this.handleCommandBazelKill);
    this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
    this.addCommand(CommandName.OpenFile, this.handleCommandOpenFile);
    this.addCommand(CommandName.UiWorkspace, this.handleCommandUiWorkspace);
    this.addCommand(CommandName.UiServer, this.handleCommandUiServer);
    this.addCommand(CommandName.RemoteCacheConfig, this.handleCommandRemoteCacheConfig);
  }

  getOrCreateTerminal(name: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(name);
    this.disposables.push(terminal);
    return terminal;
  }

  private async handleBzlClientChange(bzlClient: BzlClient) {
    this.client = bzlClient;
    this.refresh();
    if (!bzlClient) {
      return;
    }
    this.bazelServerItem.setLoading(true);
    this._onDidChangeTreeData.fire(this.bazelServerItem);
    this.tryLoadBazelInfo(bzlClient);
  }

  private async tryLoadBazelInfo(client: BzlClient, attempt = 0): Promise<void> {
    try {
      const infoList = await client.api.getInfo(client.ws) || [];
      this.bazelServerItem.setInfo(infoList);
      this._onDidChangeTreeData.fire(this.bazelServerItem);
      const info = infoMap(infoList);
      const bazelInfo: BazelInfo = {
        bazelBin: info.get('bazel-bin')?.value!,
        bazelTestlogs: info.get('bazel-testlogs')?.value!,
        error: '',
        executionRoot: info.get('execution_root')?.value!,
        outputBase: info.get('output_base')?.value!,
        outputPath: info.get('output_path')?.value!,
        release: info.get('release')?.value!,
        serverPid: parseInt(info.get('server_name')?.value!),
        workspace: info.get('workspace')?.value!,
        workspaceName: '',
      };
      this.defaultWorkspaceItem.setInfo(bazelInfo);
      this._onDidChangeTreeData.fire(this.defaultWorkspaceItem);
      this._onDidChangeBazelInfo.fire(bazelInfo);
    } catch (e) {
      if (attempt < 3) {
        return this.tryLoadBazelInfo(client, attempt + 1);
      }
      this.bazelServerItem.setError(e);
      this._onDidChangeTreeData.fire(this.bazelServerItem);
      vscode.window.showWarningMessage(`bazel info not available: ${e.message}`);
    }
  }

  private handleLicenseClientChange(licenseClient: LicensesClient) {
    this.licenseClient = licenseClient;
  }

  private handleLicenseTokenChange(licenseToken: string) {
    this.licenseToken = licenseToken;
    this.refresh();
  }

  private handleConfigurationChange(cfg: BezelConfiguration) {
    this.cfg = cfg;
    this.refresh();
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
    if (!this.client) {
      return;
    }
    if (!item.info) {
      return;
    }
    return vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(
        `http://${this.client!.api.address}/${item.info.workspaceName || path.basename(item.info.workspaceName)
        }`
      )
    );
  }

  async handleCommandRemoteCacheConfig(item: RemoteCacheItem): Promise<void> {
    return openExtensionSetting({ q: 'bsv.bzl.remoteCache' });
  }

  async handleCommandUiServer(item: BzlServerItem): Promise<void> {
    if (!this.client) {
      return;
    }
    return vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${this.client!.api.address}`)
    );
  }

  async handleCommandBazelKill(item: WorkspaceServerPidItem): Promise<void> {
    if (!this.client) {
      return;
    }
    try {
      const action = await vscode.window.showWarningMessage(
        `This will force kill the bazel server process ${item.pid}. Are you sure?`,
        'Confirm',
        'Cancel'
      );
      if (action !== 'Confirm') {
        return;
      }

      await this.client.lang.bazelKill(item.pid);

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
    return [this.bzlServerItem, this.remoteCacheItem, this.bazelServerItem];
  }
}

class WorkspaceItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}

class BzlServerItem extends WorkspaceItem implements Expandable {
  constructor(private view: BezelWorkspaceView) {
    super('Bzl');
    this.contextValue = 'bzl';
    this.description = 'Language Server / User Interface';
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    if (!this.view.client) {
      return [new SignInItem()];
    }
    const md = await this.view.client.api.getMetadata();
    const icon = Container.media(MediaIconName.StackBuild);
    return [
      new MetadataItem('Version', `${md.version}`, icon, undefined, md.commitId),
      new MetadataItem('Address', md.httpAddress!, icon, 'server_address'),
      new MetadataItem('Base Directory', md.baseDir!, icon),
      new AccountItem(this.view),
    ];
  }
}

class RemoteCacheItem extends WorkspaceItem implements Expandable {
  constructor(private view: BezelWorkspaceView) {
    super('Remote Cache');
    this.contextValue = 'remote_cache';
    this.description = 'LRU Disk Cache';
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const cfg = this.view.cfg;
    if (!cfg) {
      return undefined;
    }
    if (!this.view.client) {
      undefined;
    }
    const md = await this.view.client!.api.getMetadata();
    const icon = Container.media(MediaIconName.StackBuild);
    return [
      new MetadataItem('Address', cfg.remoteCache.address, icon, undefined),
      new MetadataItem(
        'Usage',
        `--remote_cache=${cfg.remoteCache.address}`,
        icon,
        undefined,
        'Add this to your ~/.bazelrc file (or on the command line) to use the cache'
      ),
      new MetadataItem('Maximum Size', `${cfg.remoteCache.maxSizeGb}GB`, icon),
      new MetadataItem(
        'Base Directory',
        cfg.remoteCache.dir || path.join(md.baseDir!, 'remote-cache'),
        icon
      ),
    ];
  }
}

class BazelServerItem extends WorkspaceItem implements Expandable {
  private info: BazelInfo | undefined;
  private infos: Info[] | undefined;
  private err: Error | undefined;

  constructor(private view: BezelWorkspaceView) {
    super('Bazel');
    this.contextValue = 'bazel';
    this.iconPath = Container.media(MediaIconName.BazelWireframe);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  }

  setLoading(b: boolean) {
    this.iconPath = b
      ? new vscode.ThemeIcon('loading~spin')
      : Container.media(MediaIconName.BazelWireframe);
    this.description = 'loading...';
  }

  setError(err: Error) {
    this.err = err;
    this.description = err.message;
    this.iconPath = Container.media(MediaIconName.BazelWireframe);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }

  setInfo(infos: Info[]) {
    const info = infoMap(infos);
    this.infos = infos;
    this.description = info.get('release')?.value;
    this.iconPath = Container.media(MediaIconName.BazelIcon);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    if (this.err) {
      return undefined;
    }
    if (!this.infos) {
      return undefined;
    }
    return [
      new BazelInfosItem(this.infos!),
      new ExternalRepositoriesItem(this.view),
      this.view.defaultWorkspaceItem,
    ];
  }
}

class BazelInfoItem extends WorkspaceItem implements Expandable {
  constructor(public info: BazelInfo) {
    super('Info');
    this.contextValue = 'info';
    this.description = info.workspace;
    this.tooltip = info.workspace;
    this.iconPath = Container.media(MediaIconName.BazelWireframe);
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

class BazelInfosItem extends WorkspaceItem implements Expandable {
  constructor(public infos: Info[]) {
    super('Info');
    this.contextValue = 'info';
    this.iconPath = new vscode.ThemeIcon('info');
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const infos = this.infos.map(i => new InfoItem(i));
    infos.sort((a, b): number => b.contextValue!.localeCompare(a.contextValue!) || 0);
    return infos;
  }
}

class InfoItem extends vscode.TreeItem {
  constructor(public info: Info) {
    super(info.key!);
    this.contextValue = infoContextValue(info.key);
    this.description = this.contextValue ? true : info.value;
    this.resourceUri = this.contextValue ? vscode.Uri.file(info.value!) : undefined;
    this.tooltip = info.description;
    this.iconPath = new vscode.ThemeIcon('info');
    this.command = {
      title: info.description!,
      command: CommandName.CopyToClipboard,
      arguments: [info.value],
    };

    if (this.contextValue === 'folder') {
      this.iconPath = new vscode.ThemeIcon('folder-active');
    } else if (this.contextValue === 'file') {
      this.iconPath = vscode.ThemeIcon.File;
      this.command = {
        title: info.description!,
        command: CommandName.OpenFile,
        arguments: [this],
      };
    }
  }
}

class DefaultWorkspaceItem extends WorkspaceItem implements Expandable {
  info: BazelInfo | undefined;

  constructor(view: BezelWorkspaceView) {
    super('Default Workspace');
    this.contextValue = 'default';
    this.description = '@';
    this.iconPath = Container.media(MediaIconName.WorkspaceGray);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }

  setInfo(info: BazelInfo) {
    this.info = info;
    this.iconPath = Container.media(MediaIconName.Workspace);
    if (info.workspaceName) {
      this.description = '@' + info.workspaceName;
    }
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return [
      // TODO: package items
    ];
  }
}

class ExternalRepositoriesItem extends WorkspaceItem implements Expandable {
  constructor(private view: BezelWorkspaceView) {
    super('External Repositories');
    this.contextValue = 'externals';
    this.tooltip = 'List of external repositories of this workspace';
    this.iconPath = Container.media(MediaIconName.WorkspaceGray);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    if (!this.view.client) {
      return undefined;
    }
    if (!this.view.client?.ws) {
      return undefined;
    }
    const resp = await this.view.client.api.listExternalWorkspaces(this.view.client.ws);
    if (!resp) {
      return undefined;
    }
    return resp.map(ew => new ExternalWorkspaceItem(this.view.client?.ws.cwd!, ew));
  }
}

class ExternalWorkspaceItem extends WorkspaceItem implements Expandable {
  constructor(cwd: string, private ew: ExternalWorkspace) {
    super('@' + ew.name);
    this.contextValue = 'external';
    this.description = ew.ruleClass;
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
  }
}

class AccountItem extends WorkspaceItem implements Expandable {
  constructor(private view: BezelWorkspaceView) {
    super('Account');
    this.description = 'Subscription Details';
    this.iconPath = new vscode.ThemeIcon(this.view.licenseToken ? 'verified' : 'unverified');
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    if (!this.view.licenseClient) {
      return undefined;
    }
    if (!this.view.licenseToken) {
      return [new SignInItem()];
    }

    const license = await getLicense(this.view.licenseClient, this.view.licenseToken);
    if (!license) {
      return undefined;
    }
    const exp = luxon.DateTime.fromSeconds(
      Long.fromValue(license.expiresAt?.seconds as Long).toNumber()
    );

    return [
      new LicenseItem('ID', `${license.id}`, 'Registered user ID', license.avatarUrl),
      new LicenseItem('Name', `${license.name}`, 'Registered user name'),
      new LicenseItem('Email', `${license.email}`, 'Registered user email address'),
      new LicenseItem(
        'Subscription',
        `${license.subscriptionName}`,
        'Name of the subscription you are registered under'
      ),
      new LicenseItem('Expiration', `${exp.toISODate()}`, 'Expiration date of this license'),
    ];
  }
}

export class SignInItem extends WorkspaceItem {
  constructor() {
    super('Sign In');
    this.description = 'Click to learn more...';
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

function getLicense(client: LicensesClient, token: string): Promise<License | undefined> {
  return new Promise<License>((resolve, reject) => {
    const req = {
      currentToken: token,
    };
    client.Renew(
      req,
      new grpc.Metadata(),
      async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(resp!.license!);
      }
    );
  });
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