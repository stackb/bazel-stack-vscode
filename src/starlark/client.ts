import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions
} from 'vscode-languageclient';
import { StarlarkLSPConfiguration } from "./configuration";

/**
 * A server implementation that provides modules from serialized moduleinfo files.
 */
export class StardocLSPClient implements vscode.Disposable {

  private disposables: vscode.Disposable[] = [];
  private client: LanguageClient;

  constructor(
    ctx: vscode.ExtensionContext,
    private cfg: StarlarkLSPConfiguration,
  ) {
    let serverOptions: ServerOptions = {
      command: cfg.server.executable,
      args: cfg.server.command,
      options: {
        // cwd?: string;
        // env?: any;
        // detached?: boolean;
        // shell?: boolean;
      },
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
      // Register the server for plain text documents
      documentSelector: [
        { scheme: 'file', language: 'starlark' },
        { scheme: 'file', language: 'bazel' },
      ],
      synchronize: {
        // Notify the server about file changes to '.clientrc files contained in the workspace
        fileEvents: vscode.workspace.createFileSystemWatcher('**/BUILD.bazel')
      }
    };

    // Create the language client and start the client.
    this.client = new LanguageClient(
      'starlark',
      'Starlark Language Server',
      serverOptions,
      clientOptions
    );

  }

  public start() {
    this.client.start();
  }

  public dispose() {
    if (this.client) {
      this.client.stop();
      delete (this.client);
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

}
