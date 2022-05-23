import * as vscode from 'vscode';
import { raceTimeout } from 'vscode-common/out/async';
import {
  LanguageClient,
  LanguageClientOptions,
  Location,
  ServerOptions,
  State,
  StateChangeEvent,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
} from 'vscode-languageclient/node';
import { BuiltInCommands } from '../constants';
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
      vscode.commands.registerCommand(CommandName.CopyLabel, this.handleCommandCopyLabel, this),
      vscode.commands.registerCommand(CommandName.GoToLabel, this.handleCommandGoToLabel, this),
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
    // console.log('lsp StateChangeEvent new =>', e.newState);
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

  private async handleCommandGoToLabel(): Promise<void | undefined> {
    const label = await vscode.window.showInputBox({
      prompt: 'Enter bazel label to locate',
      placeHolder: '//path/to:target',
    });
    if (!label) {
      return;
    }
    return this.goToLabel(label);
  }

  private async goToLabel(label: string): Promise<void | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    if (!editor.document.uri) {
      return;
    }
    try {
      const location = await this.getLabelLocation(editor.document.uri, label);
      if (!location || !location.uri || !location.range) {
        return;
      }

      return vscode.commands.executeCommand(
        BuiltInCommands.Open,
        vscode.Uri.parse(location.uri).with({
          // location response is zero-based; convert to 1-base
          fragment: `${location.range.start.line + 1},${location.range.start.character + 1}`,
        })
      );
    } catch (e) {
      if (e instanceof Error) {
        console.debug(e.message);
      } else {
        console.debug(JSON.stringify(e));
      }
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

  // getLabelLocation returns the location of the given label.  The URI is used
  // to resolve non-canonical forms.
  public async getLabelLocation(
    uri: vscode.Uri,
    label: string,
    cancellation = new vscode.CancellationTokenSource()
  ): Promise<Location | undefined> {
    if (!this.languageClient) {
      return undefined;
    }
    const params: BuildFileLabelLocationParams = {
      textDocument: { uri: uri.toString() },
      label: label,
    };
    const location: Location | undefined = await this.languageClient.sendRequest(
      'buildFile/labelLocation',
      params,
      cancellation.token
    );
    return location;
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

export interface BuildFileLabelLocationParams {
  textDocument: TextDocumentIdentifier;
  label: string;
}

function createLanguageClient(cfg: LanguageServerConfiguration): LanguageClient {
  let serverOptions: ServerOptions = {
    command: cfg.executable,
    args: cfg.command,
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'starlark' },
      { scheme: 'file', language: 'bazel' },
    ],
    synchronize: {
      // Notify the server about file changes to BUILD files contained in the
      // workspace
      fileEvents: vscode.workspace.createFileSystemWatcher('**/BUILD.bazel'),
    },
    progressOnInitialization: true,
    initializationOptions: {
      // whether to use codelenses at all
      enableCodelenses: cfg.enableCodelenses,
      // enable copy
      enableCodelensCopyLabel: cfg.enableCodelensCopyLabel,
      // enable codesearch codelenses
      enableCodelensCodesearch: cfg.enableCodelensCodesearch,
      // enable enable UI codelenses
      enableCodelensBrowse: cfg.enableCodelensBrowse,
      // enable enable debug codelenses
      enableCodelensStarlarkDebug: cfg.enableCodelensStarlarkDebug,
      // enable run codelens
      enableCodelensBuild: cfg.enableCodelensBuild,
      // enable run codelens
      enableCodelensTest: cfg.enableCodelensTest,
      // enable run codelens
      enableCodelensRun: cfg.enableCodelensRun,
    },
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
