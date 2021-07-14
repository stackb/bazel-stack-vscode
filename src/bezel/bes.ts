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
import { ConnectivityState } from '@grpc/grpc-js/build/src/channel';

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

}

export class BuildEventService extends RunnableComponent<BuildEventServiceConfiguration> {

    constructor(
        public readonly settings: BuildEventServiceSettings,
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
            const proto = loadPublishBuildEventServiceProtos(Container.protofile('publish_build_event.proto').fsPath);
            const client = new PBEClient(cfg.address, creds, proto);
            const state = client.pbe.getChannel().getConnectivityState(true);
            this.setStatusFromConnectivityState(state);
        } catch (e) {
            this.setError(e);
        }
    }

    async stop(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }

}
