import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import {
  BazelConfiguration,
  BzlConfiguration,
  BzlSettings,
  InvocationsConfiguration,
} from './configuration';
import { CancelRequest } from '../proto/build/stack/bezel/v1beta1/CancelRequest';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { CodeSearchClient } from '../proto/build/stack/codesearch/v1beta1/CodeSearch';
import { CodeSearchResult } from '../proto/livegrep/CodeSearchResult';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { CreateScopeRequest } from '../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse } from '../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { ExternalListWorkspacesResponse } from '../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { FileDownloadResponse } from '../proto/build/stack/bezel/v1beta1/FileDownloadResponse';
import { FileKind } from '../proto/build/stack/bezel/v1beta1/FileKind';
import { FileServiceClient } from '../proto/build/stack/bezel/v1beta1/FileService';
import { GetScopeRequest } from '../proto/build/stack/codesearch/v1beta1/GetScopeRequest';
import { GRPCClient } from './grpcclient';
import { Info } from '../proto/build/stack/bezel/v1beta1/Info';
import { InfoResponse } from '../proto/build/stack/bezel/v1beta1/InfoResponse';
import { InfoServiceClient } from '../proto/build/stack/bezel/v1beta1/InfoService';
import { LabelKind } from '../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListPackagesResponse } from '../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesResponse } from '../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { ListScopesRequest } from '../proto/build/stack/codesearch/v1beta1/ListScopesRequest';
import { ListScopesResponse } from '../proto/build/stack/codesearch/v1beta1/ListScopesResponse';
import { ListWorkspacesResponse } from '../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Metadata } from '../proto/build/stack/bezel/v1beta1/Metadata';
import { Package } from '../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
import { Scope } from '../proto/build/stack/codesearch/v1beta1/Scope';
import { ScopedQuery } from '../proto/build/stack/codesearch/v1beta1/ScopedQuery';
import { ScopesClient } from '../proto/build/stack/codesearch/v1beta1/Scopes';
import { ShutdownResponse } from '../proto/build/stack/bezel/v1beta1/ShutdownResponse';
import { LaunchableComponent, LaunchArgs, Status } from './status';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { CommandName } from './constants';
import { Subscription as Subscription } from './subscription';
import { BEPRunner } from './bepRunner';
import { uiUrlForLabel } from './ui';
import { BuiltInCommands } from '../constants';
import { Settings } from './settings';

interface BzlCodesearch {
  createScope(
    request: CreateScopeRequest,
    callback: (response: CreateScopeResponse) => void
  ): Promise<void>;
  searchScope(request: ScopedQuery): Promise<CodeSearchResult>;
  listScopes(request: ListScopesRequest): Promise<ListScopesResponse>;
  getScope(request: GetScopeRequest): Promise<Scope>;
}

export class AppClient extends GRPCClient {
  protected app: ApplicationServiceClient;

  constructor(protected cfg: BzlConfiguration, onError: (err: grpc.ServiceError) => void) {
    super(onError);

    this.app = new cfg.bzpb.build.stack.bezel.v1beta1.ApplicationService(
      cfg.address.authority,
      cfg.creds
    );
  }

  async httpURL(): Promise<string> {
    const address = this.cfg.address.authority;
    const scheme = address.endsWith(':443') ? 'https' : 'http';
    return `${scheme}://${address}`;
  }

  async getMetadata(waitForReady = false, deadlineSeconds = 3): Promise<Metadata> {
    return new Promise<Metadata>((resolve, reject) => {
      this.app.GetMetadata(
        {},
        new grpc.Metadata({ waitForReady: waitForReady }),
        { deadline: this.getDeadline(deadlineSeconds) },
        (err?: grpc.ServiceError, resp?: Metadata) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  async restart(): Promise<ShutdownResponse> {
    return this.shutdown(true);
  }

  async shutdown(restart: boolean = false): Promise<ShutdownResponse> {
    return new Promise<ShutdownResponse>((resolve, reject) => {
      this.app.Shutdown(
        { restart: restart },
        new grpc.Metadata(),
        { deadline: this.getDeadline() },
        (err?: grpc.ServiceError, resp?: ShutdownResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  close() {
    this.app.close();
  }

  dispose() {
    super.dispose();

    this.close();
  }
}

class BzlServerClient extends AppClient {
  protected externals: ExternalWorkspaceServiceClient;
  protected workspaces: WorkspaceServiceClient;
  protected infos: InfoServiceClient;
  protected packages: PackageServiceClient;
  protected files: FileServiceClient;
  public commands: CommandServiceClient;

  constructor(cfg: BzlConfiguration, onError: (err: grpc.ServiceError) => void) {
    super(cfg, onError);

    const address = cfg.address.authority;
    const creds = cfg.creds;
    const v1beta1 = cfg.bzpb.build.stack.bezel.v1beta1;

    this.externals = new v1beta1.ExternalWorkspaceService(address, creds);
    this.workspaces = new v1beta1.WorkspaceService(address, creds);
    this.infos = new v1beta1.InfoService(address, creds);
    this.packages = new v1beta1.PackageService(address, creds);
    this.commands = new v1beta1.CommandService(address, creds);
    this.files = new v1beta1.FileService(address, creds);
  }

  async getInfo(ws: Workspace): Promise<Info[] | undefined> {
    return new Promise<Info[]>((resolve, reject) => {
      this.infos.Get(
        { workspace: ws },
        new grpc.Metadata(),
        { deadline: this.getDeadline() },
        async (err?: grpc.ServiceError, resp?: InfoResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp?.info!);
          }
        }
      );
    });
  }

  async cancelCommand(
    request: CancelRequest,
    md: grpc.Metadata = new grpc.Metadata()
  ): Promise<CancelResponse> {
    return new Promise((resolve, reject) => {
      this.commands.Cancel(
        request,
        md,
        (err: grpc.ServiceError | undefined, response: CancelResponse | undefined) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(response!);
          }
        }
      );
    });
  }

  async getWorkspace(cwd: string): Promise<Workspace> {
    return new Promise<Workspace>((resolve, reject) => {
      this.workspaces.Get(
        {
          cwd: cwd,
        },
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: Workspace) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  async listWorkspaces(refresh: boolean = false): Promise<Workspace[]> {
    return new Promise<Workspace[]>((resolve, reject) => {
      this.workspaces.List(
        {
          refresh: refresh,
        },
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: ListWorkspacesResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!.workspace!);
          }
        }
      );
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
            resolve(resp!.workspace!);
          }
        }
      );
    });
  }

  async listPackages(workspace: Workspace, external?: ExternalWorkspace): Promise<Workspace[]> {
    return new Promise<Workspace[]>((resolve, reject) => {
      this.packages.ListPackages(
        {
          workspace: workspace,
          externalWorkspace: external,
        },
        new grpc.Metadata(),
        { deadline: this.getDeadline() },
        async (err?: grpc.ServiceError, resp?: ListPackagesResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!.package!);
          }
        }
      );
    });
  }

  async listRules(
    workspace: Workspace,
    external?: ExternalWorkspace,
    pkg?: Package
  ): Promise<LabelKind[]> {
    return new Promise<LabelKind[]>((resolve, reject) => {
      this.packages.ListRules(
        {
          workspace: workspace,
          externalWorkspace: external,
          package: pkg,
        },
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: ListRulesResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!.rule!);
          }
        }
      );
    });
  }

  async downloadFile(
    workspace: Workspace,
    kind: FileKind,
    uri: string
  ): Promise<FileDownloadResponse> {
    return new Promise<FileDownloadResponse>((resolve, reject) => {
      this.files.Download(
        {
          label: uri,
          kind: kind,
          workspace: workspace,
        },
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: FileDownloadResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  close() {
    super.close();

    this.externals.close();
    this.workspaces.close();
    this.infos.close();
    this.packages.close();
    this.commands.close();
    this.files.close();
  }
}

export class BzlAPIClient extends BzlServerClient implements BzlCodesearch {
  private codesearch: CodeSearchClient;
  public scopes: ScopesClient; // server-streaming

  constructor(cfg: BzlConfiguration, onError: (err: grpc.ServiceError) => void) {
    super(cfg, onError);

    const address = cfg.address.authority;
    const creds = cfg.creds;
    const v1beta1 = cfg.cspb.build.stack.codesearch.v1beta1;

    this.scopes = new v1beta1.Scopes(address, creds);
    this.codesearch = new v1beta1.CodeSearch(address, creds);
  }

  async searchScope(request: ScopedQuery): Promise<CodeSearchResult> {
    return new Promise<CodeSearchResult>((resolve, reject) => {
      this.codesearch.Search(
        request,
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: CodeSearchResult) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  async createScope(
    request: CreateScopeRequest,
    callback: (response: CreateScopeResponse) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this.scopes.Create(request, new grpc.Metadata());
      stream.on('data', (response: CreateScopeResponse) => {
        callback(response);
      });
      stream.on('metadata', (md: grpc.Metadata) => {});
      stream.on('error', (err: Error) => {
        reject(err.message);
      });
      stream.on('end', () => {
        resolve();
      });
    });
  }

  async getScope(request: GetScopeRequest): Promise<Scope> {
    return new Promise<Scope>((resolve, reject) => {
      this.scopes.Get(
        request,
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: Scope) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  async listScopes(request: ListScopesRequest): Promise<ListScopesResponse> {
    return new Promise<ListScopesResponse>((resolve, reject) => {
      this.scopes.List(
        request,
        new grpc.Metadata(),
        async (err?: grpc.ServiceError, resp?: ListScopesResponse) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            resolve(resp!);
          }
        }
      );
    });
  }

  close() {
    super.close();

    this.scopes.close();
    this.codesearch.close();
  }
}

export class Bzl extends LaunchableComponent<BzlConfiguration> {
  public client: BzlAPIClient | undefined;
  public ws: Workspace;
  public readonly bepRunner: BEPRunner;

  private info: BazelInfo | undefined;

  constructor(
    settings: BzlSettings,
    private subscription: Subscription,
    private bazelSettings: Settings<BazelConfiguration>,
    invocationSettings: Settings<InvocationsConfiguration>,
    cwd: string
  ) {
    super('BZL', settings, CommandName.LaunchBzlServer, 'bzl');

    this.ws = { cwd };

    this.bepRunner = new BEPRunner(this, invocationSettings);
    this.disposables.push(this.bepRunner);

    subscription.onDidChangeStatus(this.handleSubscriptionStatusChange, this, this.disposables);

    this.disposables.push(
      vscode.commands.registerCommand(CommandName.UiLabel, this.handleCommandUILabel, this)
    );
  }

  protected async handleSubscriptionStatusChange(status: Status) {
    this.restart();
  }

  public async getWorkspace(): Promise<Workspace> {
    // if outputbase is set, we've already merged it from the BazelInfo.
    if (this.ws.outputBase) {
      return this.ws;
    }
    if (!this.client) {
      return this.ws;
    }

    this.ws = await this.client.getWorkspace(this.ws.cwd!);

    const bazel = await this.bazelSettings.get();
    this.ws.bazelBinary = bazel.executable;

    return this.ws;
  }

  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();
    const args = [cfg.executable]
      .concat(cfg.command)
      .map(a => a.replace('${address}', cfg.address.authority));
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
    if (this.subscription.status !== Status.READY) {
      throw new Error('Subscription not ready');
    }

    const cfg = await this.settings.get();

    return new Promise((resolve, reject) => {
      this.client = new BzlAPIClient(cfg, err => reject(err));
      this.client.getMetadata().then(() => resolve(), reject);
    });
  }

  // private handleGrpcError(err: grpc.ServiceError) {
  //   if (this.status !== Status.READY) {
  //     return;
  //   }
  //   switch (err.code) {
  //     case grpc.status.UNAVAILABLE:
  //       this.restart();
  //       break;
  //   }
  // }

  async stopInternal(): Promise<void> {
    this.client?.close();
    return super.stopInternal();
  }

  async runWithEvents(args: string[]): Promise<void> {
    const ws = await this.getWorkspace();

    return this.bepRunner!.run({
      arg: args.concat(['--color=yes']),
      workspace: ws,
    }).catch(err => {
      if (err instanceof Error) {
        vscode.window.showInformationMessage(`failed to "${args.join(' ')}": ${err.message}`);
      }
    });
  }

  async handleCommandUILabel(label: string): Promise<void> {
    const ws = await this.getWorkspace();
    const cfg = await this.settings.get();

    const rel = uiUrlForLabel(ws.id!, label);
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${cfg.address.authority}/${rel}`)
    );
  }

  public async getBazelInfo(): Promise<BazelInfo | undefined> {
    if (this.info) {
      return this.info;
    }
    if (!this.client) {
      return;
    }
    const cfg = await this.settings.get();
    if (!cfg.enabled) {
      return;
    }

    const infoList = (await this.client.getInfo(this.ws)) || [];
    const info = infoMap(infoList);

    this.info = {
      error: '',
      bazelBin: info.get('bazel-bin')?.value!,
      bazelTestlogs: info.get('bazel-testlogs')?.value!,
      executionRoot: info.get('execution_root')?.value!,
      outputBase: info.get('output_base')?.value!,
      outputPath: info.get('output_path')?.value!,
      release: info.get('release')?.value!,
      serverPid: parseInt(info.get('server_pid')?.value!),
      workspace: info.get('workspace')?.value!,
      workspaceName: '',
      items: infoList,
    };

    return this.info;
  }
}

/**
 * More strongly typed representation of bazel info.
 */
export interface BazelInfo {
  workspaceName: string;
  workspace: string;
  serverPid: number;
  executionRoot: string;
  outputBase: string;
  outputPath: string;
  bazelBin: string;
  bazelTestlogs: string;
  release: string;
  error: string;
  items: Info[];
}

function infoMap(infoList: Info[]): Map<string, Info> {
  const m = new Map<string, Info>();
  for (const info of infoList) {
    m.set(info.key!, info);
  }
  return m;
}

function isGrpcError(e: any): e is grpc.ServiceError {
  return 'code' in e && 'message' in e;
}
