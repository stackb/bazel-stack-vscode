import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { Container } from '../container';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import { AccountConfiguration, AccountSettings } from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';
import { RunnableComponent, Status } from './status';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { License } from '../proto/build/stack/license/v1beta1/License';
import { RenewLicenseResponse } from '../proto/build/stack/license/v1beta1/RenewLicenseResponse';

export function loadLicenseProtos(protofile: string): LicenseProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true,
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as LicenseProtoType;
}

class AccountClient extends GRPCClient {

    public readonly licenses: LicensesClient;

    constructor(
        address: vscode.Uri,
        creds: grpc.ChannelCredentials,
        proto: LicenseProtoType
    ) {
        super();

        this.licenses = this.addCloseable(
            new proto.build.stack.license.v1beta1.Licenses(address.authority, creds, {
                'grpc.initial_reconnect_backoff_ms': 200,
            })
        );
    }

    async getLicense(token: string): Promise<License | undefined> {
        return new Promise<License>((resolve, reject) => {
            this.licenses.Renew(
                { currentToken: token },
                new grpc.Metadata(),
                async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                    if (err) {
                        reject(this.handleError(err));
                        return;
                    }
                    resolve(resp!.license!);
                }
            );
        });
    }
}

export class Account extends RunnableComponent<AccountConfiguration> {

    public licenseToken: string = '';
    public client: AccountClient | undefined;

    constructor(
        public readonly settings: AccountSettings,
    ) {
        super(settings);
    }

    async start(): Promise<void> {
        switch (this.status) {
            case Status.LOADING: case Status.STARTING: case Status.READY:
                return;
        }
        // start calls settings such that we discover a configuration error upon
        // startup.
        try {
            this.setStatus(Status.LOADING);
            const cfg = await this.settings.get();
            const creds = getGRPCCredentials(cfg.serverAddress.authority);
            const proto = loadLicenseProtos(Container.protofile('license.proto').fsPath);
            this.client = new AccountClient(cfg.serverAddress, creds, proto);
            this.setStatus(Status.READY);
        } catch (e) {
            this.setError(e);
        }
    }

    async stop(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }

}
