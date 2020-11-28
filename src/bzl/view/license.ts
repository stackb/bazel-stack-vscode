import * as grpc from '@grpc/grpc-js';
import * as Long from 'long';
import * as luxon from 'luxon';
import * as vscode from 'vscode';
import { clearContextGrpcStatusValue, setContextGrpcStatusValue } from '../../common';
import { ExtensionName } from '../../constants';
import { Container, MediaIconName } from '../../container';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { AccountItemName, ViewName } from '../constants';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

/**
 * Renders a view for bezel license status.
 */
export class BzlAccountView extends GrpcTreeDataProvider<AccountItem> {
    private license: License | undefined;
    private currentToken: string = '';

    constructor(
        onDidBzlLicenseTokenChange: vscode.EventEmitter<string>,
        private client: LicensesClient,
    ) {
        super(ViewName.Account);
        this.disposables.push(onDidBzlLicenseTokenChange.event(token => {
            this.currentToken = token;
        }));
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
        if (!this.currentToken) {
            await setContextGrpcStatusValue(ExtensionName, ViewName.Account, {
                name: 'Invalid token configuration',
                code: grpc.status.FAILED_PRECONDITION,
                message: 'License token must be configured',
                metadata: new grpc.Metadata(),
                details: '',
            });
            return Promise.resolve(undefined);
        }

        await clearContextGrpcStatusValue(ExtensionName, ViewName.Account);

        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.currentToken,
            };
            this.client.Renew(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                await setContextGrpcStatusValue(ExtensionName, ViewName.Account, err);
                resolve(resp?.license);
            });
        });
    }
}

function createLicenseItems(lic: License): AccountItem[] {
    const dt = luxon.DateTime.fromSeconds(Long.fromValue(lic.expiresAt?.seconds as Long).toNumber());
    return [
        new AccountItem(AccountItemName.ID,
            `${lic.id}`, 'Registered user ID', lic.avatarUrl),
        new AccountItem(AccountItemName.Name,
            `${lic.name}`, 'Registered user name'),
        new AccountItem(AccountItemName.Email,
            `${lic.email}`, 'Registered user email address'),
        new AccountItem(AccountItemName.Subscription,
            `${lic.subscriptionName}`, 'Name of the subscription you are registered under'),
        new AccountItem(AccountItemName.Exp,
            `${dt.toISODate()}`, 'Expiration date of this license'),
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
        this.iconPath = iconUrl ? vscode.Uri.parse(iconUrl) : Container.mediaIconPath(MediaIconName.StackBuild);
    }
}