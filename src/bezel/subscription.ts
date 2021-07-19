import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { Container } from '../container';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import {
  SubscriptionConfiguration,
  SubscriptionSettings,
  BzlSettings,
  writeLicenseFile,
} from './configuration';
import { GRPCClient } from './grpcclient';
import { getGRPCCredentials } from './proto';
import { RunnableComponent, Status } from './status';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { License } from '../proto/build/stack/license/v1beta1/License';
import { RenewLicenseResponse } from '../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { CommandName } from './constants';
import request = require('request');
import { BuiltInCommands } from '../constants';
import { UriHandler } from './urihandler';

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

  constructor(address: vscode.Uri, creds: grpc.ChannelCredentials, proto: LicenseProtoType) {
    super(err => this.handleGrpcError(err));

    this.licenses = this.addCloseable(
      new proto.build.stack.license.v1beta1.Licenses(address.authority, creds, {
        'grpc.initial_reconnect_backoff_ms': 200,
      })
    );
  }

  handleGrpcError(err: grpc.ServiceError) {
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

export class Subscription extends RunnableComponent<SubscriptionConfiguration> {
  public client: AccountClient | undefined;

  constructor(
    public readonly settings: SubscriptionSettings,
    private readonly bzlSettings: BzlSettings,
    private readonly proto = loadLicenseProtos(Container.protofile('license.proto').fsPath)
  ) {
    super('STB', settings);

    new UriHandler(this.disposables);

    this.disposables.push(
      vscode.commands.registerCommand(CommandName.Login, this.handleCommandLogin, this)
    );
  }

  async handleCommandLogin(release: string, token: string): Promise<void> {
    const bzlCfg = await this.bzlSettings.get();
    const subscription = await this.settings.get();

    request.get(
      bzlCfg.downloadBaseURL + '/latest/license.key',
      {
        auth: {
          bearer: token,
        },
      },
      (err, resp, body) => {
        if (err) {
          vscode.window.showErrorMessage(`could not download license file: ${err.message}`);
          return;
        }
        if (resp.statusCode !== 200) {
          vscode.window.showErrorMessage(
            `unexpected HTTP response code whhile downloading license file: ${resp.statusCode}: ${resp.statusMessage}`
          );
          return;
        }
        writeLicenseFile(body);
        subscription.token = token;
        return vscode.commands.executeCommand(BuiltInCommands.Reload);
      }
    );
  }

  async startInternal(): Promise<void> {
    // start calls settings such that we discover a configuration error upon
    // startup.
    try {
      const cfg = await this.settings.get();
      if (!cfg.token) {
        this.setDisabled(true);
        return;
      }
      this.setStatus(Status.STARTING);
      const creds = getGRPCCredentials(cfg.serverAddress.authority);
      this.client = new AccountClient(cfg.serverAddress, creds, this.proto);
      this.setStatus(Status.READY);
    } catch (e) {
      this.setError(e);
    }
  }

  async stopInternal(): Promise<void> {
    this.setStatus(Status.STOPPED);
  }
}
