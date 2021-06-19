import path = require('path');
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  ResponseError,
} from 'vscode-languageclient/node';
import {
  CodeLensParams,
  TextDocumentPositionParams,
  Location,
  InitializeError,
} from 'vscode-languageserver-protocol';
import { BzlClient } from '../bzl/client';
import { loadBzlProtos, loadCodesearchProtos } from '../bzl/proto';
import { Container } from '../container';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';

/**
 * Client implementation to the Bezel Language Server.
 */
export class BezelLSPClient implements vscode.Disposable {

  // workspaceID is obtained from output_base
  private workspaceID: string = '';

  private disposables: vscode.Disposable[] = [];
  private client: LanguageClient;
  private onDidRequestRestart: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

  public initializationError: Error | undefined;
  public info: BazelInfoResponse | undefined;
  public bzlClient: BzlClient | undefined;
  public ws: Workspace | undefined;

  constructor(
    private onDidBzlClientChange: vscode.EventEmitter<BzlClient>,
    private executable: string, 
    private address: string,
    command: string[], 
    title = 'Bezel Language Server',
  ) {
    let serverOptions: ServerOptions = {
      command: executable,
      args: command.concat(['--address', address]),
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
        fileEvents: vscode.workspace.createFileSystemWatcher('**/BUILD.bazel')
      },
      initializationFailedHandler: error => this.handleInitializationError(error),
    };

    // Create the language client and start the client.
    this.client = new LanguageClient(
      'starlark',
      title,
      serverOptions,
      clientOptions
    );
  }

  private handleInitializationError(error: ResponseError<InitializeError> | Error | any): boolean {
    vscode.window.showErrorMessage(`could not initialize starlark LSP client: ${JSON.stringify(error)}`);
    this.initializationError = error;
    return false;
  }

  public start() {
    this.disposables.push(this.client.start());
  }

  public async onReady(): Promise<void> {
    return this.client.onReady();
  }

  public getAddress(): string {
    return this.address;
  }

  public getWorkspaceID(): string {
    return this.workspaceID;
  }

  public getLanguageClientForTesting(): LanguageClient {
    return this.client;
  }

  public async getLabelAtDocumentPosition(uri: vscode.Uri, position: vscode.Position): Promise<string> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: TextDocumentPositionParams = {
      textDocument: { uri: uri.toString() },
      position: position,
    };
    const result: Location | undefined = await this.client.sendRequest('buildFile/rulelabel', request, cancellation.token);
    if (!result) {
      throw new Error(`no label could be located at ${JSON.stringify(request)}`);
    }
    return result.uri;
  }

  public async getLabelKindsInDocument(uri: vscode.Uri): Promise<LabelKindRange[]> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: CodeLensParams = {
      textDocument: { uri: uri.toString() },
    };
    const result: LabelKindRange[] | undefined = await this.client.sendRequest('buildFile/labelKinds', request, cancellation.token);
    if (!result) {
      throw new Error(`no label kinds could be located at ${JSON.stringify(request)}`);
    }
    return result;
  }

  public async bazelInfo(keys?: string[]): Promise<BazelInfoResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelInfoParams = {
      keys: keys || [],
    };
    const info = this.info = await this.client.sendRequest<BazelInfoResponse>('bazel/info', request, cancellation.token);
    this.workspaceID = path.basename(info.outputBase);

    const bzlProto = loadBzlProtos(Container.protofile('bzl.proto').fsPath);
    const codesearchProto = loadCodesearchProtos(Container.protofile('codesearch.proto').fsPath);
    this.ws = { cwd: info.workspace, outputBase: info.outputBase };
    this.bzlClient = new BzlClient(this.executable, bzlProto, codesearchProto, this.address, this.onDidRequestRestart);
    this.onDidBzlClientChange.fire(this.bzlClient);
    return info;
  }

  public async bazelKill(pid: number): Promise<BazelKillResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelKillParams = {
      pid,
    };
    return this.client.sendRequest<BazelKillResponse>('bazel/kill', request, cancellation.token);
  }

  public async (pid: number): Promise<BazelKillResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelKillParams = {
      pid,
    };
    return this.client.sendRequest<BazelKillResponse>('bazel/kill', request, cancellation.token);
  }

  public dispose() {
    if (this.client) {
      this.client.stop();
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

}

interface BazelInfoParams {
  keys: string[]
}

export interface BazelInfoResponse {
  workspaceName: string
  workspace: string
  serverPid: number
  executionRoot: string
  outputBase: string
  outputPath: string
  bazelBin: string
  bazelTestlogs: string
  error: string
}

interface BazelKillParams {
  pid: number
}

export interface BazelKillResponse {
}

export enum ErrorCode {  
	// ErrInitialization signals an error occurred during initialization.
	ErrInitialization = 1,
	// ErrBazelClient signals an error occurred trying to establish the bazel client.
	ErrBazelClient,
	// ErrBazelInfo signals an error occurred trying get the bazel info.
	ErrBazelInfo,
}

export interface Label {
  Repo: string
  Pkg: string
  Name: string
}

export interface LabelKindRange {
  kind: string
  label: Label
  range: vscode.Range
}