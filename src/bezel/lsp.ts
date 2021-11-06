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
import {
  LanguageServerConfiguration,
} from './configuration';
import { CommandName } from './constants';
import { Settings } from './settings';
import { RunnableComponent, Status } from './status';

export class BzlLanguageClient
  extends RunnableComponent<LanguageServerConfiguration>
  implements vscode.Disposable {
  private languageClient: LanguageClient | undefined;

  // disposables related to the client that must be recycled during every
  // restart
  private clientDisposables: vscode.Disposable[] = [];

  constructor(
    public readonly workspaceDirectory: string,
    public readonly settings: Settings<LanguageServerConfiguration>
  ) {
    super('LSP', settings);

    this.disposables.push(
      vscode.commands.registerCommand(CommandName.CopyLabel, this.handleCommandCopyLabel, this)
    );
  }

  async startInternal(): Promise<void> {
    const cfg = await this.settings.get();
    if (!this.languageClient) {
      this.languageClient = createLanguageClient(cfg);
      this.languageClient.onDidChangeState(
        this.handleStateChangeEvent,
        this,
        this.clientDisposables
      );
      this.clientDisposables.push(this.languageClient.start());
    }

    await this.languageClient.onReady();
  }

  async stopInternal(): Promise<void> {
    try {
      await this.languageClient?.stop();
      this.languageClient = undefined;
    } finally {
      this.disposeClient();
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

  private async handleCommandCopyLabel(doc: vscode.TextDocument): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    if (!editor.document.uri) {
      return;
    }
    const selection = editor?.selection.active;
    if (!selection) {
      return;
    }
    try {
      const label = await this.getLabelAtDocumentPosition(editor.document.uri, selection);
      if (!label) {
        return;
      }
      return vscode.commands.executeCommand(CommandName.CopyToClipboard, label);
    } catch (e) {
      if (e instanceof Error) {
        console.debug(e.message);
      } else {
        console.debug(JSON.stringify(e));
      }
    }
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

  disposeClient() {
    this.clientDisposables.forEach(d => d.dispose());
    this.clientDisposables.length = 0;
  }

  dispose() {
    super.dispose();
    this.disposeClient();
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

function createLanguageClient(cfg: LanguageServerConfiguration): LanguageClient {
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
    initializationOptions: {
      starlarkServer: {

        sha256: '8492c5f1cd49c85499609be273859619b0faf8a3d3898bf14f0c4ebb5f681f26',
        javaHome: '/private/var/tmp/_bazel_paul.johnston/install/97cf8d40e3de7fca7ef885fa763bde13/embedded_tools/jdk',
        url: 'http://localhost:4343/bazel-bin/src/main/java/com/google/devtools/build/skydoc/server_deploy.jar'
      },
    },
    synchronize: {
      // Notify the server about file changes to BUILD files contained in the
      // workspace
      fileEvents: vscode.workspace.createFileSystemWatcher('**/BUILD.bazel'),
    },
    // initializationFailedHandler: err => {
    //   this.setError(err instanceof Error ? err : new Error(err));
    //   return false;
    // },
  };

  const forceDebug = false;

  return new LanguageClient(
    'starlark',
    'Starlark Language Server',
    serverOptions,
    clientOptions,
    forceDebug
  );
}
