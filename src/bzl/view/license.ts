import * as grpc from '@grpc/grpc-js';
import * as Long from 'long';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../constants';

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = '<unknown>';

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BzlLicenseView implements vscode.Disposable, vscode.TreeDataProvider<LicenseItem> {
    private readonly viewId = 'bzl-license';
    private readonly commandRefresh = 'feature.bzl.license.view.refresh';

    private disabled: boolean = false;
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
        if (this.disabled) {
            return [];
        }
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

    private async getLicense(): Promise<License | undefined> {
        if (this.license) {
            return Promise.resolve(this.license);
        }
        if (!this.token) {
            await setContextGrpcStatusValue(this.viewId, {
                name: 'Invalid token confuguration',
                code: grpc.status.FAILED_PRECONDITION,
                message: 'License token must be configured',
                metadata: new grpc.Metadata(),
                details: '',
            });
            return Promise.resolve(undefined);
        }
        
        await clearContextGrpcStatusValue(this.viewId);

        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.token,
            };
            this.client.Renew(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                await setContextGrpcStatusValue(this.viewId, err);
                resolve(resp?.license);
            });
        });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;    
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