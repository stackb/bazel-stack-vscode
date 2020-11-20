import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { Telemetry } from '../constants';
import { Container } from '../container';
import { License } from '../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../proto/build/stack/license/v1beta1/RenewLicenseResponse';

/**
 * BzlLicenseRenewer listens for expiration events, attempts to renew the
 * license, and emits the updated license token if successful.
 */
export class BzlLicenseRenewer implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private currentToken: string = '';

    constructor(
        // input signal when the license has expired
        onDidBzlLicenseExpire: vscode.EventEmitter<void>,
        // output signal to call when license has been renewed/changed.
        // string argument is the license token.
        private onDidBzlLicenseTokenChange: vscode.EventEmitter<string>,
        private client: LicensesClient,
    ) {
        this.disposables.push(onDidBzlLicenseExpire.event(() => this.renew()));
        this.disposables.push(onDidBzlLicenseTokenChange.event(token => {
            this.currentToken = token;
        }));
    }

    private async renew(): Promise<any> {
        const btnRenew = 'Renew License';
        const input = await vscode.window.showWarningMessage(
            'The bzl license has expired.  Confirm to renew.',
            btnRenew
        );
        if (input === btnRenew) {
            return this.doRenew();
        }
    }

    private async doRenew(): Promise<License> {
        if (!this.currentToken) {
            return Promise.reject('license token must be defined');
        }
        
        return new Promise<License>((resolve, reject) => {
            const req = {
                currentToken: this.currentToken,
            };
            this.client.Renew(req, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                if (err) {
                    reject(err);
                    vscode.window.showErrorMessage(
                        `Bzl license renewal failed: ${err.message} (${err.code})`);
                    Container.telemetry.sendTelemetryEvent(Telemetry.LicenseRenewFailed);
                    return;
                }
                this.onDidBzlLicenseTokenChange.fire(resp?.newToken!);
                Container.telemetry.sendTelemetryEvent(Telemetry.LicenseRenewSuccess);
                vscode.window.showInformationMessage(
                    `License successfully renewed for ${resp?.license?.name} (${resp?.license?.subscriptionName})`);
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
