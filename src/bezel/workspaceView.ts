import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import * as luxon from 'luxon';
import { BzlClient } from '../bzl/client';
import { ThemeIconReport, ThemeIconSignIn, ThemeIconVerified } from '../bzl/constants';
import { Container, MediaIconName } from '../container';
import { License } from '../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import {
  CommandName,
  ThemeIconFileSymlinkDirectory,
  ThemeIconFolderOpened,
  ThemeIconPackage,
  ThemeIconRepo,
  ThemeIconServerProcess,
  ThemeIconZap,
  ViewName,
} from './constants';
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { TreeView } from './treeView';
import Long = require('long');

/**
 * Renders a view of the current bazel workspace.
 */
export class BezelWorkspaceView extends TreeView<WorkspaceItem> {
  bzlClient: BzlClient | undefined;
  licenseClient: LicensesClient | undefined;
  licenseToken: string | undefined;
  lspClient: BezelLSPClient | undefined;
  info: BazelInfoResponse | undefined;

  constructor(
    onDidBzlClientChange: vscode.Event<BzlClient>,
    onDidLicenseClientChange: vscode.Event<LicensesClient>,
    onDidLicenseTokenChange: vscode.Event<string>,
    onDidLSPClientChange: vscode.Event<BezelLSPClient>,
    onDidBazelInfoChange: vscode.Event<BazelInfoResponse>
  ) {
    super(ViewName.Workspace);
    onDidBzlClientChange(this.handleBzlClientChange, this, this.disposables);
    onDidLicenseClientChange(this.handleLicenseClientChange, this, this.disposables);
    onDidLicenseTokenChange(this.handleLicenseTokenChange, this, this.disposables);
    onDidLSPClientChange(this.handleLSPClientChange, this, this.disposables);
    onDidBazelInfoChange(this.handleBazelInfo, this, this.disposables);
  }

  registerCommands() {
    super.registerCommands();

    this.addCommand(CommandName.Kill, this.handleCommandServerKill);
    this.addCommand(CommandName.OpenTerminal, this.handleCommandOpenTerminal);
  }

  getOrCreateTerminal(name: string): vscode.Terminal {
    const terminal = vscode.window.createTerminal(name);
    this.disposables.push(terminal);
    return terminal;
  }

  private handleBzlClientChange(bzlClient: BzlClient) {
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

  private handleBazelInfo(info: BazelInfoResponse) {
    this.info = info;
    this.refresh();
  }

  async handleCommandOpenTerminal(item: WorkspaceInfoPathItem): Promise<void> {
    const terminal = this.getOrCreateTerminal(item.id!);
    terminal.sendText(`cd ${item.description}`);
    terminal.show();
  }

  async handleCommandServerKill(item: WorkspaceServerPidItem): Promise<void> {
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

    return this.refresh();
  }

  public async getChildren(element?: WorkspaceItem): Promise<WorkspaceItem[] | undefined> {
    if (!element) {
      return this.getRootItems();
    }
    if (element instanceof BazelInfoItem) {
      return element.getChildren();
    }
    if (element instanceof BzlLanguageServerItem) {
      return element.getChildren();
    }
    if (element instanceof AccountItem) {
      return element.getChildren();
    }
    return undefined;
  }

  protected async getRootItems(): Promise<WorkspaceItem[] | undefined> {
    if (!this.info) {
      return [];
    }
    return [
      new BzlLanguageServerItem(this),
      new BazelInfoItem(this.info),
      // new WorkspacePackagesItem(this.client),
      // new WorkspaceExternalsItem(this.client),
    ];
  }
}

class WorkspaceItem extends vscode.TreeItem {
  constructor(label: string) {
    super(label);
  }
}

class BzlLanguageServerItem extends WorkspaceItem {
  constructor(private view: BezelWorkspaceView) {
    super('Bezel');
    this.contextValue = 'bezel';
    this.description = 'Language Server';
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<WorkspaceItem[]> {
    if (!this.view.bzlClient) {
      return [new SignInItem()];
    }
    const md = await this.view.bzlClient.getMetadata();
    return [
      new MetadataItem('version', `${md.version} (${md.commitId})`, ThemeIconVerified),
      new MetadataItem('base dir', md.baseDir!, ThemeIconFolderOpened),
      new MetadataItem('HTTP address', md.httpAddress!, ThemeIconZap),
      new MetadataItem('gRPC address', md.grpcAddress!, ThemeIconZap),
      new AccountItem(this.view),
    ];
  }
}

class BazelInfoItem extends WorkspaceItem {
  constructor(private info: BazelInfoResponse) {
    super('@' + info.workspaceName);
    this.contextValue = 'bazel_info';
    this.description = info.workspace;
    this.iconPath = Container.media(MediaIconName.BazelIcon);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  getChildren(): WorkspaceItem[] {
    return [
      new WorkspaceReleaseItem('release', this.info.release),
      new WorkspaceServerPidItem('server_pid', this.info.serverPid),
      new WorkspaceInfoPathItem('output_base', this.info.outputBase),
      new WorkspaceInfoPathItem('execution_root', this.info.executionRoot),
      new WorkspaceInfoPathItem('bazel-bin', this.info.bazelBin),
      new WorkspaceInfoPathItem('bazel-testlogs', this.info.bazelTestlogs),
    ];
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

class WorkspaceReleaseItem extends WorkspaceItem {
  constructor(release: string, value: string) {
    super(release);
    this.id = release;
    this.description = value;
    this.contextValue = 'release';
    this.iconPath = ThemeIconVerified;
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

class WorkspacePackagesItem extends WorkspaceItem {
  constructor(private client: BezelLSPClient) {
    super('Packages');
    this.description = 'bazel packages';
    this.iconPath = ThemeIconPackage;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class WorkspaceExternalsItem extends WorkspaceItem {
  constructor(private client: BezelLSPClient) {
    super('Externals');
    this.description = 'bazel external workspaces';
    this.iconPath = ThemeIconRepo;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }
}

class MetadataItem extends WorkspaceItem {
  constructor(label: string, description: string, iconPath: vscode.ThemeIcon | undefined) {
    super(label);
    this.description = description
    this.iconPath = iconPath;
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
  }
}

class AccountItem extends WorkspaceItem {
  constructor(private view: BezelWorkspaceView) {
    super('Account');
    this.description = 'Subscription Details';
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildren(): Promise<WorkspaceItem[]> {
    if (!this.view.licenseClient) {
      return [];
    }
    if (!this.view.licenseToken) {
      return [new SignInItem()];
    }

    const license = await getLicense(this.view.licenseClient, this.view.licenseToken);
    if (!license) {
      return [];
    }
    const exp = luxon.DateTime.fromSeconds(Long.fromValue(license.expiresAt?.seconds as Long).toNumber());

    return [
      new LicenseItem('ID', `${license.id}`, 'Registered user ID', license.avatarUrl),
      new LicenseItem('Name', `${license.name}`, 'Registered user name'),
      new LicenseItem('Email', `${license.email}`, 'Registered user email address'),
      new LicenseItem('Subscription', `${license.subscriptionName}`, 'Name of the subscription you are registered under'),
      new LicenseItem('Expiration', `${exp.toISODate()}`, 'Expiration date of this license'),
    ];
  }
}

export class SignInItem extends WorkspaceItem {
  constructor(
  ) {
    super('Sign In');
    this.description = 'Click to learn more about advanced features such as build event protocol, codesearch, UI, and more.';
    this.iconPath = ThemeIconSignIn,
    this.command = {
      title: 'Sign In',
      tooltip: 'Learn more',
      command: CommandName.SignIn,
    };
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
