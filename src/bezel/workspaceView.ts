import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import * as luxon from 'luxon';
import { ThemeIconSignIn, ThemeIconVerified } from './constants';
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
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { TreeView } from './treeView';
import Long = require('long');
import { BzlClient } from './bzl';
import { BuiltInCommands, openExtensionSetting } from '../constants';
import { path } from 'vscode-common';
import { BezelConfiguration } from './configuration';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { file } from 'tmp';

interface Expandable {
  getChildren(): Promise<vscode.TreeItem[] | undefined>;
}

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<WorkspaceItem> {
  cfg: BezelConfiguration | undefined;
  bzlClient: BzlClient | undefined;
  licenseClient: LicensesClient | undefined;
  licenseToken: string | undefined;
  lspClient: BezelLSPClient | undefined;
  info: BazelInfoResponse | undefined;

  constructor(
    onDidBzlClientChange: vscode.Event<BzlClient | undefined>,
    onDidLicenseClientChange: vscode.Event<LicensesClient>,
    onDidLicenseTokenChange: vscode.Event<string>,
    onDidLSPClientChange: vscode.Event<BezelLSPClient>,
    onDidBazelInfoChange: vscode.Event<BazelInfoResponse>,
    onDidConfigurationChange: vscode.Event<BezelConfiguration>
  ) {
    super(ViewName.Workspace);

    onDidBzlClientChange(this.handleBzlClientChange, this, this.disposables);
    onDidLicenseClientChange(this.handleLicenseClientChange, this, this.disposables);
    onDidLicenseTokenChange(this.handleLicenseTokenChange, this, this.disposables);
    onDidLSPClientChange(this.handleLSPClientChange, this, this.disposables);
    onDidBazelInfoChange(this.handleBazelInfo, this, this.disposables);
    onDidConfigurationChange(this.handleConfigurationChange, this, this.disposables);
  }

  registerCommands() {
    super.registerCommands();

    this.addCommand(CommandName.BazelKill, this.handleCommandBazelKill);
    this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
    this.addCommand(CommandName.UiWorkspace, this.handleCommandUiWorkspace);
    this.addCommand(CommandName.UiServer, this.handleCommandUiServer);
    this.addCommand(CommandName.RemoteCacheConfig, this.handleCommandRemoteCacheConfig);
  }

  getOrCreateTerminal(name: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(name);
    this.disposables.push(terminal);
    return terminal;
  }

  private handleBzlClientChange(bzlClient: BzlClient | undefined) {
    this.bzlClient = bzlClient;
  }

  private handleLicenseClientChange(licenseClient: LicensesClient) {
    this.licenseClient = licenseClient;
  }

  private handleLicenseTokenChange(licenseToken: string) {
    this.licenseToken = licenseToken;
    this.refresh();
  }

  private handleLSPClientChange(client: BezelLSPClient) {
    this.lspClient = client;
  }

  private handleConfigurationChange(cfg: BezelConfiguration) {
    this.cfg = cfg;
    this.refresh();
  }

  private handleBazelInfo(info: BazelInfoResponse) {
    this.info = info;
    this.refresh();
  }

  async handleCommandOpenTerminal(item: WorkspaceInfoPathItem): Promise<void> {
    const terminal = this.getOrCreateTerminal(item.id!);
    terminal.sendText(`cd ${item.description}`);
    terminal.show();
  }

  async handleCommandUiWorkspace(item: DefaultWorkspaceItem): Promise<void> {
    if (!this.bzlClient) {
      return;
    }
    return vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${this.bzlClient!.address}/${item.info.workspaceName || path.basename(item.info.workspaceName)}`),
    );
  }

  async handleCommandRemoteCacheConfig(item: RemoteCacheItem): Promise<void> {
    return openExtensionSetting({ q: 'bsv.bzl.remoteCache' });
  }

  async handleCommandUiServer(item: MetadataItem): Promise<void> {
    if (!this.bzlClient) {
      return;
    }
    return vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${this.bzlClient!.address}`),
    );
  }

  async handleCommandBazelKill(item: WorkspaceServerPidItem): Promise<void> {
    if (!(this.lspClient && this.info)) {
      return;
    }

    const action = await vscode.window.showWarningMessage(
      `This will force kill the bazel server process ${this.info.serverPid} for ${this.info.workspace}. Are you sure?`,
      'Confirm',
      'Cancel'
    );
    if (action !== 'Confirm') {
      return;
    }

    await this.lspClient.bazelKill(this.info.serverPid);

    return vscode.commands.executeCommand(BuiltInCommands.Reload);
    // return this.refresh();
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
    if (!this.info) {
      return undefined;
    }
    return [
      new BazelServerItem(this.info),
      new BzlServerItem(this),
      new RemoteCacheItem(this),
      new DefaultWorkspaceItem(this.info),
      new ExternalRepositoriesItem(this),
    ];
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
    if (!this.view.bzlClient) {
      return [new SignInItem()];
    }
    const md = await this.view.bzlClient.getMetadata();
    const icon = Container.media(MediaIconName.StackBuild);
    return [
      new MetadataItem('Version', `${md.version}`, icon, undefined, md.commitId),
      new MetadataItem('Base Directory', md.baseDir!, icon),
      new MetadataItem('Address', md.httpAddress!, icon, 'server_address'),
      new AccountItem(this.view),
    ];
  }
}

class RemoteCacheItem extends WorkspaceItem implements Expandable {
  constructor(private view: BezelWorkspaceView) {
    super('Remote Cache');
    this.contextValue = 'remote_cache';
    this.description = 'Local Disk LRU gRPC';
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const cfg = this.view.cfg;
    if (!cfg) {
      return undefined;
    }
    if (!this.view.bzlClient) {
      undefined;
    }
    const md = await this.view.bzlClient!.getMetadata();
    const icon = Container.media(MediaIconName.StackBuild);
    return [
      new MetadataItem('Usage', `--remote_cache=${cfg.remoteCache.address}`, icon, undefined,
        'Add this to your ~/.bazelrc file (or on the command line) to use the cache'),
      new MetadataItem('Maximum Size', `${cfg.remoteCache.maxSizeGb}GB`, icon),
      new MetadataItem('Directory', cfg.remoteCache.dir || path.join(md.baseDir!, 'remote-cache'), icon),
    ];
  }
}

class BazelServerItem extends WorkspaceItem implements Expandable {
  constructor(public info: BazelInfoResponse) {
    super('Bazel');
    this.contextValue = 'bazel';
    this.description = info.release;
    this.iconPath = Container.media(MediaIconName.BazelIcon);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return [
      new WorkspaceServerPidItem('server_pid', this.info.serverPid),
    ];
  }
}

class DefaultWorkspaceItem extends WorkspaceItem implements Expandable {
  constructor(public info: BazelInfoResponse) {
    super('Default Workspace');
    this.contextValue = 'bazel';
    this.description = '@' + info.workspaceName;
    this.tooltip = info.workspace;
    this.iconPath = Container.media(MediaIconName.Workspace);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return [
      new WorkspaceInfoPathItem('workspace', this.info.workspace),
      new WorkspaceInfoPathItem('output_base', this.info.outputBase),
      new WorkspaceInfoPathItem('execution_root', this.info.executionRoot),
      new WorkspaceInfoPathItem('bazel-bin', this.info.bazelBin),
      new WorkspaceInfoPathItem('bazel-testlogs', this.info.bazelTestlogs),
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
    if (!this.view.bzlClient) {
      return undefined;
    }
    if (!this.view.lspClient?.ws) {
      return undefined;
    }
    const resp = await this.view.bzlClient.listExternalWorkspaces(this.view.lspClient.ws);
    if (!resp) {
      return undefined;
    }
    return resp.map(ew => new ExternalWorkspaceItem(this.view.lspClient?.info?.workspace!, ew));
  }
}

class ExternalWorkspaceItem extends WorkspaceItem implements Expandable {
  constructor(cwd: string, private ew: ExternalWorkspace) {
    super('@' + ew.name);
    this.contextValue = 'external';
    this.description = ew.ruleClass;
    this.tooltip = ew.relativeLocation;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;

    if (!(ew.relativeLocation?.startsWith('/DEFAULT.WORKSPACE'))) {
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
  constructor(label: string, value: number) {
    super(label);
    this.description = `${value}`;
    this.contextValue = 'server_pid';
    this.iconPath = ThemeIconServerProcess;
  }
}

class MetadataItem extends WorkspaceItem {
  constructor(label: string, description: string, iconPath: vscode.ThemeIcon | vscode.Uri, contextValue?: string, tooltip?: string) {
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
    this.description =
      'Click to learn more...';
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