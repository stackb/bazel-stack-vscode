import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as vscode from 'vscode';
import { Container } from '../container';
import { CapabilitiesClient } from '../proto/build/bazel/remote/execution/v2/Capabilities';
import { ServerCapabilities } from '../proto/build/bazel/remote/execution/v2/ServerCapabilities';
import { ProtoGrpcType as RemoteExecutionProtoType } from '../proto/remote_execution';
import { RemoteCacheConfiguration } from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';

export function loadRemoteExecutionProtos(protofile: string): RemoteExecutionProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        defaults: false,
        oneofs: true,
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as RemoteExecutionProtoType;
}

export class RemoteCacheClient extends GRPCClient {

    protected readonly capabilities: CapabilitiesClient;

    constructor(
        onDidChangeRemoteCacheConfiguration: vscode.Event<RemoteCacheConfiguration>,
        creds: grpc.ChannelCredentials,
        proto: RemoteExecutionProtoType
    ) {
        super('');

        this.capabilities = this.add(
            new proto.build.bazel.remote.execution.v2.Capabilities(address, creds, {
                'grpc.initial_reconnect_backoff_ms': 200,
            })
        );
    }

    async getServerCapabilities(instanceName = undefined, waitForReady = true, deadlineSeconds = 3): Promise<ServerCapabilities> {
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

    /**
     * Create a new client for a remote execution Capabilities service.
     *
     * @param address The address to connect.
     */
    static fromAddress(address: string, creds = getGRPCCredentials(address)): RemoteCacheClient {
        const proto = loadRemoteExecutionProtos(Container.protofile('remote_execution.proto').fsPath);
        return new RemoteCacheClient(address, creds, proto);
    }

    static fromWorkspaceConfiguration(config: vscode.WorkspaceConfiguration): RemoteCacheClient {

    }
}