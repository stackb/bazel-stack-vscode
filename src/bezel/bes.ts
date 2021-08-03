import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { Container } from '../container';
import { ProtoGrpcType as PublishBuildEventServiceProtoType } from '../proto/publish_build_event';
import { BuildEventServiceConfiguration, BuildEventServiceSettings } from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';
import { DisabledError, RunnableComponent, Status } from './status';
import { PublishBuildEventClient } from '../proto/google/devtools/build/v1/PublishBuildEvent';
import { Empty } from '../proto/google/protobuf/Empty';
import { PublishLifecycleEventRequest } from '../proto/google/devtools/build/v1/PublishLifecycleEventRequest';
import { Bzl } from './bzl';

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
    proto: PublishBuildEventServiceProtoType,
    onError: (err: grpc.ServiceError) => void
  ) {
    super(onError);

    this.pbe = this.addCloseable(
      new proto.google.devtools.build.v1.PublishBuildEvent(uri.authority, creds)
    );
  }

  async publishLifecycleEvent(
    req: PublishLifecycleEventRequest,
    waitForReady = false,
    deadlineSeconds = 3
  ): Promise<Empty> {
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
    public readonly bzl: Bzl,
    private readonly proto = loadPublishBuildEventServiceProtos(
      Container.protofile('publish_build_event.proto').fsPath
    )
  ) {
    super('BES', settings);

    bzl.onDidChangeStatus(this.restart, this, this.disposables);
  }

  async startInternal(): Promise<void> {
    if (this.bzl.status !== Status.READY) {
      throw new DisabledError('Bzl not ready');
    }

    const cfg = await this.settings.get();
    const creds = getGRPCCredentials(cfg.address.authority);

    return new Promise((resolve, reject) => {
      const client = new PBEClient(cfg.address, creds, this.proto, e => this.handleGrpcError(e));
      const stream = client.pbe.publishBuildToolEventStream(new grpc.Metadata());

      stream.on('error', (err: grpc.ServiceError) => {
        const grpcErr: grpc.ServiceError = err as grpc.ServiceError;
        if (grpcErr.code === grpc.status.INVALID_ARGUMENT) {
          resolve();
        } else {
          reject(err);
        }
      });

      // Intentionally write an empty / invalid request and expect
      // server responds with InvalidArgument.
      stream.write({}, (args: any) => {
        console.log('bes write args', args);
      });
    });
  }

  async stopInternal(): Promise<void> {}

  private handleGrpcError(err: grpc.ServiceError) {
    if (this.status !== Status.READY) {
      return;
    }
    switch (err.code) {
      case grpc.status.UNAVAILABLE:
        this.restart();
        break;
    }
  }
}
