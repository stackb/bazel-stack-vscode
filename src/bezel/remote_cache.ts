import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { Container } from '../container';
import { CapabilitiesClient } from '../proto/build/bazel/remote/execution/v2/Capabilities';
import { ServerCapabilities } from '../proto/build/bazel/remote/execution/v2/ServerCapabilities';
import { ProtoGrpcType as RemoteExecutionProtoType } from '../proto/remote_execution';
import { RemoteCacheConfiguration, RemoteCacheSettings } from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';
import { RunnableComponent, Status } from './status';

function loadRemoteExecutionProtos(protofile: string): RemoteExecutionProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        defaults: false,
        oneofs: true,
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as RemoteExecutionProtoType;
}

class RemoteCacheClient extends GRPCClient {

    public readonly capabilities: CapabilitiesClient;

    constructor(
        address: string,
        creds: grpc.ChannelCredentials,
        proto: RemoteExecutionProtoType
    ) {
        super();

        const uri = vscode.Uri.parse(address);
        this.capabilities = this.addCloseable(
            new proto.build.bazel.remote.execution.v2.Capabilities(uri.authority, creds, {
                'grpc.initial_reconnect_backoff_ms': 200,
            })
        );
    }

    async getServerCapabilities(instanceName = undefined, waitForReady = false, deadlineSeconds = 3): Promise<ServerCapabilities> {
        return new Promise<ServerCapabilities>((resolve, reject) => {
            this.capabilities.GetCapabilities(
                { instanceName },
                new grpc.Metadata({ waitForReady: waitForReady }),
                { deadline: this.getDeadline(deadlineSeconds) },
                (err?: grpc.ServiceError, resp?: ServerCapabilities) => {
                    if (err) {
                        reject(this.handleError(err));
                    } else {
                        resolve(resp!);
                    }
                }
            );
        });
    }

}

export class RemoteCache extends RunnableComponent<RemoteCacheConfiguration> {

    constructor(
        public readonly settings: RemoteCacheSettings,
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
            const creds = getGRPCCredentials(cfg.address);
            const proto = loadRemoteExecutionProtos(Container.protofile('remote_execution.proto').fsPath);
            const client = new RemoteCacheClient(cfg.address, creds, proto);
            this.setStatus(Status.STARTING);
            const capabilities = await client.getServerCapabilities();
            this.setStatus(Status.READY);
        } catch (e) {
            this.setError(e);
        }
    }

    async stop(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }

}
