import * as vscode from 'vscode';
import { raceTimeout } from 'vscode-common/out/async';
import {
  LanguageClient,
  LanguageClientOptions,
  Location,
  ServerOptions,
  State,
  StateChangeEvent,
  TextDocumentPositionParams,
} from 'vscode-languageclient/node';
import { LanguageServerConfiguration, LanguageServerSettings } from './configuration';
import { RunnableComponent, Status } from './status';


export class BzlLanguageClient extends RunnableComponent<LanguageServerConfiguration> implements vscode.Disposable {

  private languageClient: LanguageClient | undefined;

  constructor(
    public readonly workspaceDirectory: string,
    public readonly settings: LanguageServerSettings,
  ) {
    super(settings);
  }

  async start(): Promise<void> {
    if (this.status == Status.STARTING) {
      return;
    }
    this.setStatus(Status.STARTING);

    const cfg = await this.settings.get();
    this.languageClient = this.createLanguageClient(cfg);
    this.languageClient.onDidChangeState(this.handleStateChangeEvent, this, this.disposables);
    try {
      this.disposables.push(this.languageClient.start());
      await this.languageClient.onReady();  
    } catch (e) {
      this.setError(e);
    }
  }

  async stop(): Promise<void> {
    if (this.status == Status.STOPPING) {
      return;
    }
    this.setStatus(Status.STOPPING);
    try {
      await this.languageClient?.stop()
      this.languageClient = undefined;  
    } catch (e) {
      this.setError(e);
    }
  }

  private handleStateChangeEvent(e: StateChangeEvent) {
    let status = Status.UNKNOWN;
    switch (e.newState) {
      case State.Starting:
        status = Status.STARTING;
        break;
      case State.Running:
        status = Status.READY;
        break;
      case State.Stopped:
        status = Status.STOPPED;
        break;
      default:
        status = Status.UNKNOWN;
    }
    if (status !== Status.UNKNOWN) {
      this.setStatus(status);
    }
  }

  private createLanguageClient(cfg: LanguageServerConfiguration): LanguageClient {
    let serverOptions: ServerOptions = {
      command: cfg.executable,
      args: cfg.command,
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
      initializationFailedHandler: err => {
        this.setError(err instanceof Error ? err : new Error(err));
        return false;
      },
    };

    const forceDebug = false;

    return new LanguageClient('starlark', 'Bzl Server', serverOptions, clientOptions, forceDebug);
  }

  public async getLabelAtDocumentPosition(
    uri: vscode.Uri,
    position: vscode.Position,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<string | undefined> {
    if (!this.languageClient) {
      return undefined;
    }
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
    if (!this.languageClient) {
      return undefined;
    }
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
    if (!this.languageClient) {
      return {};
    }

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
    if (!this.languageClient) {
      return [];
    }

    const request: RecentInvocationsParams = { workspaceDirectory };
    return this.languageClient.sendRequest<Invocation[]>(
      'bazel/recentInvocations',
      request,
      cancellation.token
    );
  }

  dispose() {
    super.dispose();
    if (this.languageClient) {
      this.languageClient.stop();
      this.languageClient = undefined;
      this.setStatus(Status.INITIAL);
    }
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
