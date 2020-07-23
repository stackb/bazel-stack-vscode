import * as vscode from "vscode";
import * as path from 'path';
import * as grpc from '@grpc/grpc-js';

import { ApplicationClient } from "../../proto/build/stack/bzl/v1beta1/Application";
import { ApplicationMetadata } from "../../proto/build/stack/bzl/v1beta1/ApplicationMetadata";
import { Timestamp } from "../../proto/google/protobuf/Timestamp";

const DescUnknown = "<unknown>";

/**
 * Renders a view for bezel server status.
 */
export class BzlServerStatus implements vscode.Disposable, vscode.TreeDataProvider<StatusItem> {
    private readonly viewId = 'bezel-status';

    private disposables: vscode.Disposable[] = [];
    private metadata: ApplicationMetadata | undefined;

    constructor(
        private client: ApplicationClient
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
    }

    getTreeItem(element: StatusItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: StatusItem): Thenable<StatusItem[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return this.getRootItems();
        }
    }

    private async getRootItems(): Promise<StatusItem[]> {
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

function createApplicationMetadataStatusItems(md: ApplicationMetadata): StatusItem[] {
    return [
        new StatusItem("release", `${md.version} (${md.commit_id?.slice(0, 6)})` || DescUnknown),
        new StatusItem("build date", formatTimestamp(md.build_date) || DescUnknown),
    ];
}

function formatTimestamp(ts: Timestamp | undefined): string {
    if (!ts) {
        return DescUnknown;
    }
    return new Date(parseInt(ts.seconds as string) * 1000).toLocaleDateString();
}

class StatusItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return `${this.label}-${this.desc}`;
    }

    get description(): string {
        return this.desc;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', '..', 'resources', 'light', 'dependency.svg'),
        dark: path.join(__filename, '..', '..', '..', 'resources', 'dark', 'dependency.svg')
    };
}