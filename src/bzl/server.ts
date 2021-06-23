import * as vscode from 'vscode';
import * as vlc from 'vscode-languageclient/node';
import { Server } from './constants';

/**
 * Manager of the Bzl Server Process.  Implements vscode.OutputChannel to
 * intercept the process output which is needed to detect the failure condition
 * by string matching.  This is suboptimal, but the LanguageClient does not seem
 * to provide a way to inspect the exit code from a failing child process.
 */
export class BzlServer implements vscode.Disposable, vscode.OutputChannel {
  /**
   * The human-readable name of this output channel.
   * @override
   */
  readonly name: string = 'Bzl Server';

  // List of disposables.
  private disposables: vscode.Disposable[] = [];
  // LanguageClient.  This does the child process management.
  private client: vlc.LanguageClient;
  // Number of times the server has been restarted
  private restarts: number = 0;
  // the backing output channel
  private output: vscode.OutputChannel;
  // a string buffer that holds output content while the server is failing.
  private lastOutputBuffer = '';

  constructor(
    private onDidServerDoNotRestart: vscode.EventEmitter<string>,
    executable: string,
    command: string[]
  ) {
    this.output = vscode.window.createOutputChannel(this.name);
    this.disposables.push(this.output);

    let serverOptions: vlc.ServerOptions = {
      command: executable,
      args: command,
    };

    let clientOptions: vlc.LanguageClientOptions = {
      // Register the server for all documents to always keep it running
      documentSelector: [{ pattern: '**/*' }],
      errorHandler: this,
      outputChannel: this,
    };

    this.client = new vlc.LanguageClient(
      Server.BinaryName,
      Server.Description,
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

  /**
   * An error has occurred while writing or reading from the connection.
   * @override
   *
   * @param error - the error received
   * @param message - the message to be delivered to the server if know.
   * @param count - a count indicating how often an error is received. Will
   *  be reset if a message got successfully send or received.
   */
  error(error: Error, message: vlc.Message, count: number): vlc.ErrorAction {
    // NOTE: for some reason the 'error' method is not being called.
    console.log(`vlc error: ${error.message} (count=${count})`, error, message);
    if (count < 5) {
      return vlc.ErrorAction.Continue;
    }
    return vlc.ErrorAction.Shutdown;
  }

  /**
   * Callback when the connection to the server got closed.
   * @override
   */
  closed(): vlc.CloseAction {
    if (this.restarts++ < 3) {
      this.lastOutputBuffer = '';
      return vlc.CloseAction.Restart;
    }
    this.onDidServerDoNotRestart.fire(this.lastOutputBuffer.replace('\n', ''));
    return vlc.CloseAction.DoNotRestart;
  }

  /**
   * @override
   */
  public dispose() {
    if (this.client) {
      this.client.stop();
    }
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

  /**
   * Append the given value to the channel.
   *
   * @param value A string, falsy values will not be printed.
   * @override
   */
  append(value: string): void {
    if (this.restarts) {
      this.lastOutputBuffer += value;
    }
    this.output.append(value);
  }

  /**
   * Append the given value and a line feed character
   * to the channel.
   *
   * @param value A string, falsy values will be printed.
   * @override
   */
  appendLine(value: string): void {
    this.output.appendLine(value);
  }

  /**
   * Removes all output from the channel.
   * @override
   */
  clear(): void {
    this.output.clear();
  }

  show(columnOrPreserveFocus?: vscode.ViewColumn | boolean, preserveFocus?: boolean): void {
    this.output.show(preserveFocus);
  }

  /**
   * Hide this channel from the UI.
   * @override
   */
  hide(): void {
    this.output.hide();
  }

  public getLanguageClientForTesting(): vlc.LanguageClient {
    return this.client;
  }
}
