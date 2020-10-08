import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { LicensesClient } from '../../../proto/./build/stack/license/v1beta1/Licenses';
import { License } from '../../../proto/build/stack/license/v1beta1/License';
import { RenewLicenseResponse } from '../../../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { GRPCResponseFlow } from './grpcResponseFlow';

export class RenewLicenseFlow extends GRPCResponseFlow<RenewLicenseResponse> {
    constructor(
        protected licensesClient: LicensesClient,
        protected bearerToken: string,
        protected registrationFlow: () => Promise<void>,
        protected expiredLicenseFlow: () => Promise<void>,
        protected successFlow: (license: License, token: string) => Promise<void>,
    ) {
        super('license', bearerToken);
    }

    async handleResponse(response: RenewLicenseResponse): Promise<RenewLicenseResponse> {
        await this.successFlow(response.license!, response.newToken!);
        return response;
    }

    async handleServiceError(status: grpc.ServiceError): Promise<void> {
        if (status.code === grpc.status.NOT_FOUND) {
            return this.handleStatusNotFound(status);
        }
        if (status.code === grpc.status.FAILED_PRECONDITION) {
            return this.handleStatusFailedPrecondition(status);
        }
        if (status.code === grpc.status.RESOURCE_EXHAUSTED) {
            return this.handleStatusResourceExhausted(status);
        }
        super.handleServiceError(status);
    }

    /**
     * Handle the case where user is not a customer or has no subscriptions.
     * 
     * @param status The service error
     */
    async handleStatusNotFound(status: grpc.ServiceError): Promise<void> {
        return this.registrationFlow();
    }

    /**
     * Handle the case where user is not a customer or has no subscriptions.
     * 
     * @param status The service error
     */
    async handleStatusFailedPrecondition(status: grpc.ServiceError): Promise<void> {
        return this.registrationFlow();
    }

    /**
     * Handle the case where license has expired.
     * 
     * @param status The service error
     */
    async handleStatusResourceExhausted(status: grpc.ServiceError): Promise<void> {
        return this.expiredLicenseFlow();
    }

    getInternal(): Promise<{response: RenewLicenseResponse | undefined, error: grpc.ServiceError | undefined}> {
        return new Promise((resolve, _) => {
            this.licensesClient.Renew({}, this.getGrpcMetadata(), (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                resolve({
                    response: resp,
                    error: err,
                });
            });
        });
    }

}

export async function saveLicenseToken(license: License | undefined, token: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('bsv.bzl.license');
    await config.update('token', token, vscode.ConfigurationTarget.Global);
}
