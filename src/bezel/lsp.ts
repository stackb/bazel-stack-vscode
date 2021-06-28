import path = require('path');
import * as vscode from 'vscode';
import { raceTimeout } from 'vscode-common/out/async';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  ResponseError,
} from 'vscode-languageclient/node';
import {
  TextDocumentPositionParams,
  Location,
  InitializeError,
} from 'vscode-languageserver-protocol';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';

/**
 * Client implementation to the Bezel Language Server.
 */
export class BezelLSPClient implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];
  private client: LanguageClient;
  // workspaceID is obtained from output_base
  private workspaceID: string = '';

  public info: BazelInfoResponse | undefined;
  public ws: Workspace | undefined;

  constructor(executable: string, command: string[], title = 'Bezel Language Server') {
    let serverOptions: ServerOptions = {
      command: executable,
      args: command,
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
      initializationFailedHandler: error => this.handleInitializationError(error),
    };

    const forceDebug = true;

    // Create the language client and start the client.
    this.client = new LanguageClient('starlark', title, serverOptions, clientOptions, forceDebug);
    this.client.onDidChangeState(e => {
      console.log(
        `language client changed from ${e.oldState.toString()} => ${e.newState.toString()}`
      );
    });
  }

  private handleInitializationError(error: ResponseError<InitializeError> | Error | any): boolean {
    vscode.window.showErrorMessage(
      `could not initialize starlark LSP client: ${JSON.stringify(error)}`
    );
    return false;
  }

  public start() {
    this.disposables.push(this.client.start());
  }

  public async onReady(): Promise<void> {
    return this.client.onReady();
  }

  public getWorkspaceID(): string {
    return this.workspaceID;
  }

  public getLanguageClientForTesting(): LanguageClient {
    return this.client;
  }

  public async getLabelAtDocumentPosition(
    uri: vscode.Uri,
    position: vscode.Position
  ): Promise<string> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: TextDocumentPositionParams = {
      textDocument: { uri: uri.toString() },
      position: position,
    };
    const result: Location | undefined = await this.client.sendRequest(
      'buildFile/rulelabel',
      request,
      cancellation.token
    );
    if (!result) {
      throw new Error(`no label could be located at ${JSON.stringify(request)}`);
    }
    return result.uri;
  }

  public async getLabelKindsInDocument(uri: vscode.Uri): Promise<LabelKindRange[] | undefined> {
    const cancellation = new vscode.CancellationTokenSource();

    return raceTimeout(
      this.client
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

  public async bazelInfo(workspaceDirectory: string, keys?: string[]): Promise<BazelInfoResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelInfoParams = {
      workspaceDirectory: workspaceDirectory,
      keys: keys || [],
    };
    const info = (this.info = await this.client.sendRequest<BazelInfoResponse>(
      'bazel/info',
      request,
      cancellation.token
    ));
    this.workspaceID = path.basename(info.outputBase);

    this.ws = { cwd: info.workspace, outputBase: info.outputBase };
    return info;
  }

  public async bazelKill(pid: number): Promise<BazelKillResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelKillParams = {
      pid,
    };
    return this.client.sendRequest<BazelKillResponse>('bazel/kill', request, cancellation.token);
  }

  public async recentInvocations(): Promise<Invocation[]> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: RecentInvocationsParams = {
      workspaceDirectory: this.ws?.cwd!,
    };
    return this.client.sendRequest<Invocation[]>('bazel/recentInvocations', request, cancellation.token);
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
  workspaceDirectory: string;
  keys: string[];
}

export interface BazelInfoResponse {
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