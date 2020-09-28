import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { FileDownloadResponse } from '../proto/build/stack/bezel/v1beta1/FileDownloadResponse';
import { FileKind } from '../proto/build/stack/bezel/v1beta1/FileKind';
import { FileServiceClient } from '../proto/build/stack/bezel/v1beta1/FileService';
import { HistoryClient } from '../proto/build/stack/bezel/v1beta1/History';
import { Metadata } from '../proto/build/stack/bezel/v1beta1/Metadata';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { ProtoGrpcType } from '../proto/bzl';

export interface Closeable {
    close(): void;
}

export class GRPCClient implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private closeables: Closeable[] = [];

    constructor(
        readonly address: string,
    ) {
    }

    protected getCredentials(address: string): grpc.ChannelCredentials {
        if (address.endsWith(':443')) {
            return grpc.credentials.createSsl();
        }
        return grpc.credentials.createInsecure();
    
    }

    protected add<T extends Closeable>(client: T): T {
        this.closeables.push(client);
        return client;
    }

    public dispose() {
        for (const closeable of this.closeables) {
            closeable.close();
        }
        this.closeables.length = 0;
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}

export class BzlClient extends GRPCClient {
    public readonly app: ApplicationServiceClient;
    public readonly externals: ExternalWorkspaceServiceClient;
    public readonly workspaces: WorkspaceServiceClient;
    public readonly packages: PackageServiceClient;
    public readonly commands: CommandServiceClient;
    public readonly history: HistoryClient;
    public readonly files: FileServiceClient;
    public metadata: Metadata | undefined;

    constructor(
        readonly proto: ProtoGrpcType,
        readonly address: string,
    ) {
        super(address);
        
        const v1beta1 = proto.build.stack.bezel.v1beta1;
        const creds = this.getCredentials(address);
        this.app = this.add(new v1beta1.ApplicationService(address, creds, {
            'grpc.initial_reconnect_backoff_ms': 200,
        }));
        this.externals = this.add(new v1beta1.ExternalWorkspaceService(address, creds));
        this.workspaces = this.add(new v1beta1.WorkspaceService(address, creds));
        this.packages = this.add(new v1beta1.PackageService(address, creds));
        this.commands = this.add(new v1beta1.CommandService(address, creds));
        this.history = this.add(new v1beta1.History(address, creds));
        this.files = this.add(new v1beta1.FileService(address, creds));
    }

    httpURL(): string {
        const address = this.address;
        const scheme = address.endsWith(':443') ? 'https' : 'http';
        return `${scheme}://${address}`;
    }
    
    async getMetadata(): Promise<Metadata> {
        return new Promise<Metadata>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 30);
            this.app.GetMetadata({}, new grpc.Metadata({ waitForReady: true }), { deadline: deadline }, (err?: grpc.ServiceError, resp?: Metadata) => {
                if (err) {
                    reject(`could not get application metadata: ${err}`);
                    return;
                }
                this.metadata = resp;
                resolve(resp);
            });
        });
    }

    async downloadFile(workspace: Workspace, kind: FileKind, uri: string): Promise<FileDownloadResponse> {
        return new Promise<FileDownloadResponse>((resolve, reject) => {
            this.files.Download({
                label: uri,
                kind: kind,
                workspace: workspace,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: FileDownloadResponse) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(resp);
            });
        });
    }
}