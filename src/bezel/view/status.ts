import * as vscode from "vscode";
import * as path from 'path';
import * as grpc from '@grpc/grpc-js';

import { ApplicationClient } from "../../proto/build/stack/bzl/v1beta1/Application";
import { ApplicationMetadata } from "../../proto/build/stack/bzl/v1beta1/ApplicationMetadata";
import { Timestamp } from "../../proto/google/protobuf/Timestamp";

const DescUnknown = "<unknown>";

/**
 * Renders a view for bezel server status.  Makes a call to the metadata
 * endpoint to gather the data.
 */
export class BzlServerStatus implements vscode.Disposable, vscode.TreeDataProvider<MetadataItem> {
    private readonly viewId = 'stackb-status';
    private readonly commandRefresh = this.viewId + ".refresh";

    private disposables: vscode.Disposable[] = [];
    private metadata: ApplicationMetadata | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataItem | undefined> = new vscode.EventEmitter<MetadataItem | undefined>();

    constructor(
        private client: ApplicationClient
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, 
            this),
        );
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, 
            () => this.refresh(),
        ));
    }

    readonly onDidChangeTreeData: vscode.Event<MetadataItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MetadataItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MetadataItem): Thenable<MetadataItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return this.getRootItems();
        }
    }

    private async getRootItems(): Promise<MetadataItem[]> {
        return this.getApplicationMetadata().then(createApplicationMetadataStatusItems);
    }

    private async getApplicationMetadata(): Promise<ApplicationMetadata> {
        if (this.metadata) {
            return Promise.resolve(this.metadata);
        }
        return new Promise<ApplicationMetadata>((resolve, reject) => {
            this.client.getApplicationMetadata({}, new grpc.Metadata(), (err?: grpc.ServiceError, resp?: ApplicationMetadata) => {
                if (err) {
                    reject(`could not rpc application metadata: ${err}`);
                } else {
                    resolve(resp);
                }
            });
        });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

// info(this, `connected to "${resp?.name}" ${resp?.version} (${resp?.build_date?.seconds}^epoch ${resp?.commit_id})`);

function createApplicationMetadataStatusItems(md: ApplicationMetadata): MetadataItem[] {
    return [
        new MetadataItem("Release", `${md.version} (${md.commit_id?.slice(0, 6)})` || DescUnknown),
        new MetadataItem("Build Date", formatTimestamp(md.build_date) || DescUnknown),
    ];
}

function formatTimestamp(ts: Timestamp | undefined): string {
    if (!ts) {
        return DescUnknown;
    }
    return new Date(parseInt(ts.seconds as string) * 1000).toLocaleDateString();
}

class MetadataItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return `${this.label}-${this.desc}`;
    }

    get description(): string {
        return this.desc;
    }

    iconPath = {
        light: path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg'),
        dark: path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg')
    };

}
