import * as vscode from 'vscode';
import { raceTimeout } from 'vscode-common/out/async';
import {
  LanguageClient,
  LanguageClientOptions,
  Location,
  ServerOptions,
  State,
  TextDocumentPositionParams,
} from 'vscode-languageclient/node';
import { Status } from '../constants';

export class BzlLanguageClient {
  readonly languageClient: LanguageClient;

  _onDidChangeStatus: vscode.EventEmitter<Status> = new vscode.EventEmitter<Status>();
  readonly onDidChangeStatus: vscode.Event<Status> = this._onDidChangeStatus.event;

  constructor(
    public readonly workspaceDirectory: string,
    public readonly executable: string,
    public readonly command: string[],
    disposables: vscode.Disposable[],
  ) {
    this.languageClient = this.createLanguageClient();

    disposables.push(
      this.languageClient.onDidChangeState(e => {
        let stat = Status.UNKNOWN;
        switch (e.newState) {
          case State.Starting:
            stat = Status.STARTING;
            break;
          case State.Running:
            stat = Status.RUNNING;
            break;
          case State.Stopped:
            stat = Status.STOPPED;
            break;
          default:
            stat = Status.UNKNOWN;
        }
        if (stat !== Status.UNKNOWN) {
          this._onDidChangeStatus.fire(stat);
        }
      })
    );
  }

  // private configure(config: vscode.WorkspaceConfiguration) {
  //   this._onDidChangeStatus.fire(Status.CONFIGURING);
  // }

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

  public async getLabelKindsInDocument(
    uri: vscode.Uri,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<LabelKindRange[] | undefined> {
    return raceTimeout(
      this.languageClient.sendRequest<LabelKindRange[]>(
        'buildFile/labelKinds',
        { textDocument: { uri: uri.toString() } },
        cancellation.token
      ),
      10000,
      () => {
        vscode.window.showWarningMessage(`codelens failed to get response in 5s: ${uri.fsPath}`);
        cancellation.cancel();
      }
    );
  }

  public async bazelKill(
    pid: number,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<BazelKillResponse> {
    const request: BazelKillParams = {
      pid,
    };
    return this.languageClient.sendRequest<BazelKillResponse>(
      'bazel/kill',
      request,
      cancellation.token
    );
  }

  public async recentInvocations(
    workspaceDirectory: string = this.workspaceDirectory,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<Invocation[]> {
    const request: RecentInvocationsParams = { workspaceDirectory };
    return this.languageClient.sendRequest<Invocation[]>(
      'bazel/recentInvocations',
      request,
      cancellation.token
    );
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

interface BazelKillParams {
  pid: number;
}

export interface BazelKillResponse { }

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
