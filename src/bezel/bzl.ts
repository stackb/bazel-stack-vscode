import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { Barrier, raceTimeout } from 'vscode-common/out/async';
import { LanguageClient, LanguageClientOptions, Location, ServerOptions, State, StateChangeEvent, TextDocumentPositionParams } from 'vscode-languageclient/node';
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
import { ShutdownResponse } from '../proto/build/stack/bezel/v1beta1/ShutdownResponse';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { CodeSearchClient } from '../proto/build/stack/codesearch/v1beta1/CodeSearch';
import { CreateScopeRequest } from '../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse } from '../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { GetScopeRequest } from '../proto/build/stack/codesearch/v1beta1/GetScopeRequest';
import { ListScopesRequest } from '../proto/build/stack/codesearch/v1beta1/ListScopesRequest';
import { ListScopesResponse } from '../proto/build/stack/codesearch/v1beta1/ListScopesResponse';
import { Scope } from '../proto/build/stack/codesearch/v1beta1/Scope';
import { ScopedQuery } from '../proto/build/stack/codesearch/v1beta1/ScopedQuery';
import { ScopesClient } from '../proto/build/stack/codesearch/v1beta1/Scopes';
import { CodeSearchResult } from '../proto/livegrep/CodeSearchResult';
import { GRPCClient } from './grpcclient';
import { InfoServiceClient } from '../proto/build/stack/bezel/v1beta1/InfoService';
import { Info } from '../proto/build/stack/bezel/v1beta1/Info';
import { InfoResponse } from '../proto/build/stack/bezel/v1beta1/InfoResponse';
import { loadBzlProtos, loadCodesearchProtos } from './proto';
import { Container } from '../container';
import { BezelConfiguration } from './configuration';
import { timeStamp } from 'console';

export interface BzlCodesearch {
  createScope(
    request: CreateScopeRequest,
    callback: (response: CreateScopeResponse) => void
  ): Promise<void>;
  searchScope(request: ScopedQuery): Promise<CodeSearchResult>;
  listScopes(request: ListScopesRequest): Promise<ListScopesResponse>;
  getScope(request: GetScopeRequest): Promise<Scope>;
}

export class BzlClient implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  public readonly ws: Workspace;
  private _isRunning: Barrier = new Barrier();
  private readonly _lsp: BzlLanguageClient;
  private _api: BzlServerClient | undefined;
  constructor(cwd: string, cfg: BezelConfiguration) {

    this.ws = { 
      cwd: cwd,
      outputBase: undefined // needs to be filled in later as codesearch depends on this
    };

    let command = cfg.bzl.command;
    if (cfg.account.token) {
      command.push('--address=' + cfg.bzl.address);
      if (cfg.remoteCache.address) {
        command.push('--remote_cache=' + cfg.remoteCache.address);
      }
      if (cfg.remoteCache.maxSizeGb) {
        command.push('--remote_cache_size_gb=' + cfg.remoteCache.maxSizeGb);
      }
      if (cfg.remoteCache.dir) {
        command.push('--remote_cache_dir=' + cfg.remoteCache.dir);
      }
    }

    const lspClient = this._lsp = new BzlLanguageClient(this.ws, cfg.bzl.executable, command, cfg.bzl.address, this.disposables);

    this.disposables.push(lspClient.languageClient.onDidChangeState(e => {
      console.log(
        `language client changed from ${e.oldState.toString()} => ${e.newState.toString()}`
      );
      if (e.newState === State.Running) {
        if (this._api) {
          this._api.dispose();
        }
        this._api = new BzlServerClient(this.ws, cfg.bzl.address);
        this._isRunning.open();
      }
    }));
  
  }

  public get lang(): BzlLanguageClient {
    return this._lsp;
  }

  public get api(): BzlServerClient {
    if (!this._api) {
      throw new TypeError('api client is not available yet');
    }
    return this._api;
  }

  async start(): Promise<void> {
    await this.lang.start();
    const isRunning = await this._isRunning.wait();
    if (!isRunning) {
      throw new Error('bzl api did not become ready');
    }
    await this.api.start();
  }

  async stop(): Promise<void> {
    if (this._api) {
      await this._api.stop();
    }
    return this.lang.stop();
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}

class BzlLanguageClient {
  readonly languageClient: LanguageClient;

  private info: BazelInfo | undefined;

  constructor(
    private readonly ws: Workspace,
    public readonly executable: string,
    public readonly command: string[],
    public readonly address: string,
    disposables: vscode.Disposable[],
  ) {
    this.languageClient = this.createLanguageClient();
  }

  private createLanguageClient(): LanguageClient {
    let serverOptions: ServerOptions = {
      command: this.executable,
      args: this.command,
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      // Register the server for plain text documents
      documentSelector: [
        { scheme: 'file', language: 'starlark' },
        { scheme: 'file', language: 'bazel' },
      ],
      synchronize: {
        // Notify the server about file changes to BUILD files contained in the
        // workspace
        fileEvents: vscode.workspace.createFileSystemWatcher('**/BUILD.bazel'),
      },
      // initializationFailedHandler: error => this.handleInitializationError(error),
    };

    const forceDebug = true;

    return new LanguageClient('starlark', 'Bzl Server', serverOptions, clientOptions, forceDebug);
  }

  public async getLabelAtDocumentPosition(
    uri: vscode.Uri,
    position: vscode.Position,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<string> {
    const request: TextDocumentPositionParams = {
      textDocument: { uri: uri.toString() },
      position: position,
    };
    const result: Location | undefined = await this.languageClient.sendRequest(
      'buildFile/rulelabel',
      request,
      cancellation.token
    );
    if (!result) {
      throw new Error(`no label could be located at ${JSON.stringify(request)}`);
    }
    return result.uri;
  }

  public async getLabelKindsInDocument(uri: vscode.Uri, cancellation = new vscode.CancellationTokenSource()): Promise<LabelKindRange[] | undefined> {

    return raceTimeout(
      this.languageClient
        .sendRequest<LabelKindRange[]>(
          'buildFile/labelKinds',
          { textDocument: { uri: uri.toString() } },
          cancellation.token
        )
      ,
      10000,
      () => {
        vscode.window.showWarningMessage(`codelens failed to get response in 5s: ${uri.fsPath}`);
        cancellation.cancel();
      }
    );
  }

  public async bazelInfo(keys: string[] = [], workspaceDirectory: string = this.ws.cwd!, cancellation = new vscode.CancellationTokenSource(), force = false): Promise<BazelInfo> {
    if (this.info && !force) {
      return this.info;
    }

    const request: BazelInfoParams = { workspaceDirectory, keys };

    return this.languageClient.sendRequest<BazelInfo>(
      'bazel/info',
      request,
      cancellation.token
    ).then(info => {
      this.info = info;
      this.ws.outputBase = info.outputBase;
      this.ws.pid = info.serverPid;
      return info;
    });
  }

  public async bazelKill(pid: number, cancellation = new vscode.CancellationTokenSource()): Promise<BazelKillResponse> {
    const request: BazelKillParams = {
      pid,
    };
    return this.languageClient.sendRequest<BazelKillResponse>('bazel/kill', request, cancellation.token);
  }

  public async recentInvocations(workspaceDirectory: string = this.ws.cwd!, cancellation = new vscode.CancellationTokenSource()): Promise<Invocation[]> {
    const request: RecentInvocationsParams = { workspaceDirectory };
    return this.languageClient.sendRequest<Invocation[]>('bazel/recentInvocations', request, cancellation.token);
  }

  // ===========================================================
  // lifecycle methods
  // ===========================================================

  public async start(): Promise<vscode.Disposable | void> {
    const d = this.languageClient.start();
    await this.languageClient.onReady();
    return d;
  }

  /**
   * Stop/close all internal clients and dispose.
   * @returns 
   */
  public async stop(): Promise<void> {
    return this.languageClient.stop();
  }

}

class BzlServerClient extends GRPCClient implements BzlCodesearch {

  private readonly app: ApplicationServiceClient;
  private readonly externals: ExternalWorkspaceServiceClient;
  private readonly workspaces: WorkspaceServiceClient;
  private readonly infos: InfoServiceClient;
  private readonly packages: PackageServiceClient;
  private readonly history: HistoryClient;
  private readonly files: FileServiceClient;
  private readonly codesearch: CodeSearchClient;
  public readonly scopes: ScopesClient; // server-streaming
  public readonly commands: CommandServiceClient; // server-streaming

  public metadata: Metadata | undefined;
  public isRemoteClient: boolean = false;

  constructor(
    private readonly ws: Workspace,
    public readonly address: string,
  ) {
    super(address);

    try {
      const bzlProto = loadBzlProtos(Container.protofile('bzl.proto').fsPath);
      const codesearchProto = loadCodesearchProtos(Container.protofile('codesearch.proto').fsPath);
  
      const v1beta1 = bzlProto.build.stack.bezel.v1beta1;
      const creds = this.getCredentials(address);
      this.app = this.add(
        new v1beta1.ApplicationService(address, creds, {
          'grpc.initial_reconnect_backoff_ms': 200,
        })
      );
      this.externals = this.add(new v1beta1.ExternalWorkspaceService(address, creds));
      this.workspaces = this.add(new v1beta1.WorkspaceService(address, creds));
      this.infos = this.add(new v1beta1.InfoService(address, creds));
      this.packages = this.add(new v1beta1.PackageService(address, creds));
      this.commands = this.add(new v1beta1.CommandService(address, creds));
      this.history = this.add(new v1beta1.History(address, creds));
      this.files = this.add(new v1beta1.FileService(address, creds));
      this.scopes = this.add(
        new codesearchProto.build.stack.codesearch.v1beta1.Scopes(address, creds)
      );
      this.codesearch = this.add(
        new codesearchProto.build.stack.codesearch.v1beta1.CodeSearch(address, creds)
      );  
    } catch (e) {
      vscode.window.showInformationMessage(`error: ${e}`);
      throw e;
    }
  }

  httpURL(): string {
    const address = this.address;
    const scheme = address.endsWith(':443') ? 'https' : 'http';
    return `${scheme}://${address}`;
  }

  async waitForReady(seconds: number = 10): Promise<Metadata | undefined> {
    return this.getMetadata(true, seconds);
  }

  async getMetadata(waitForReady = false, deadlineSeconds = 30): Promise<Metadata> {
    return new Promise<Metadata>((resolve, reject) => {
      this.app.GetMetadata(
        {},
        new grpc.Metadata({ waitForReady: waitForReady }),
        { deadline: this.getDeadline(deadlineSeconds) },
        (err?: grpc.ServiceError, resp?: Metadata) => {
          if (err) {
            reject(this.handleError(err));
          } else {
            this.metadata = resp;
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

  async getInfo(): Promise<Info[] | undefined> {
    return new Promise<Info[]>((resolve, reject) => {
      this.infos.Get(
        { workspace: this.ws },
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
            resolve(resp!.history!);
          }
        }
      );
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
            resolve(resp!);
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
      this.commands.cancel(
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
      stream.on('metadata', (md: grpc.Metadata) => { });
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

  // ===========================================================
  // lifecycle methods
  // ===========================================================

  public async start(): Promise<Metadata | void> {
    return this.waitForReady(5);  
  }

  /**
   * Stop/close all internal clients and dispose.
   * @returns 
   */
  public async stop(): Promise<void> {
    // this.shutdown(false); // no restart
    this.dispose();
  }

}

interface BazelInfoParams {
  workspaceDirectory: string;
  keys: string[];
}

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
}

interface BazelKillParams {
  pid: number;
}

export interface BazelKillResponse { }

export enum ErrorCode {
  // ErrInitialization signals an error occurred during initialization.
  ErrInitialization = 1,
  // ErrBazelClient signals an error occurred trying to establish the bazel client.
  ErrBazelClient,
  // ErrBazelInfo signals an error occurred trying get the bazel info.
  ErrBazelInfo,
}

export interface Label {
  Repo: string;
  Pkg: string;
  Name: string;
}

export interface LabelKindRange {
  kind: string;
  label: Label;
  range: vscode.Range;
}

export interface RecentInvocationsParams {
  workspaceDirectory: string;
}

export interface Invocation {
  invocationId: string;
  command: string;
  arguments: string[];
  success: boolean;
  status: string;
  createdAt: number;
}