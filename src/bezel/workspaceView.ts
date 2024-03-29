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
  ComponentConfiguration,
} from './configuration';
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
import { Buildozer } from '../buildozer/buildozer';
import { BuildozerConfiguration } from '../buildozer/configuration';

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
  private buildozerItem: BuildozerItem;
  private remoteCacheItem: RemoteCacheItem;
  private besBackendItem: BuildEventServiceItem;
  private bazelServerItem: BazelServerItem;
  private codeSearchItem: CodeSearchItem;
  private invocationsItem: InvocationsItem;

  constructor(
    public readonly lspClient: BzlLanguageClient,
    private readonly bzl: Bzl,
    buildifier: Buildifier,
    buildozer: Buildozer,
    remoteCache: RemoteCache,
    subscription: Subscription,
    bes: BuildEventService,
    private bazel: BazelServer,
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
    this.buildozerItem = this.addDisposable(new BuildozerItem(buildozer, onDidChangeTreeData));
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
    this.addCommand(CommandName.OpenExternalWorkspace, this.handleCommandOpenExternalWorkspace);
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

  async handleCommandOpenExternalWorkspace(item: ExternalWorkspaceItem): Promise<void> {
    const info = await this.bazel.getBazelInfo();
    if (!info) {
      return;
    }
    const outputBase = info.outputBase;
    const folderUri = vscode.Uri.file(path.join(outputBase, 'external', item.id!));
    return vscode.commands.executeCommand(BuiltInCommands.OpenFolder, folderUri, {
      forceNewWindow: true,
    });
  }

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
      this.buildozerItem,
      this.starlarkDebuggerItem,
      this.lspClientItem,
      this.remoteCacheItem,
      this.bazelServerItem,
      this.subscriptionItem,
      this.bzlServerItem,
      this.codeSearchItem,
      this.besBackendItem,
      this.invocationsItem,
      this.invocationsItem.currentInvocation,
    ];
    return items;
  }
}

export abstract class RunnableComponentItem<T extends ComponentConfiguration>
  extends vscode.TreeItem
  implements vscode.Disposable {
  disposables: vscode.Disposable[] = [];
  private previousStatus: Status = Status.UNKNOWN;
  private settings: SettingsItem;
  private initialDescription: string;

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
    this.settings = new SettingsItem(
      this.component.settings,
      onDidChangeTreeData,
      this.disposables
    );
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    let items: vscode.TreeItem[] = [this.settings];
    try {
      const cfg = await this.component.settings.get();
      if (!cfg.enabled) {
        items.push(new DisabledItem(this.component.settings.section + '.enabled false'));
        return items;
      }
    } catch (e) {
      if (e instanceof Error) {
        items.push(new ConfigurationErrorItem(e.message));
      }
      return items;
    }

    return items.concat(await this.getChildrenInternal());
  }

  abstract getChildrenInternal(): Promise<vscode.TreeItem[]>;

  setStatus(status: Status) {
    if (status === this.previousStatus) {
      return;
    }

    this.description = this.initialDescription;
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
        icon = 'circle-large-outline';
        break;
      case Status.READY:
        icon = 'testing-passed-icon';
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        break;
      case Status.ERROR:
        icon = 'testing-failed-icon';
        this.description = this.component.statusErrorMessage;
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

export class SettingsItem extends vscode.TreeItem {
  constructor(
    private readonly settings: Settings<ComponentConfiguration>,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
    disposables: vscode.Disposable[]
  ) {
    super('Settings');
    this.description = settings.section;
    this.iconPath = new vscode.ThemeIcon('gear');
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    this.tooltip = new vscode.MarkdownString(
      `### Settings for "${settings.section}"
      
      Click to open the VSCode settings and update the configuration items as desired.

      Changes should be reflected automatically, you should not need to reload the window.
      `
    );
    this.command = {
      title: 'Edit settings',
      command: BuiltInCommands.OpenSettings,
      arguments: [settings.section],
    };

    disposables.push(
      settings.onDidConfigurationChange(
        cfg => {
          this.description = this.settings.section;
          onDidChangeTreeData(this);
        },
        this,
        disposables
      )
    );

    disposables.push(
      settings.onDidConfigurationError(
        e => {
          this.description = e.message;
          onDidChangeTreeData(this);
        },
        this,
        disposables
      )
    );
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return Array.from(this.settings.props.values()).map(p => {
      const item = new vscode.TreeItem(p.name);
      item.description = formatValue(p.value, p.default);
      item.tooltip = p.description;
      item.iconPath = new vscode.ThemeIcon(getThemeIconNameForPropertyType(p.type));
      item.command = {
        title: 'Edit Setting',
        command: BuiltInCommands.OpenSettings,
        arguments: [p.key],
      };
      return item;
    });
  }
}

class SubscriptionItem
  extends RunnableComponentItem<SubscriptionConfiguration>
  implements Expandable {
  constructor(
    private subscription: Subscription,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Stack Build', 'Subscription', subscription, onDidChangeTreeData);
    this.tooltip = 'Subscription Details';
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('subscription'));

    if (this.component.status === Status.DISABLED) {
      items.push(new DisabledItem('Subscription token not available.'));
      items.push(
        new MarkdownItem(
          'Sign up to enable additional hover documentation, autocompletion, and other features.'
        )
      );
      items.push(
        new MarkdownItem(
          'Using this at work? Encourage your employer to support developer productivity.'
        )
      );
      items.push(
        new MarkdownItem(
          'Contact hello@stack.build for organizational onboarding.'
        )
      );
      items.push(
        new MarkdownItem(
          'Hover to learn more about how the token is read.',
          new vscode.MarkdownString(
            [
              '### Subscription Token',
              '',
              'The subscription token is a JWT that encodes your subscription details.  The extension will search the following locations for the token:',
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
            new LicenseItem('Renews', `${exp.toISODate()}`, 'Expiration date of this license')
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
      arguments: [vscode.Uri.parse('https://bzl.io/@')],
    };
  }
}

class StarlarkLanguageServerItem
  extends RunnableComponentItem<LanguageServerConfiguration>
  implements Expandable {
  constructor(lspClient: BzlLanguageClient, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Starlark', 'Language Server', lspClient, onDidChangeTreeData);
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    return [
      new DocumentationLinkItem('starlark-language-server'),
    ];
  }
}

class BuildifierItem
  extends RunnableComponentItem<BuildifierConfiguration>
  implements vscode.Disposable, Expandable {
  constructor(buildifier: Buildifier, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Buildifier', 'Formatter', buildifier, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    return [
      new DocumentationLinkItem('buildifier'),
    ];
  }
}

class BuildozerItem
  extends RunnableComponentItem<BuildozerConfiguration>
  implements vscode.Disposable, Expandable {
  constructor(buildozer: Buildozer, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Buildozer', 'Build File Editor', buildozer, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('buildozer'));
    items.push(this.createRunWizardItem());
    return items;
  }

  createRunWizardItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Run Wizard');
    item.description = 'Command Helper';
    item.iconPath = new vscode.ThemeIcon('zap');
    item.command = {
      title: 'Run Command Wizard',
      command: CommandName.BuildozerWizard,
    };
    return item;
  }

}

class RemoteCacheItem
  extends RunnableComponentItem<RemoteCacheConfiguration>
  implements vscode.Disposable, Expandable {
  constructor(
    private remoteCache: RemoteCache,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Remote Cache', 'Server', remoteCache, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    remoteCache.onDidAttachTerminal(() => onDidChangeTreeData(this), this, this.disposables);
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('remote-cache'));

    if (!this.remoteCache.terminal) {
      items.push(this.createLaunchItem());
    } else {
      items.push(new TerminalProcessItem(this.remoteCache.terminal));
    }
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
  implements vscode.Disposable, Expandable {
  constructor(private bzl: Bzl, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Bezel', 'UI', bzl, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    bzl.onDidAttachTerminal(() => onDidChangeTreeData(this), this, this.disposables);
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('ui'));

    if (this.bzl.status === Status.DISABLED) {
      items.push(new DisabledItem('The Stack.Build subscription is not enabled.'));
      return items;
    }

    if (!this.bzl.terminal) {
      items.push(this.createLaunchItem());
    } else {
      items.push(new TerminalProcessItem(this.bzl.terminal));
      items.push(new BzlMetadataItem(this.bzl));
    }

    const cfg = await this.component.settings.get();
    const ws = await this.bzl.getWorkspace();

    items.push(new BzlFrontendLinkItem(cfg, 'Workspace', 'Browser', ''));
    if (ws.id) { // TODO: figure out when ws.id can be undefined
      items.push(new BzlFrontendLinkItem(cfg, 'Package', 'Browser', ws.id!));
      items.push(new BzlFrontendLinkItem(cfg, 'Flag', 'Browser', `${ws.id}/flags`));
    }


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

export class DocumentationLinkItem extends vscode.TreeItem {
  constructor(rel: string, label = 'Docs') {
    super(label);
    this.description = '/' + rel;
    this.iconPath = Container.media(MediaIconName.StackBuild);
    this.command = {
      title: 'Documentation Link',
      command: BuiltInCommands.Open,
      arguments: [vscode.Uri.parse(`https://docs.stack.build/docs/vscode/${rel}`)],
    };
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
  implements vscode.Disposable, Expandable {
  constructor(
    private bes: BuildEventService,
    private bzlSettings: Settings<BzlConfiguration>,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Build Event', 'Service', bes, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('build-events'));

    if (this.bes.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
      return items;
    }

    items.push(await this.createUsageItem());

    return items;
  }

  async createUsageItem(): Promise<vscode.TreeItem> {
    const cfg = await this.bes.settings.get();
    const bzl = await this.bzlSettings.get();
    const flag = `--bes_backend=${cfg.backendAddress} --bes_results_url=${cfg.frontendAddress}`;
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
  implements vscode.Disposable, Expandable {
  constructor(
    private readonly debug: StarlarkDebugger,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Starlark', 'Debugger', debug, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    debug.onDidAttachTerminal(() => onDidChangeTreeData(this), this, this.disposables);
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('debugger'));

    if (this.debug.status === Status.DISABLED) {
      items.push(new DisabledItem('The Starlark Debugger is not enabled.'));
      return items;
    }

    if (!this.debug.terminal) {
      items.push(this.createLaunchItem());
    } else {
      items.push(new TerminalProcessItem(this.debug.terminal));
    }

    return items;
  }

  createLaunchItem(): vscode.TreeItem {
    const item = new vscode.TreeItem('Launch');
    item.description = 'Starlark Debug Adapter';
    item.iconPath = new vscode.ThemeIcon('debug-start');
    item.command = {
      title: 'Launch',
      command: CommandName.LaunchDebugAdapter,
    };
    return item;
  }
}

class CodeSearchItem
  extends RunnableComponentItem<CodeSearchConfiguration>
  implements vscode.Disposable, Expandable {
  constructor(
    codeSearch: CodeSearch,
    onDidChangeTreeData: (item: vscode.TreeItem) => void
  ) {
    super('Code Search', 'Service', codeSearch, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('codesearch'));

    items.push(this.createUsageItem());

    return items;
  }

  createUsageItem(): vscode.TreeItem {
    return new UsageItem('Click on a "codelens" action link within a BUILD file.');
  }
}

class BazelServerItem
  extends RunnableComponentItem<BazelConfiguration>
  implements vscode.Disposable, Expandable {
  constructor(private bazel: BazelServer, onDidChangeTreeData: (item: vscode.TreeItem) => void) {
    super('Bazel', 'Info', bazel, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];
    items.push(new DocumentationLinkItem('bazel'));

    if (this.bazel.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
      return items;
    }

    const cfg = await this.bazel.bzl.settings.get();
    const ws = await this.bazel.bzl.getWorkspace();
    if (ws.name) {
      this.description = '@' + ws.name;
    }
    items.push(new BazelInfoItem(this.bazel));
    // items.push(new DefaultWorkspaceItem(cfg, info));
    items.push(new ExternalRepositoriesItem(this.bazel.bzl));

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
    items.unshift(new BzlFrontendLinkItem(cfg, 'Externals', 'Browser', `${ws.id}/external`));
    return items;
  }
}

class ExternalWorkspaceItem extends vscode.TreeItem implements Expandable {
  constructor(cwd: string, private ew: ExternalWorkspace) {
    super(ew.ruleClass!);
    this.contextValue = 'external';
    // this.description = ew.ruleClass;
    this.id = ew.name;
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
    this.command = {
      title: 'Copy to Clipboard',
      command: CommandName.CopyToClipboard,
      arguments: [value],
    };
  }
}

class WorkspaceServerPidItem extends vscode.TreeItem {
  constructor(label: string, public readonly pid: number) {
    super(label);
    this.description = `${pid}`;
    this.contextValue = 'server_pid';
    this.iconPath = ThemeIconServerProcess;
    this.command = {
      title: 'Copy to Clipboard',
      command: CommandName.CopyToClipboard,
      arguments: [this.description],
    };
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
    super('');
    this.description = description;
    this.tooltip = markdown || description;
    this.iconPath = new vscode.ThemeIcon('debug-hint');
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

export class ConfigurationErrorItem extends vscode.TreeItem {
  constructor(reason: string) {
    super('Configuration Error');
    this.description = reason;
    this.tooltip = reason;
    this.iconPath = new vscode.ThemeIcon('warning');
  }
}

export class TerminalProcessItem extends vscode.TreeItem {
  constructor(terminal: vscode.Terminal) {
    super('Terminal');
    this.iconPath = new vscode.ThemeIcon('terminal');
    this.description = `"${terminal.name}"`;
    this.command = {
      title: 'View',
      command: BuiltInCommands.FocusTerminal,
      arguments: [terminal.name],
    };
  }
}

function isExpandable(item: any): item is Expandable {
  return 'getChildren' in item;
}

function isRevealable(item: any): item is Revealable {
  return 'getParent' in item;
}

function getThemeIconNameForPropertyType(type: string): string {
  switch (type) {
    case 'string':
      return 'symbol-string';
    case 'array':
      return 'symbol-array';
    case 'number':
      return 'symbol-number';
    case 'boolean':
      return 'symbol-boolean';
    default:
      return 'symbol-property';
  }
}

function formatValue(v: any, def?: any): string {
  if (Array.isArray(v)) {
    return v.join(' ');
  }
  if (typeof v === 'undefined') {
    return '';
  }
  return String(v);
}
