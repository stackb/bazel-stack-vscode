import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { API } from '../api';
import { Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { BEPRunner } from './bepRunner';
import { BazelCodelensProvider } from './codelens';
import {
  AccountSettings,
  BazelSettings,
  BuildEventServiceSettings,
  BzlSettings,
  CodeLensSettings as CodelensSettings,
  CodeSearchSettings,
  LanguageServerSettings,
  RemoteCacheSettings,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName, Memento, ViewName } from './constants';
import { BuildEventProtocolView } from './invocationView';
import { uiUrlForLabel } from './ui';
import { UriHandler } from './urihandler';
import { BezelWorkspaceView } from './workspaceView';
import { BazelBuildEvent } from './bepHandler';
import { CodesearchPanel } from './codesearch/panel';
import { CodeSearch } from './codesearch';
import { BzlLanguageClient } from './lsp';
import { Buildifier } from '../buildifier/buildifier';
import { BuildifierSettings } from '../buildifier/settings';
import { RemoteCache } from './remote_cache';
import { Account } from './account';
import { BuildEventService } from './bes';
import { BazelServer } from './bazel';
import { StarlarkDebugger } from './debugger';

/**
 * Fallback version of bazel executable if none defined.
 */
const defaultBazelExecutable = 'bazel';

export const BzlFeatureName = 'bsv.bzl';

/**
 * BzlFeature handles configuration of all views and commands related to Bzl/Bazel.  
 */
export class BzlFeature implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  private onDidReceiveBazelBuildEvent: vscode.EventEmitter<BazelBuildEvent> =
    new vscode.EventEmitter();

  private readonly workspaceDirectory: string;

  private bzlSettings: BzlSettings;
  private bazelSettings: BazelSettings;
  private codelensSettings: CodelensSettings;

  private bazelTerminal: vscode.Terminal | undefined;
  private codesearchPanel: CodesearchPanel | undefined;
  private debugCLITerminal: vscode.Terminal | undefined;
  private bepRunner: BEPRunner | undefined;

  constructor(private api: API, ctx: vscode.ExtensionContext) {

    if (!vscode.workspace.workspaceFolders) {
      throw new Error('Bzl requires that a vscode workspace folder is present.');
    }
    this.workspaceDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;

    const bazelSettings = this.bazelSettings = this.addDisposable(
      new BazelSettings(BzlFeatureName + '.bazel'));

    const bzlSettings = this.bzlSettings = this.addDisposable(
      new BzlSettings(ctx, this.workspaceDirectory, this.bazelSettings, BzlFeatureName + '.server'));

    const accountSettings = this.addDisposable(
      new AccountSettings(ctx, BzlFeatureName + '.account'));

    const codelensSettings = this.codelensSettings = this.addDisposable(
      new CodelensSettings(accountSettings, BzlFeatureName + '.codelens'));

    const remoteCacheSettings = this.addDisposable(
      new RemoteCacheSettings(this.bzlSettings, BzlFeatureName + '.remoteCache'));

    const buildifierSettings = this.addDisposable(
      new BuildifierSettings('bsv.buildifier'));

    const besSettings = this.addDisposable(
      new BuildEventServiceSettings(this.bzlSettings, 'bsv.bes'));

    const debugSettings = this.addDisposable(
      new StarlarkDebuggerSettings('bsv.starlarkDebugger'));

    const codeSearchSettings = this.addDisposable(
      new CodeSearchSettings('bsv.codesearch'));

    const languageServerSettings = this.addDisposable(
      new LanguageServerSettings(this.bzlSettings, remoteCacheSettings, BzlFeatureName + '.lsp'));

    const buildifier = this.addDisposable(
      new Buildifier(buildifierSettings));

    const remoteCache = this.addDisposable(
      new RemoteCache(remoteCacheSettings));

    const account = this.addDisposable(
      new Account(accountSettings, bzlSettings));

    const bzl = this.addDisposable(
      new Bzl(bzlSettings));

    const bes = this.addDisposable(
      new BuildEventService(besSettings, bzl));

    const bazelServer = this.addDisposable(
      new BazelServer(bazelSettings, bzl));

    const starlarkDebugger = this.addDisposable(
      new StarlarkDebugger(debugSettings, bzlSettings));

    const lspClient = this.addDisposable(
      new BzlLanguageClient(this.workspaceDirectory, languageServerSettings));

    const codeSearch = this.addDisposable(
      new CodeSearch(codeSearchSettings, bzl));

    this.addDisposable(
      this.onDidReceiveBazelBuildEvent);

    this.addDisposable(
      new BazelCodelensProvider(codelensSettings.get.bind(codelensSettings), lspClient));

    this.bepRunner = this.addDisposable(
      new BEPRunner(bzl));

    this.addDisposable(
      new BezelWorkspaceView(
        lspClient,
        bzl,
        buildifier,
        remoteCache,
        account,
        bes,
        bazelServer,
        starlarkDebugger,
        codeSearch,
      ));

    this.addDisposable(
      new BuildEventProtocolView(
        this.api,
        this.bepRunner.onDidReceiveBazelBuildEvent.event,
        this.bepRunner.onDidRunRequest.event
      ));

    this.addDisposable(
      vscode.window.onDidCloseTerminal(terminal => {
        switch (terminal.name) {
          case 'bazel':
            this.bazelTerminal?.dispose();
            this.bazelTerminal = undefined;
          case 'debug-cli':
            this.debugCLITerminal?.dispose();
            this.debugCLITerminal = undefined;
        }
      }));

    this.addCommand(CommandName.Redo, this.handleCommandRedo);
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyToClipboard);
    this.addCommand(CommandName.Codesearch, this.handleCommandCodesearch);
    this.addCommand(CommandName.UiLabel, this.handleCommandUILabel);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);

    this.addRedoableCommand(CommandName.Invoke, this.handleCommandInvoke);
    this.addRedoableCommand(CommandName.Run, this.handleCommandRun);
    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);
    this.addRedoableCommand(CommandName.DebugTest, this.handleCommandTestDebug);

    lspClient.start();
    buildifier.start();
    remoteCache.start();
    bes.start();
    account.start();
    bzl.start();
    bazelServer.start();
    starlarkDebugger.start();
  }

  addRedoableCommand(command: string, callback: (...args: any[]) => any) {
    const fn = callback.bind(this);
    this.addCommand(command, async args => {
      await Container.workspace.update(Memento.RedoCommand, command);
      await Container.workspace.update(Memento.RedoArguments, args);
      return fn(args);
    });
  }

  protected addCommand(name: string, command: (...args: any) => any) {
    this.addDisposable(vscode.commands.registerCommand(name, command, this));
  }

  getOrCreateCodesearchPanel(queryExpression: string): CodesearchPanel {
    if (!this.codesearchPanel) {
      this.codesearchPanel = new CodesearchPanel(
        Container.context.extensionPath,
        'Codesearch',
        `Codesearch ${queryExpression}`,
        vscode.ViewColumn.One
      );
      this.codesearchPanel.onDidDispose(
        () => {
          this.codesearchPanel = undefined;
        },
        this,
        this.disposables
      );
    }
    return this.codesearchPanel;
  }

  async handleCommandRedo(): Promise<void> {
    const lastRedoableCommand = Container.workspace.get<string>(Memento.RedoCommand);
    const lastRedoableArgs = Container.workspace.get<string[]>(Memento.RedoArguments);
    if (!(lastRedoableCommand && lastRedoableArgs)) {
      return;
    }
    return vscode.commands.executeCommand(lastRedoableCommand, lastRedoableArgs);
  }

  async handleCommandCopyToClipboard(text: string): Promise<void> {
    vscode.window.setStatusBarMessage(`"${text}" copied to clipboard`, 3000);
    return vscode.env.clipboard.writeText(text);
  }

  async handleCommandBuild(label: string): Promise<void> {
    const cfg = await this.bazelSettings.get();

    const args = ['build', label];
    args.push(...cfg.buildFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandTest(label: string): Promise<void> {
    const cfg = await this.bazelSettings.get();

    const args = ['test', label];
    args.push(...cfg.buildFlags);
    args.push(...cfg.testFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandRun(label: string): Promise<void> {
    const cfg = await this.bazelSettings.get();

    const args = ['run', label];
    args.push(...cfg.runFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandBuildDebug(label: string): Promise<void> {
    return this.handleCommandInvokeDebug('build', label);
  }

  async handleCommandTestDebug(label: string): Promise<void> {
    return this.handleCommandInvokeDebug('test', label);
  }

  async handleCommandInvokeDebug(command: string, label: string): Promise<void> {
    const cfg = await this.bazelSettings.get();

    const action = await vscode.window.showInformationMessage(
      this.debugInfoMessage(),
      'OK',
      'Cancel'
    );
    if (action !== 'OK') {
      return;
    }
    const args = [command, label];
    args.push(...cfg.buildFlags);
    args.push(...cfg.starlarkDebuggerFlags);

    this.handleCommandInvoke(args);
    this.runInDebugCLITerminal(['debug']);
  }

  async handleCommandInvoke(args: string[]): Promise<void> {
    const cfg = await this.codelensSettings.get();
    if (cfg.enableBuildEventProtocol && false) {
      return this.runWithEvents(args);
    }
    return this.runInBazelTerminal(args);
  }

  async runWithEvents(args: string[]): Promise<void> {
    const ws = (await this.bzlSettings.get())._ws;
    if (!ws) {
      vscode.window.setStatusBarMessage('Cannot run (bazel workspace details are not defined)');
      return;
    }

    return this.bepRunner!.run({
      arg: args.concat(['--color=yes']),
      workspace: ws,
    }).catch(err => {
      if (err instanceof Error) {
        vscode.window.showInformationMessage(`could not ${args}: ${err.message}`);
      }
    });
  }

  async handleCommandCodesearch(label: string): Promise<void> {
    const ws = (await this.bzlSettings.get())._ws;
    const expr = `deps(${label})`;

    vscode.commands.executeCommand(CommandName.CodesearchSearch, {
      cwd: ws.cwd,
      args: [expr],
    });
  }

  async handleCommandUILabel(label: string): Promise<void> {
    const cfg = await this.bzlSettings.get();

    const ws = cfg._ws;
    if (!ws.id) {
      return;
    }
    const rel = uiUrlForLabel(ws.id, label);
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${cfg.address}/${rel}`)
    );
  }

  async handleCommandSignIn(): Promise<void> {
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse('https://bzl.io/bezel/install')
    );
  }


  debugInfoMessage(): string {
    return "This will start the Bazel starlark debug server in one terminal and the debug client CLI in a second terminal.  Running the bazel server in starlark debug mode blocks all other operations and may require server shutdown to end the debug session.  It is recommended to make source code changes in the area of debugging interest to defeat Bazel's agressive incremental caching.   Are you sure you want to continue?";
  }

  getOrCreateBazelTerminal(): vscode.Terminal {
    if (!this.bazelTerminal) {
      this.bazelTerminal = vscode.window.createTerminal('bazel');
      this.addDisposable(this.bazelTerminal);
    }
    return this.bazelTerminal;
  }

  getOrCreateDebugCLITerminal(): vscode.Terminal {
    if (!this.debugCLITerminal) {
      this.debugCLITerminal = vscode.window.createTerminal('debug-cli');
      this.addDisposable(this.debugCLITerminal);
    }
    return this.debugCLITerminal;
  }

  async runInBazelTerminal(args: string[]) {
    const cfg = await this.bazelSettings.get();

    this.runInTerminal(this.getOrCreateBazelTerminal(),
      [cfg.executable || defaultBazelExecutable].concat(args));
  }

  async runInDebugCLITerminal(args: string[]) {
    const cfg = await this.bazelSettings.get();

    this.runInTerminal(this.getOrCreateDebugCLITerminal(), [
      cfg.executable || 'bazel',
      '--debug_working_directory=.',
    ].concat(args));
  }

  runInTerminal(terminal: vscode.Terminal, args: string[]): void {
    terminal.sendText(args.join(' '), true);
    terminal.show();
  }

  /**
   * Adds the given child disposable to the feature.
   * @param disposable
   * @returns
   */
  protected addDisposable<D extends vscode.Disposable>(disposable: D): D {
    this.disposables.push(disposable);
    return disposable;
  }

  async dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}

export function setWorkspaceContextValue(value: string): Thenable<unknown> {
  return vscode.commands.executeCommand('setContext', ViewName.Workspace + '.status', value);
}
