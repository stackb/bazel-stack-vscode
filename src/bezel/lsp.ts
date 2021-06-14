import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  ResponseError,
  InitializeResult
} from 'vscode-languageclient/node';
import {
  TextDocumentPositionParams,
  Location,
  InitializeError,
} from 'vscode-languageserver-protocol';

/**
 * Client implementation to the Bezel Language Server.
 */
export class BezelLSPClient implements vscode.Disposable {

  private disposables: vscode.Disposable[] = [];
  private client: LanguageClient;
  public initializationError: Error | undefined;

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

  public async bazelInfo(keys?: string[]): Promise<BazelInfoResponse> {
    const cancellation = new vscode.CancellationTokenSource();
    const request: BazelInfoParams = {
      keys: keys || [],
    };
    return this.client.sendRequest<BazelInfoResponse>('bazel/info', request, cancellation.token);
  }

  public async bazelKill(pid: number): Promise<BazelKillResponse> {
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
