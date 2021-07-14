import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { Container } from '../container';
import { ProtoGrpcType as PublishBuildEventServiceProtoType } from '../proto/publish_build_event';
import { BuildEventServiceConfiguration, BuildEventServiceSettings } from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';
import { RunnableComponent, Status } from './status';
import { PublishBuildEventClient } from '../proto/google/devtools/build/v1/PublishBuildEvent';
import { PublishBuildToolEventStreamResponse } from '../proto/google/devtools/build/v1/PublishBuildToolEventStreamResponse';
import { Empty } from '../proto/google/protobuf/Empty';
import { PublishLifecycleEventRequest } from '../proto/google/devtools/build/v1/PublishLifecycleEventRequest';

function loadPublishBuildEventServiceProtos(protofile: string): PublishBuildEventServiceProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        defaults: false,
        oneofs: true,
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as PublishBuildEventServiceProtoType;
}

class PBEClient extends GRPCClient {

    public readonly pbe: PublishBuildEventClient;

    constructor(
        uri: vscode.Uri,
        creds: grpc.ChannelCredentials,
        proto: PublishBuildEventServiceProtoType
    ) {
        super();

        this.pbe = this.addCloseable(
            new proto.google.devtools.build.v1.PublishBuildEvent(uri.authority, creds)
        );
    }

    async publishLifecycleEvent(req: PublishLifecycleEventRequest, waitForReady = false, deadlineSeconds = 3): Promise<Empty> {
        return new Promise<Empty>((resolve, reject) => {
            this.pbe.PublishLifecycleEvent(
                req,
                new grpc.Metadata({ waitForReady: waitForReady }),
                { deadline: this.getDeadline(deadlineSeconds) },
                (err?: grpc.ServiceError, resp?: Empty) => {
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

export class BuildEventService extends RunnableComponent<BuildEventServiceConfiguration> {

    constructor(
        public readonly settings: BuildEventServiceSettings,
        private readonly proto = loadPublishBuildEventServiceProtos(Container.protofile('publish_build_event.proto').fsPath),
    ) {
        super(settings);
    }

    async start(): Promise<void> {
        switch (this.status) {
            case Status.LOADING: case Status.STARTING: case Status.READY:
                return;
        }
        try {
            this.setStatus(Status.LOADING);
            const cfg = await this.settings.get();
            const creds = getGRPCCredentials(cfg.address.authority);
            const client = new PBEClient(cfg.address, creds, this.proto);
            try {
                const stream = client.pbe.publishBuildToolEventStream(new grpc.Metadata());
                stream.on('end', () => {
                    this.setStatus(Status.READY);
                });
                stream.on('error', (err: Error) => {
                    this.setError(err);
                });
                stream.on('data', (response: PublishBuildToolEventStreamResponse) => {
                    this.setStatus(Status.UNKNOWN);
                });           
                // Intentionally write an empty / invalid request and expect
                // server responds with InvalidArgument.               
                stream.write({}, (args: any) => {
                    console.log('write args', args);
                });
                this.setStatus(Status.READY); // should not do this, but perhaps a relay proxy accepts anything.
            } catch (err) {
                const grpcErr: grpc.ServiceError = err as grpc.ServiceError;
                switch (grpcErr.code) {
                    case grpc.status.INVALID_ARGUMENT:
                        this.setStatus(Status.READY);
                        break;
                    default:
                        this.setError(err);
                }
                this.setStatus(Status.ERROR);
            }
        } catch (e) {
            this.setError(e);
        }
    }

    async stop(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }

}
