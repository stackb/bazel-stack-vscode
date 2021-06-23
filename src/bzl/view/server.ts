import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as vscode from 'vscode';
import { isGrpcServiceError } from '../../common';
import { BuiltInCommands } from '../../constants';
import { MultiStepInput } from '../../multiStepInput';
import { ProtoGrpcType } from '../../proto/bzl';
import { ProtoGrpcType as CodesearchProtoGrpcType } from '../../proto/codesearch';
import { BzlClient } from '../client';
import {
  CommandName,
  ContextValue,
  ThemeIconDebugStackframeActive,
  ThemeIconDebugStackframeFocused,
  ViewName,
} from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');

/**
 * Renders a view for bezel server status.
 */
export class BzlServerView extends BzlClientTreeDataProvider<Node> {
  static selectedClient: BzlClient | undefined;
  private items: Node[] | undefined;
  private remotesLoaded = false;

  constructor(
    private bzlProto: ProtoGrpcType,
    private codesearchProto: CodesearchProtoGrpcType,
    private remotes: string[],
    private onDidChangeBzlClient: vscode.EventEmitter<BzlClient>
  ) {
    super(ViewName.Server, onDidChangeBzlClient.event);
  }

  registerCommands() {
    super.registerCommands();
    this.addCommand(CommandName.ServerCopyFlag, this.handleCommandCopyFlag);
    this.addCommand(CommandName.ServerResultExplore, this.handleCommandResultsExplore);
    this.addCommand(CommandName.ServerAddServer, this.handleCommandAddServer);
    this.addCommand(CommandName.ServerRestart, this.handleCommandRestart);
    this.addCommand(CommandName.ServerShutdown, this.handleCommandShutdown);
    this.addCommand(CommandName.ServerSelect, this.handleCommandSelect);
    this.addCommand(CommandName.ServerExplore, this.handleCommandExplore);
  }

  async getChildren(element?: Node): Promise<Node[] | undefined> {
    if (element) {
      return element.getChildren();
    }
    return this.getRootItems();
  }

  handleCommandExplore(item: Node): void {
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`${this.client?.httpURL()}`)
    );
  }

  async handleCommandRestart(node: ServerNode): Promise<any> {
    if (!node || !node.client) {
      return;
    }
    return node.client.restart();
  }

  async handleCommandShutdown(node: ServerNode): Promise<any> {
    if (!node || !node.client) {
      return;
    }
    return node.client.shutdown();
  }

  async handleCommandSelect(node: ServerNode): Promise<void> {
    if (node && node.client === this.client) {
      return;
    }
    BzlServerView.selectedClient = node.client;
    vscode.window.showInformationMessage(`Switching to Bzl Server "${node.client.address}"`);
    this.onDidChangeBzlClient.fire(node.client);
    await vscode.commands.executeCommand(CommandName.BazelExplorer);
  }

  async handleCommandCopyFlag(node: MetadataNode): Promise<void> {
    vscode.window.setStatusBarMessage(`"${node.description}" copied to clipboard`, 3000);
    return vscode.env.clipboard.writeText(`${node.description}`);
  }

  async handleCommandAddServer(): Promise<void> {
    return MultiStepInput.run(async input => {
      let address = await input.showInputBox({
        title: 'Bzl Server Address',
        totalSteps: 1,
        step: 1,
        value: this.client?.address!,
        prompt: 'TCP address of server to add',
        validate: async (value: string) => {
          return '';
        },
        shouldResume: async () => false,
      });
      return this.addServer(address);
    });
  }

  async addServer(address: string): Promise<void> {
    if (address && address.startsWith('tcp://')) {
      address = address.slice(6);
    }
    if (this.items) {
      for (const item of this.items) {
        if (item.desc === address) {
          vscode.window.showWarningMessage(`Server list already contains "${address}"`);
          return;
        }
      }
    }

    const client = new BzlClient(
      '' /* executable not known */,
      this.bzlProto,
      this.codesearchProto,
      address
    );
    client.isRemoteClient = true;

    const node = await this.createServerNode(client);
    if (!node) {
      return;
    }
    this.items?.push(node);
    this.refresh();
  }

  async loadRemoteServers(): Promise<void> {
    if (this.remotesLoaded) {
      return;
    }
    this.remotesLoaded = true;

    // Adding a remote server is best-effort, not waiting for promises to
    // resolve here
    for (const remote of this.remotes) {
      this.addServer(remote);
    }
  }

  handleCommandResultsExplore(item: MetadataNode): void {
    vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${item.description}`));
  }

  async getRootItems(): Promise<Node[]> {
    const client = this.client;
    if (!client) {
      return [];
    }
    if (this.items) {
      return this.items;
    }
    const node = await this.createServerNode(client);
    if (!node) {
      return [];
    }
    this.items = [node];
    BzlServerView.selectedClient = client;
    this.loadRemoteServers();
    return this.items;
  }

  async createServerNode(client: BzlClient): Promise<ServerNode | void> {
    try {
      await client.waitForReady();
      return new ServerNode(client);
    } catch (e) {
      if (isGrpcServiceError(e)) {
        if (e.code === grpc.status.INTERNAL && e.message.indexOf('Received RST_STREAM') >= 0) {
          console.warn('RST_STREAM error', e);
          return;
        }
      }
      vscode.window.showErrorMessage(JSON.stringify(e));
    }
  }
}

export class Node extends vscode.TreeItem {
  protected children: Node[] | undefined;

  constructor(readonly desc: string) {
    super(desc);
  }

  async getChildren(): Promise<Node[] | undefined> {
    return this.children;
  }
}

export class ServerNode extends Node {
  constructor(readonly client: BzlClient) {
    super(`tcp://${client.address}`);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.contextValue = ContextValue.Server;
  }

  // @ts-ignore
  get themeIcon(): vscode.ThemeIcon {
    return this.client === BzlServerView.selectedClient
      ? ThemeIconDebugStackframeFocused
      : ThemeIconDebugStackframeActive;
  }

  async getChildren(): Promise<Node[] | undefined> {
    if (this.children) {
      return this.children;
    }
    const md = this.client.metadata!;
    const dt = luxon.DateTime.fromSeconds(Long.fromValue(md.buildDate!.seconds as Long).toNumber());
    const httpScheme = md.httpAddress?.endsWith(':443') ? 'https' : 'http';
    const grpcScheme = md.grpcAddress?.endsWith(':443') ? 'grpcs' : 'grpc';
    const httpBaseURL = `${httpScheme}://${md.httpAddress}`;
    const grpcBaseURL = `${grpcScheme}://${md.grpcAddress}`;
    this.children = [
      new MetadataNode('Version', `"${md.version!}"`, 'Release version', 'verified'),
    ];
    if (this.client.executable) {
      this.children.push(
        new MetadataNode('Tool Path', this.client.executable, 'Tool executable path')
      );
    }
    this.children.push(
      new MetadataNode('Build Date', dt.toISODate()!, 'Build date'),
      new MetadataNode('Build Commit', md.commitId!, 'Build Commit'),
      new MetadataNode('Runtime', `${md.os!}_${md.arch!}`, 'Runtime OS/Architecture'),
      new MetadataNode('Base Dir', md.baseDir!, 'Base directory for cached files'),
      new MetadataNode('HTTP', httpBaseURL, 'HTTP URL'),
      new MetadataNode('gRPC', grpcBaseURL, 'GRPC URL'),
      new MetadataNode(
        '--bes_backend',
        `grpc://${this.client.address}`,
        'BES backend address',
        'pulse'
      ),
      new MetadataNode(
        '--bes_results_url',
        `http://${this.client.address}/stream`,
        'BES results URL prefix',
        'pulse'
      )
      // new MetadataNode('Report Issue', 'https://github.com/stackb/bazel-stack-vscode/issues', 'Issue URL', 'bug', true),
    );

    return this.children;
  }
}

export class MetadataNode extends Node {
  constructor(label: string, desc: string, tt: string, icon?: string) {
    super(label);
    this.description = desc;
    this.iconPath = new vscode.ThemeIcon(icon ? icon : 'dash');
    this.tooltip = tt;
    this.contextValue = ContextValue.Metadata;
  }
}
