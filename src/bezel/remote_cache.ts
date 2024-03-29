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
import { LaunchableComponent, LaunchArgs } from './status';
import { CommandName } from './constants';

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
    address: vscode.Uri,
    creds: grpc.ChannelCredentials,
    proto: RemoteExecutionProtoType,
    onError: (err: grpc.ServiceError) => void
  ) {
    super(onError);

    this.capabilities = this.addCloseable(
      new proto.build.bazel.remote.execution.v2.Capabilities(address.authority, creds, {
        'grpc.initial_reconnect_backoff_ms': 200,
      })
    );
  }

  async getServerCapabilities(
    instanceName = undefined,
    waitForReady = false,
    deadlineSeconds = 3
  ): Promise<ServerCapabilities> {
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

export class RemoteCache extends LaunchableComponent<RemoteCacheConfiguration> {
  constructor(
    public readonly settings: RemoteCacheSettings,
    private readonly proto = loadRemoteExecutionProtos(
      settings.configCtx.protoFile('remote_execution.proto').fsPath
    )
  ) {
    super('REC', settings, CommandName.LaunchRemoteCache, 'remote-cache');
  }

  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();
    const args: string[] = [cfg.executable!].concat(cfg.command);
    if (cfg.address) {
      args.push('--address', cfg.address.toString());
    }
    if (cfg.dir) {
      args.push('--dir', cfg.dir);
    }
    if (cfg.maxSizeGb) {
      args.push('--max_size_gb', String(cfg.maxSizeGb));
    }
    return {
      command: args,
      showSuccessfulLaunchTerminal: false,
      showFailedLaunchTerminal: false,
    };
  }

  async shouldLaunch(e: Error): Promise<boolean> {
    const grpcError: grpc.ServiceError = e as grpc.ServiceError;
    if (grpcError.code === grpc.status.UNAVAILABLE) {
      const cfg = await this.settings.get();
      return cfg.autoLaunch;
    }
    return false;
  }

  async launchInternal(): Promise<void> {
    const cfg = await this.settings.get();
    const creds = getGRPCCredentials(cfg.address.authority);

    return new Promise((resolve, reject) => {
      const client = new RemoteCacheClient(cfg.address, creds, this.proto, err => reject(err));
      client.getServerCapabilities().then(() => resolve(), reject);
    });
  }
}
