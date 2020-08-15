import * as grpc from '@grpc/grpc-js';
import * as Long from 'long';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { LicenseStatusResponse } from '../../proto/build/stack/license/v1beta1/LicenseStatusResponse';
import { LicenseServerConfiguration } from '../configuration';

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = '<unknown>';

export type LicenseCallback = (err?: grpc.ServiceError, resp?: LicenseStatusResponse) => void;
export type LicenseProvider = (token: string, callback: LicenseCallback) => void;

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BzlLicenseStatus implements vscode.Disposable, vscode.TreeDataProvider<MetadataItem> {
    private readonly viewId = 'bzl-license';
    private readonly commandRefresh = 'feature.bzl.license.view.refresh';

    private disposables: vscode.Disposable[] = [];
    private license: License | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<MetadataItem | undefined> = new vscode.EventEmitter<MetadataItem | undefined>();

    constructor(
        private cfg: LicenseServerConfiguration,
        private client: LicensesClient
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
    }

    readonly onDidChangeTreeData: vscode.Event<MetadataItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: MetadataItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MetadataItem): Promise<MetadataItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }

    private async getRootItems(): Promise<MetadataItem[]> {
        return this.getLicense().then(createLicenseMetadataStatusItems);
    }

    private async getLicense(): Promise<License> {
        if (this.license) {
            return Promise.resolve(this.license);
        }
        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.cfg.token,
            };
            this.client.Status(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: LicenseStatusResponse) => {
                if (err) {
                    console.log('License error', err);
                    const config = vscode.workspace.getConfiguration('feature.bzl.license');
                    const currentStatus = config.get('status');
                    if (err.code !== currentStatus) {
                        await config.update('status', err.code);
                    }
                    reject(`could not rpc license: ${err}`);
                } else {
                    console.log('License OK', resp?.license);
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
    const dt = luxon.DateTime.fromSeconds(Long.fromValue(lic.expiresAt?.seconds as Long).toNumber());
    return [
        new MetadataItem('Name', `${lic.name}` || DescUnknown, 'Registered user name'),
        new MetadataItem('Email', `${lic.email}` || DescUnknown, 'Registered user email address'),
        new MetadataItem('Subscription', `${lic.subscriptionName}` || DescUnknown, 'Name of the subscription you are registered under'),
        new MetadataItem('Exp', `${dt.toISODate()}` || DescUnknown, 'Expiration date of this license'),
    ];
}

class MetadataItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private desc: string,
        private tt?: string,
    ) {
        super(label);
    }

    get tooltip(): string {
        return this.tt || `${this.label}-${this.desc}`;
    }

    get description(): string {
        return this.desc;
    }

    iconPath = {
        light: stackbSvg,
        dark: stackbSvg,
    };

}