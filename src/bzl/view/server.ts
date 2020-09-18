import * as grpc from '@grpc/grpc-js';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { ApplicationServiceClient } from '../../proto/build/stack/bezel/v1beta1/ApplicationService';
import { Metadata } from '../../proto/build/stack/bezel/v1beta1/Metadata';
import { BzlGrpcServerConfiguration, BzlHttpServerConfiguration } from '../configuration';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';
import Long = require('long');

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = '<unknown>';

/**
 * Renders a view for bezel server status.
 */
export class BzlServerView implements vscode.Disposable, vscode.TreeDataProvider<MetadataItem> {
    private readonly viewId = 'bzl-server';
    private readonly commandRefresh = 'feature.bzl.server.view.refresh';
    static readonly commandCopyFlag = 'bzl-server.copyFlag';
    static readonly commandResultExplore = 'bzl-server.bes_results.explore';

    private disabled: boolean = false;
    private metadata: Metadata | undefined;
    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataItem | undefined> = new vscode.EventEmitter<MetadataItem | undefined>();

    constructor(
        private grpcConfig: BzlGrpcServerConfiguration,
        private httpConfig: BzlHttpServerConfiguration,
        private client: ApplicationServiceClient,
        private skipRegisterCommands = false,
    ) {
        if (!skipRegisterCommands) {
            this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
            this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
            this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandCopyFlag, this.handleCommandCopyFlag, this));
            this.disposables.push(vscode.commands.registerCommand(BzlServerView.commandResultExplore, this.handleCommandResultsExplore, this));
        }
    }

    readonly onDidChangeTreeData: vscode.Event<MetadataItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MetadataItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MetadataItem): Promise<MetadataItem[] | undefined> {
        if (this.disabled) {
            return [];
        }
        if (element) {
            return [];
        }
        return this.getRootItems();
    }

    async handleCommandCopyFlag(node: MetadataItem): Promise<void> {
        vscode.window.setStatusBarMessage(`Copied ${node.description}`, 3000);
        return vscode.env.clipboard.writeText(node.description);

    }

    handleCommandResultsExplore(item: MetadataItem): void {
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(item.description));
    }

    private async getRootItems(): Promise<MetadataItem[]> {
        const md = await this.getMetadata();
        if (!md) {
            return [];
        }
        return this.createMetadataItems(md);
    }

    private async getMetadata(): Promise<Metadata | undefined> {
        if (this.metadata) {
            return Promise.resolve(this.metadata);
        }

        await clearContextGrpcStatusValue(this.viewId);

        return new Promise<Metadata>((resolve, reject) => {
            this.client.GetMetadata({}, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: Metadata) => {
                await setContextGrpcStatusValue(this.viewId, err);
                resolve(resp);
            });
        });
    }

    createMetadataItems(md: Metadata): MetadataItem[] {
        const dt = luxon.DateTime.fromSeconds(Long.fromValue(md.buildDate!.seconds as Long).toNumber());

        const baseURLItem = new MetadataItem('Base URL', md.baseUrl || DescUnknown, 'Base HTTP URL');
        baseURLItem.contextValue = 'url';

        const besResultsItem = new MetadataItem('--bes_results_url', `http://${this.httpConfig.address}/stream` || DescUnknown, 'BES results URL prefix');
        besResultsItem.contextValue = 'url';
        
        return [
            new MetadataItem('Version', md.version || DescUnknown, 'Release version'),
            new MetadataItem('Build Date', dt.toISODate() || DescUnknown, 'Build date'),
            new MetadataItem('Build Commit', md.commitId || DescUnknown, 'Build Commit'),
            new MetadataItem('Base Dir', md.baseDir || DescUnknown, 'Base directory for cached files'),
            baseURLItem,
            new MetadataItem('--bes_backend', `grpc://${this.grpcConfig.address}` || DescUnknown, 'BES backend address'),
            besResultsItem,
        ];
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}


export class MetadataItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
        private tt?: string,
        iconUrl?: string,
    ) {
        super(label);
        if (iconUrl) {
            // @ts-ignore
            this.iconPath = vscode.Uri.parse(iconUrl);
        }
    }

    // @ts-ignore
    get tooltip(): string {
        return this.tt || `${this.label}-${this.desc}`;
    }

    // @ts-ignore
    get description(): string {
        return this.desc;
    }

    iconPath = stackbSvg;
}