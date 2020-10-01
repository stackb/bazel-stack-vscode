import * as grpc from '@grpc/grpc-js';
import * as Long from 'long';
import * as luxon from 'luxon';
import * as path from 'path';
import * as vscode from 'vscode';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { AccountItemName, clearContextGrpcStatusValue, setContextGrpcStatusValue, ViewName } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');
const DescUnknown = '<unknown>';

/**
 * Renders a view for bezel license status.
 */
export class BzlAccountView extends GrpcTreeDataProvider<AccountItem> {
    private license: License | undefined;

    constructor(
        private token: string,
        private client: LicensesClient,
    ) {
        super(ViewName.Account);
    }

    async getRootItems(): Promise<AccountItem[]> {
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
            await setContextGrpcStatusValue(ViewName.Account, {
                name: 'Invalid token configuration',
                code: grpc.status.FAILED_PRECONDITION,
                message: 'License token must be configured',
                metadata: new grpc.Metadata(),
                details: '',
            });
            return Promise.resolve(undefined);
        }

        await clearContextGrpcStatusValue(ViewName.Account);

        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.token,
            };
            this.client.Renew(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                await setContextGrpcStatusValue(ViewName.Account, err);
                resolve(resp?.license);
            });
        });
    }
}

function createLicenseItems(lic: License): AccountItem[] {
    const dt = luxon.DateTime.fromSeconds(Long.fromValue(lic.expiresAt?.seconds as Long).toNumber());
    return [
        new AccountItem(AccountItemName.ID,
            `${lic.id}` || DescUnknown, 'Registered user ID', lic.avatarUrl || stackbSvg),
        new AccountItem(AccountItemName.Name,
            `${lic.name}` || DescUnknown, 'Registered user name'),
        new AccountItem(AccountItemName.Email,
            `${lic.email}` || DescUnknown, 'Registered user email address'),
        new AccountItem(AccountItemName.Subscription,
            `${lic.subscriptionName}` || DescUnknown, 'Name of the subscription you are registered under'),
        new AccountItem(AccountItemName.Exp,
            `${dt.toISODate()}` || DescUnknown, 'Expiration date of this license'),
    ];
}

export class AccountItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public description: string,
        public tooltip: string,
        iconUrl?: string,
    ) {
        super(label);
        this.iconPath = iconUrl ? vscode.Uri.parse(iconUrl) : stackbSvg;
    }
}