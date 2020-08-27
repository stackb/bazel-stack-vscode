import * as grpc from '@grpc/grpc-js';
import * as Long from 'long';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { LicenseStatusResponse } from '../../proto/build/stack/license/v1beta1/LicenseStatusResponse';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = '<unknown>';

export type LicenseCallback = (err?: grpc.ServiceError, resp?: LicenseStatusResponse) => void;
export type LicenseProvider = (token: string, callback: LicenseCallback) => void;

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BzlLicenseView implements vscode.Disposable, vscode.TreeDataProvider<LicenseItem> {
    private readonly viewId = 'bzl-license';
    private readonly commandRefresh = 'feature.bzl.license.view.refresh';

    private disposables: vscode.Disposable[] = [];
    private license: License | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<LicenseItem | undefined> = new vscode.EventEmitter<LicenseItem | undefined>();

    constructor(
        private token: string,
        private client: LicensesClient
    ) {
        this.disposables.push(vscode.window.registerTreeDataProvider(this.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(this.commandRefresh, this.refresh, this));
    }

    readonly onDidChangeTreeData: vscode.Event<LicenseItem | undefined> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: LicenseItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: LicenseItem): Promise<LicenseItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }

    private async getRootItems(): Promise<LicenseItem[]> {
        const lic = await this.getLicense();
        if (!lic) {
            return [];
        }
        return createLicenseItems(lic);
    }

    private async getLicense(): Promise<License> {
        if (this.license) {
            return Promise.resolve(this.license);
        }
        await clearContextGrpcStatusValue(this.viewId);

        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.token,
            };
            this.client.Status(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: LicenseStatusResponse) => {
                await setContextGrpcStatusValue(this.viewId, err);
                resolve(resp?.license);
            });
        });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

function createLicenseItems(lic: License): LicenseItem[] {
    const dt = luxon.DateTime.fromSeconds(Long.fromValue(lic.expiresAt?.seconds as Long).toNumber());
    return [
        new LicenseItem('Name', `${lic.name}` || DescUnknown, 'Registered user name'),
        new LicenseItem('Email', `${lic.email}` || DescUnknown, 'Registered user email address'),
        new LicenseItem('Subscription', `${lic.subscriptionName}` || DescUnknown, 'Name of the subscription you are registered under'),
        new LicenseItem('Exp', `${dt.toISODate()}` || DescUnknown, 'Expiration date of this license'),
    ];
}

export class LicenseItem extends vscode.TreeItem {
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