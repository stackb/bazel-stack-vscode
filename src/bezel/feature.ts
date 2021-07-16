import * as vscode from 'vscode';
import { API } from '../api';
import { Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { BazelCodelensProvider } from './codelens';
import {
  AccountSettings,
  BazelConfiguration,
  BazelSettings,
  BuildEventServiceSettings,
  BzlConfiguration,
  BzlSettings,
  CodeSearchSettings,
  InvocationsSettings,
  LanguageServerSettings,
  RemoteCacheSettings,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName, Memento } from './constants';
import { Invocations } from './invocations';
import { uiUrlForLabel } from './ui';
import { BezelWorkspaceView } from './workspaceView';
import { CodeSearch } from './codesearch';
import { BzlLanguageClient } from './lsp';
import { Buildifier } from '../buildifier/buildifier';
import { BuildifierSettings } from '../buildifier/settings';
import { RemoteCache } from './remote_cache';
import { Account } from './account';
import { BuildEventService } from './bes';
import { BazelServer } from './bazel';
import { StarlarkDebugger } from './debugger';
import { RunnableComponent } from './status';
import { Settings } from './settings';

export const BzlFeatureName = 'bsv.bzl';

/**
 * BzlFeature handles configuration of all views and commands related to Bzl/Bazel.  
 */
export class BzlFeature implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly workspaceDirectory: string;
  private readonly components: RunnableComponent<any>[] = [];
  private readonly bzlSettings: Settings<BzlConfiguration>;
  private readonly bazelSettings: Settings<BazelConfiguration>;
  private readonly starlarkDebugger: StarlarkDebugger;
  private readonly bzl: Bzl;
  private readonly bazelServer: BazelServer;

  constructor(private api: API, ctx: vscode.ExtensionContext) {

    if (!vscode.workspace.workspaceFolders) {
      throw new Error('Bzl requires that a vscode workspace folder is present.');
    }
    this.workspaceDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;

    // ======= Commands =========

    this.addCommand(CommandName.Redo, this.handleCommandRedo);
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyToClipboard);
    this.addCommand(CommandName.UiLabel, this.handleCommandUILabel);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);

    this.addRedoableCommand(CommandName.Invoke, this.handleCommandInvoke);
    this.addRedoableCommand(CommandName.Run, this.handleCommandRun);
    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);
    this.addRedoableCommand(CommandName.DebugTest, this.handleCommandTestDebug);

    // ======= Settings =========

    const bazelSettings = this.bazelSettings = this.addDisposable(
      new BazelSettings('bsv.bazel'));

    const bzlSettings = this.bzlSettings = this.addDisposable(
      new BzlSettings('bsv.bzl.server', ctx, this.workspaceDirectory, this.bazelSettings));

    const accountSettings = this.addDisposable(
      new AccountSettings('bsv.account', ctx));

    const remoteCacheSettings = this.addDisposable(
      new RemoteCacheSettings('bsv.bzl.remoteCache', this.bzlSettings));

    const buildifierSettings = this.addDisposable(
      new BuildifierSettings('bsv.buildifier'));

    const besSettings = this.addDisposable(
      new BuildEventServiceSettings('bsv.bes', this.bzlSettings));

    const debugSettings = this.addDisposable(
      new StarlarkDebuggerSettings('bsv.bzl.starlarkDebugger'));

    const codeSearchSettings = this.addDisposable(
      new CodeSearchSettings('bsv.bzl.codesearch'));

    const invocationsSettings = this.addDisposable(
      new InvocationsSettings('bsv.invocations'));

    const languageServerSettings = this.addDisposable(
      new LanguageServerSettings('bsv.bzl.lsp', this.bzlSettings));

    // ======= Components =========

    const account = this.addComponent(
      new Account(accountSettings, bzlSettings));

    const bzl = this.bzl = this.addComponent(
      new Bzl(bzlSettings, account));

    const bes = this.addComponent(
      new BuildEventService(besSettings, bzl));
        
    const buildifier = this.addComponent(
      new Buildifier(buildifierSettings));

    const remoteCache = this.addComponent(
      new RemoteCache(remoteCacheSettings));

    const bazelServer = this.bazelServer = this.addComponent(
      new BazelServer(bazelSettings, bzl));

    const starlarkDebugger = this.starlarkDebugger = this.addComponent(
      new StarlarkDebugger(debugSettings, bazelSettings, bzlSettings, this.workspaceDirectory));

    const lspClient = this.addComponent(
      new BzlLanguageClient(this.workspaceDirectory, languageServerSettings));

    const codeSearch = this.addComponent(
      new CodeSearch(codeSearchSettings, bzl));
        
    // ======= Supporting =========

    const invocations = this.addDisposable(
      new Invocations(
        invocationsSettings,
        lspClient,
        bzl,
        this.api,
      ));

    this.addDisposable(new BazelCodelensProvider(lspClient));

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
        invocations,
      ));

    // Reverse the order of components such that "account" gets started last and
    // its onDidChangeStatus will be seen by previously started components.
    this.components.reverse();
    this.components.forEach(c => c.restart());
  }

  addComponent<T extends RunnableComponent<any>>(c: T): T {
    this.components.push(c);
    return this.addDisposable(c);
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

  async handleCommandUILabel(label: string): Promise<void> {
    const cfg = await this.bzlSettings.get();

    const ws = cfg.ws;
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
    return this.starlarkDebugger.invoke('build', label);
  }

  async handleCommandTestDebug(label: string): Promise<void> {
    return this.starlarkDebugger.invoke('test', label);
  }
    
  async handleCommandInvoke(args: string[]): Promise<void> {
    const cfg = await this.bzlSettings.get();
    if (cfg.invokeWithBuildEventStreaming) {
      return this.bzl.runWithEvents(args);
    }
    return this.bazelServer.runInBazelTerminal(args);
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
