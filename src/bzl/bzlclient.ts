import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import { CancelRequest } from '../proto/build/stack/bezel/v1beta1/CancelRequest';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { CommandHistory } from '../proto/build/stack/bezel/v1beta1/CommandHistory';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { DeleteCommandHistoryResponse } from '../proto/build/stack/bezel/v1beta1/DeleteCommandHistoryResponse';
import { ExternalListWorkspacesResponse } from '../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { FileDownloadResponse } from '../proto/build/stack/bezel/v1beta1/FileDownloadResponse';
import { FileKind } from '../proto/build/stack/bezel/v1beta1/FileKind';
import { FileServiceClient } from '../proto/build/stack/bezel/v1beta1/FileService';
import { HistoryClient } from '../proto/build/stack/bezel/v1beta1/History';
import { LabelKind } from '../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListCommandHistoryResponse } from '../proto/build/stack/bezel/v1beta1/ListCommandHistoryResponse';
import { ListPackagesResponse } from '../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesResponse } from '../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { ListWorkspacesResponse } from '../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Metadata } from '../proto/build/stack/bezel/v1beta1/Metadata';
import { Package } from '../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { ProtoGrpcType } from '../proto/bzl';
import { ButtonName } from './constants';

export interface Closeable {
    close(): void;
}

export class GRPCClient implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private closeables: Closeable[] = [];

    constructor(
        readonly address: string,
        protected defaultDeadlineSeconds = 30,
    ) {
    }

    protected getCredentials(address: string): grpc.ChannelCredentials {
        if (address.endsWith(':443')) {
            return grpc.credentials.createSsl();
        }
        return grpc.credentials.createInsecure();
    }

    protected getDeadline(seconds?: number): grpc.Deadline {
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds()
            + (seconds || this.defaultDeadlineSeconds));
        return deadline;
    }

    protected handleError(err: grpc.ServiceError): grpc.ServiceError {
        if (err.code === grpc.status.UNAVAILABLE) {
            return this.handleErrorUnavailable(err);
        }
        return err;
    }

    protected handleErrorUnavailable(err: grpc.ServiceError): grpc.ServiceError {
        return err;
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
    private readonly app: ApplicationServiceClient;
    private readonly externals: ExternalWorkspaceServiceClient;
    private readonly workspaces: WorkspaceServiceClient;
    private readonly packages: PackageServiceClient;
    public readonly commands: CommandServiceClient;
    private readonly history: HistoryClient;
    private readonly files: FileServiceClient;
    public metadata: Metadata | undefined;
    public isRemoteClient: boolean = false;

    constructor(
        readonly proto: ProtoGrpcType,
        readonly address: string,
        private onDidRequestRestart?: vscode.EventEmitter<void>,
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

    async waitForReady(seconds: number = 2): Promise<Metadata> {
        return this.getMetadata(true, seconds);
    }

    protected handleErrorUnavailable(err: grpc.ServiceError): grpc.ServiceError {
        if (this.onDidRequestRestart) {
            vscode.window.showWarningMessage(
                `The server at ${this.address} is unavailable.  Would you like to restart?`,
                ButtonName.Yes, ButtonName.NoThanks,
            ).then(response => {
                if (response === ButtonName.Yes) {
                    this.onDidRequestRestart!.fire();
                }
            });
        } else {
            vscode.window.showWarningMessage(
                `The server at ${this.address} is unavailable.  Please check that the tcp connection is still valid.`,
            );
        }
        return err;
    }

    async getMetadata(waitForReady = false, deadlineSeconds = 30): Promise<Metadata> {
        return new Promise<Metadata>((resolve, reject) => {
            this.app.GetMetadata(
                {},
                new grpc.Metadata({ waitForReady: waitForReady }),
                { deadline: this.getDeadline(deadlineSeconds) },
                (err?: grpc.ServiceError, resp?: Metadata) => {
                    if (err) {
                        err = this.handleError(err);
                        reject(`could not get application metadata: ${err}`);
                    } else {
                        this.metadata = resp;
                        resolve(resp);
                    }
                });
        });
    }

    async listHistory(cwd: string): Promise<CommandHistory[] | undefined> {
        return new Promise<CommandHistory[]>((resolve, reject) => {
            this.history.List(
                { cwd },
                new grpc.Metadata(),
                { deadline: this.getDeadline() },
                async (err?: grpc.ServiceError, resp?: ListCommandHistoryResponse) => {
                    if (err) {
                        reject(this.handleError(err));
                    } else {
                        resolve(resp?.history);
                    }
                });
        });
    }

    async deleteCommandHistoryById(id: string): Promise<DeleteCommandHistoryResponse | undefined> {
        return new Promise<DeleteCommandHistoryResponse>((resolve, reject) => {
            this.history.Delete(
                { id: id },
                new grpc.Metadata(),
                { deadline: this.getDeadline() },
                async (err?: grpc.ServiceError, resp?: DeleteCommandHistoryResponse) => {
                    if (err) {
                        reject(this.handleError(err));
                    } else {
                        resolve(resp);
                    }
                });
        });
    }

    async cancelCommand(
        request: CancelRequest,
        md: grpc.Metadata = new grpc.Metadata(),
    ): Promise<CancelResponse> {
        return new Promise((resolve, reject) => {
            this.commands.cancel(request, md, (err: grpc.ServiceError | undefined, response: CancelResponse | undefined) => {
                if (err) {
                    reject(this.handleError(err));
                } else {
                    resolve(response!);
                }
            });
        });
    }

    async listWorkspaces(refresh: boolean = false): Promise<Workspace[]> {
        return new Promise<Workspace[]>((resolve, reject) => {
            this.workspaces.List({
                refresh: refresh,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListWorkspacesResponse) => {
                if (err) {
                    reject(this.handleError(err));
                } else {
                    resolve(resp?.workspace);
                }
            });
        });
    }

    async listExternalWorkspaces(workspace: Workspace): Promise<ExternalWorkspace[] | undefined> {
        return new Promise<ExternalWorkspace[]>((resolve, reject) => {
            this.externals.ListExternal(
                { workspace: workspace },
                new grpc.Metadata(),
                { deadline: this.getDeadline() },
                async (err?: grpc.ServiceError, resp?: ExternalListWorkspacesResponse) => {
                    if (err) {
                        reject(this.handleError(err));
                    } else {
                        resolve(resp?.workspace);
                    }
                });
        });
    }

    async listPackages(workspace: Workspace, external?: ExternalWorkspace): Promise<Workspace[]> {
        return new Promise<Workspace[]>((resolve, reject) => {
            this.packages.ListPackages({
                workspace: workspace,
                externalWorkspace: external,
            },
                new grpc.Metadata(),
                { deadline: this.getDeadline() },
                async (err?: grpc.ServiceError, resp?: ListPackagesResponse) => {
                    if (err) {
                        reject(this.handleError(err));
                    } else {
                        resolve(resp?.package);
                    }
                });
        });
    }

    async listRules(workspace: Workspace, external?: ExternalWorkspace, pkg?: Package): Promise<LabelKind[]> {
        return new Promise<LabelKind[]>((resolve, reject) => {
            this.packages.ListRules({
                workspace: workspace,
                externalWorkspace: external,
                package: pkg,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListRulesResponse) => {
                if (err) {
                    reject(this.handleError(err));
                } else {
                    resolve(resp?.rule);
                }
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
                    reject(this.handleError(err));
                } else {
                    resolve(resp);
                }
            });
        });
    }
}