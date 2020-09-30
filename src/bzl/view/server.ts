import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { MultiStepInput } from '../../multiStepInput';
import { ApplicationServiceClient } from '../../proto/build/stack/bezel/v1beta1/ApplicationService';
import { Metadata } from '../../proto/build/stack/bezel/v1beta1/Metadata';
import { ProtoGrpcType } from '../../proto/bzl';
import { BzlClient } from '../bzlclient';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');

/**
 * Renders a view for bezel server status.
 */
export class BzlServerView extends BzlClientTreeDataProvider<Node> {
    private static readonly viewId = 'bzl-server';
    static readonly commandCopyFlag = BzlServerView.viewId + '.copyFlag';
    static readonly commandResultExplore = BzlServerView.viewId + '.bes_results.explore';
    static readonly commandAddServer = BzlServerView.viewId + '.add';
    static readonly commandSelect = BzlServerView.viewId + '.select';
    static readonly commandExplore = BzlServerView.viewId + '.explore';
    static selectedClient: BzlClient | undefined;
    private items: Node[] | undefined;

    constructor(
        private bzlProto: ProtoGrpcType,
        private onDidChangeBzlClient: vscode.EventEmitter<BzlClient>,
    ) {
        super(BzlServerView.viewId, onDidChangeBzlClient.event);
        this.disposables.push(vscode.window.registerTreeDataProvider(BzlServerView.viewId, this));
    }

    registerCommands() {
        super.registerCommands();
        this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandCopyFlag, this.handleCommandCopyFlag, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandResultExplore, this.handleCommandResultsExplore, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandAddServer, this.handleCommandAddServer, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandSelect, this.handleCommandSelect, this));
        this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandExplore, this.handleCommandExplore, this));
    }

    async getChildren(element?: Node): Promise<Node[] | undefined> {
        if (element) {
            return element.getChildren();
        }
        return this.getRootItems();
    }

    handleCommandExplore(item: Node): void {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`${this.client?.httpURL()}`));
    }

    async handleCommandSelect(node: ServerNode): Promise<void> {
        if (node && node.client === this.client) {
            return;
        }
        BzlServerView.selectedClient = node.client;
        vscode.window.showInformationMessage(`Switching to Bzl Server "${node.client.address}"`);
        this.onDidChangeBzlClient.fire(node.client);
    }

    async handleCommandCopyFlag(node: MetadataNode): Promise<void> {
        vscode.window.setStatusBarMessage(`"${node.description}" copied to clipboard`, 3000);
        return vscode.env.clipboard.writeText(`${node.description}`);
    }

    async handleCommandAddServer(): Promise<void> {
        MultiStepInput.run(async (input) => {
            const address = await input.showInputBox({
                title: 'Bzl Server Address',
                totalSteps: 1,
                step: 1,
                value: this.client?.address!,
                prompt: 'TCP address of server to add',
                validate: async (value: string) => { return ''; },
                shouldResume: async () => false,
            });
            if (this.items) {
                for (const item of this.items) {
                    if (item.desc === address) {
                        vscode.window.showWarningMessage(`Server list already contains "${address}"`);
                        return;
                    }
                }    
            }
            try {
                const client = new BzlClient(this.bzlProto, address);
                client.isRemoteClient = true;
                this.items?.push(await this.createServerNode(client));
                this.refresh();
            } catch (err) {
                vscode.window.showErrorMessage(JSON.stringify(err));
            }
        });
    }

    handleCommandResultsExplore(item: MetadataNode): void {
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${item.description}`));
    }

    async getRootItems(): Promise<Node[]> {
        const client = this.client;
        if (!client) {
            return [];
        }
        if (!this.items) {
            BzlServerView.selectedClient = client;
            const node = await this.createServerNode(client);
            this.items = [node];
        }
        return this.items;
    }

    async createServerNode(client: BzlClient): Promise<ServerNode> {
        await client.getMetadata();
        return new ServerNode(client);
    }
}

export class Node extends vscode.TreeItem {
    protected children: Node[] | undefined;

    constructor(
        readonly desc: string,
    ) {
        super(desc);
    }

    async getChildren(): Promise<Node[] | undefined> {
        return this.children;
    }
}

export class ServerNode extends Node {
    constructor(
        readonly client: BzlClient,
    ) {
        super(`tcp://${client.address}`);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.contextValue = 'server';
    }

    // @ts-ignore
    get iconPath(): vscode.ThemeIcon {
        const icon = this.client === BzlServerView.selectedClient 
        ? 'debug-stackframe-focused'
        : 'debug-stackframe-active';
        return new vscode.ThemeIcon(icon);
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
        return this.children = [
            new MetadataNode('Version', `"${md.version!}"`, 'Release version', 'verified'),
            new MetadataNode('Build Date', dt.toISODate()!, 'Build date'),
            new MetadataNode('Build Commit', md.commitId!, 'Build Commit'),
            new MetadataNode('Runtime', `${md.os!}_${md.arch!}`, 'Runtime OS/Architecture'),
            new MetadataNode('Base Dir', md.baseDir!, 'Base directory for cached files'),
            new MetadataNode('HTTP', httpBaseURL, 'HTTP URL', undefined, true),
            new MetadataNode('gRPC', grpcBaseURL, 'GRPC URL', undefined, true),
            // new MetadataNode('Report Issue', 'https://github.com/stackb/bazel-stack-vscode/issues', 'Issue URL', 'bug', true),
            // new MetadataNode('--bes_backend', `grpc://${this.grpcConfig.address}`, 'BES backend address', 'pulse'),
            // new MetadataNode('--bes_results_url', `http://${this.httpConfig.address}/stream`, 'BES results URL prefix', 'pulse', true),
        ];
    }
}

export class MetadataNode extends Node {
    constructor(
        label: string,
        desc: string,
        tt: string,
        icon?: string,
        isUrl?: boolean,
    ) {
        super(label);
        this.description = desc;
        this.iconPath = new vscode.ThemeIcon(icon ? icon : 'dash');
        this.tooltip = tt;
        this.contextValue = 'metadata';
        if (isUrl) {
            this.command = {
                title: label,
                command: 'vscode.open',
                arguments: [vscode.Uri.parse(`${desc}`)],
            };
        }
    }
}

async function getMetadata(client: ApplicationServiceClient): Promise<Metadata | undefined> {
    // await clearContextGrpcStatusValue(this.viewId);
    return new Promise<Metadata>((resolve, reject) => {
        client.GetMetadata({}, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: Metadata) => {
            // await setContextGrpcStatusValue(this.viewId, err);
            if (err) {
                reject(err);
                return;
            }
            resolve(resp);
        });
    });
}
