import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { License } from "../../proto/build/stack/license/v1beta1/License";
import { LicensesClient } from "../../proto/build/stack/license/v1beta1/Licenses";
import { LicenseStatusResponse } from '../../proto/build/stack/license/v1beta1/LicenseStatusResponse';
import { Timestamp } from "../../proto/google/protobuf/Timestamp";
import { LicenseConfiguration } from '../configuration';

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = "<unknown>";

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BzlLicenseStatus implements vscode.Disposable, vscode.TreeDataProvider<MetadataItem> {
    private readonly viewId = 'bzl-license';
    private readonly commandRefresh = this.viewId + ".refresh";

    private disposables: vscode.Disposable[] = [];
    private license: License | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataItem | undefined> = new vscode.EventEmitter<MetadataItem | undefined>();

    constructor(
        private cfg: LicenseConfiguration,
        private client: LicensesClient
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
        return this.getLicense().then(createLicenseMetadataStatusItems);
    }

    private async getLicense(): Promise<License> {
        if (this.license) {
            return Promise.resolve(this.license);
        }
        return new Promise<License>((resolve, reject) => {
            this.client.Status({
                currentToken: this.cfg.token,
            }, new grpc.Metadata(), (err?: grpc.ServiceError, resp?: LicenseStatusResponse) => {
                if (err) {
                    reject(`could not rpc license: ${err}`);
                } else {
                    resolve(resp?.license);
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

function createLicenseMetadataStatusItems(lic: License): MetadataItem[] {
    return [
        new MetadataItem("Name", `${lic.name}` || DescUnknown),
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
        light: stackbSvg,
        dark: stackbSvg,
    };

}