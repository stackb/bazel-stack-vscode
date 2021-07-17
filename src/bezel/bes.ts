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
    proto: PublishBuildEventServiceProtoType
  ) {
    super();

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

    bzl.onDidChangeStatus(
      status => {
        // If we are disabled, re-reenable if any other bzl status.
        if (this.status === Status.DISABLED && status !== Status.DISABLED) {
          this.setDisabled(false);
        }

        switch (status) {
          // Disable if upstream is disabled
          case Status.DISABLED:
            this.setDisabled(true);
            break;
          // If launching, follow that.
          case Status.LAUNCHING:
            this.setStatus(status);
            break;
          // if ready, show ready also (kindof a hack)
          case Status.READY:
            this.setStatus(status);
            break;
          default:
            this.restart();
            break;
        }
      },
      this,
      this.disposables
    );
  }

  async startInternal(): Promise<void> {
    try {
      this.setStatus(Status.STARTING);
      const cfg = await this.settings.get();
      const creds = getGRPCCredentials(cfg.address.authority);
      const client = new PBEClient(cfg.address, creds, this.proto);

      const stream = client.pbe.publishBuildToolEventStream(new grpc.Metadata());

      stream.on('error', (err: grpc.ServiceError) => {
        const grpcErr: grpc.ServiceError = err as grpc.ServiceError;
        if (grpcErr.code === grpc.status.INVALID_ARGUMENT) {
          this.setStatus(Status.READY);
        } else {
          this.setError(err);
        }
      });

      stream.on('data', (response: PublishBuildToolEventStreamResponse) => {
        this.setStatus(Status.UNKNOWN);
      });

      // Intentionally write an empty / invalid request and expect
      // server responds with InvalidArgument.
      stream.write({}, (args: any) => {
        console.log('write args', args);
      });
      // this.setStatus(Status.READY); // should not do this, but perhaps a relay proxy accepts anything.
    } catch (e) {
      this.setError(e);
    }
  }

  async stopInternal(): Promise<void> {
    this.setStatus(Status.STOPPED);
  }
}
