import * as vscode from 'vscode';
import { API } from '../api';
import { Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { BazelCodelensProvider } from './codelens';
import {
  SubscriptionSettings,
  BazelConfiguration,
  BazelSettings,
  BuildEventServiceSettings,
  BzlConfiguration,
  BzlSettings,
  CodeSearchSettings,
  InvocationsConfiguration,
  InvocationsSettings,
  LanguageServerSettings,
  RemoteCacheSettings,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName, Memento } from './constants';
import { Invocations } from './invocations';
import { BezelWorkspaceView } from './workspaceView';
import { CodeSearch } from './codesearch';
import { BzlLanguageClient } from './lsp';
import { Buildifier } from '../buildifier/buildifier';
import { BuildifierSettings } from '../buildifier/settings';
import { RemoteCache } from './remote_cache';
import { Subscription as Subscription } from './subscription';
import { BuildEventService } from './bes';
import { BazelServer } from './bazel';
import { StarlarkDebugger } from './debugger';
import { RunnableComponent } from './status';
import { Settings } from './settings';
import { debug } from 'request';

export const BzlFeatureName = 'bsv.bzl';

/**
 * BzlFeature handles configuration of all views and commands related to Bzl/Bazel.
 */
export class BzlFeature implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly workspaceFolder: vscode.Uri;
  private readonly components: RunnableComponent<any>[] = [];
  private readonly invocationsSettings: Settings<InvocationsConfiguration>;
  private readonly bazelSettings: Settings<BazelConfiguration>;
  private readonly starlarkDebugger: StarlarkDebugger;
  private readonly bzl: Bzl;
  private readonly bazelServer: BazelServer;

  constructor(private api: API, ctx: vscode.ExtensionContext) {
    if (!vscode.workspace.workspaceFolders) {
      throw new Error('bazel.stack.vscode requires that a workspace folder be present.');
    }
    this.workspaceFolder = vscode.workspace.workspaceFolders[0].uri;

    // ======= Commands =========

    this.addCommand(CommandName.Redo, this.handleCommandRedo);
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyToClipboard);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);

    this.addRedoableCommand(CommandName.Invoke, this.handleCommandInvoke);
    this.addRedoableCommand(CommandName.Run, this.handleCommandRun);
    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);
    this.addRedoableCommand(CommandName.DebugTest, this.handleCommandTestDebug);

    // ======= Settings =========

    const bazelSettings = (this.bazelSettings = this.addDisposable(new BazelSettings('bsv.bazel')));

    const bzlSettings = this.addDisposable(
      new BzlSettings('bsv.bzl.server', ctx, this.bazelSettings)
    );

    const subscriptionSettings = this.addDisposable(
      new SubscriptionSettings('bsv.subscription', ctx)
    );

    const remoteCacheSettings = this.addDisposable(
      new RemoteCacheSettings('bsv.bzl.remoteCache', bzlSettings)
    );

    const buildifierSettings = this.addDisposable(new BuildifierSettings('bsv.buildifier'));

    const besSettings = this.addDisposable(new BuildEventServiceSettings('bsv.bes', bzlSettings));

    const debugSettings = this.addDisposable(
      new StarlarkDebuggerSettings('bsv.bzl.starlarkDebugger')
    );

    const codeSearchSettings = this.addDisposable(new CodeSearchSettings('bsv.bzl.codesearch'));

    const invocationsSettings = (this.invocationsSettings = this.addDisposable(
      new InvocationsSettings('bsv.bzl.invocation', subscriptionSettings)
    ));

    const languageServerSettings = this.addDisposable(
      new LanguageServerSettings('bsv.bzl.lsp', bzlSettings, subscriptionSettings)
    );

    // ======= Components =========

    const subscription = this.addComponent(new Subscription(subscriptionSettings, bzlSettings));

    const bzl = (this.bzl = this.addComponent(
      new Bzl(
        bzlSettings,
        subscription,
        bazelSettings,
        invocationsSettings,
        this.workspaceFolder.fsPath
      )
    ));

    const bes = this.addComponent(new BuildEventService(besSettings, bzl));

    const buildifier = this.addComponent(new Buildifier(buildifierSettings));

    const remoteCache = this.addComponent(new RemoteCache(remoteCacheSettings));

    const bazelServer = (this.bazelServer = this.addComponent(
      new BazelServer(bazelSettings, bzl, this.workspaceFolder)
    ));

    const starlarkDebugger = (this.starlarkDebugger = this.addComponent(
      new StarlarkDebugger(debugSettings, bazelSettings, bzlSettings, this.workspaceFolder.fsPath)
    ));

    const lspClient = this.addComponent(
      new BzlLanguageClient(this.workspaceFolder.fsPath, languageServerSettings)
    );

    const codeSearch = this.addComponent(new CodeSearch(codeSearchSettings, bzl));

    // ======= Supporting =========

    const invocations = this.addDisposable(
      new Invocations(invocationsSettings, lspClient, bzl, this.api)
    );

    this.addDisposable(new BazelCodelensProvider(
      lspClient,
      bazelServer,
      codeSearch,
      bzl,
      starlarkDebugger,
    ));

    this.addDisposable(
      new BezelWorkspaceView(
        lspClient,
        bzl,
        buildifier,
        remoteCache,
        subscription,
        bes,
        bazelServer,
        starlarkDebugger,
        codeSearch,
        invocations
      )
    );

    // Reverse the order of components such that "subscription" gets started
    // last and its onDidChangeStatus will be seen by previously started
    // components.
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
    const cfg = await this.invocationsSettings.get();
    if (cfg.invokeWithBuildEventStreaming) {
      // Don't run a debugger process outside the terminal for now.
      const dbg = args.some(arg => arg.indexOf('--experimental_skylark_debug') !== -1);
      if (!dbg) {
        return this.bzl.runWithEvents(args);
      }
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
