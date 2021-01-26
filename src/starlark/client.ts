import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node';
import {
  TextDocumentPositionParams,
  Location,
} from 'vscode-languageserver-protocol';

/**
 * Client implementation to the Starlark Language Server.
 */
export class StardocLSPClient implements vscode.Disposable {

  private disposables: vscode.Disposable[] = [];
  private client: LanguageClient;

  constructor(executable: string, command: string[], title = 'Starlark Language Server') {
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
      }
    };

    // Create the language client and start the client.
    this.client = new LanguageClient(
      'starlark',
      title,
      serverOptions,
      clientOptions
    );
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

  public dispose() {
    if (this.client) {
      this.client.stop();
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

}
