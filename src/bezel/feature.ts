import * as vscode from 'vscode';
import { API } from '../api';
import { Bzl } from './bzl';
import { BuiltInCommands } from '../constants';
import {
  SubscriptionSettings,
  BazelConfiguration,
  BazelSettings,
  BuildEventServiceSettings,
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
import { RunnableComponent, Status } from './status';
import { Settings } from './settings';
import { BuildozerSettings } from '../buildozer/settings';
import { ConfigurationContext } from '../common';
import findUp = require('find-up');
import path = require('path');
import { Buildozer } from '../buildozer/buildozer';

export const BzlFeatureName = 'bsv.bzl';

function findWorkspaceFolder(cwd: string): vscode.Uri | undefined {
  const workspace = findUp.sync(['WORKSPACE', 'WORKSPACE.bazel'], {
    cwd: cwd,
  });
  if (workspace) {
    return vscode.Uri.file(path.dirname(workspace));
  }
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    return vscode.workspace.workspaceFolders[0].uri;
  }
  return undefined;
}

/**
 * BzlFeature handles configuration of all views and commands related to Bzl/Bazel.
 */
export class BzlFeature implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  // private readonly workspaceFolder: vscode.Uri | undefined;
  private readonly components: RunnableComponent<any>[] = [];
  private readonly invocationsSettings: Settings<InvocationsConfiguration>;
  private readonly bazelSettings: Settings<BazelConfiguration>;
  // these can be undefined if we don't have a WORKSPACE file
  private readonly starlarkDebugger: StarlarkDebugger | undefined;
  private readonly bzl: Bzl | undefined;
  private readonly bazelServer: BazelServer | undefined;
  private readonly invocations: Invocations | undefined;

  constructor(private api: API, ctx: vscode.ExtensionContext, private configCtx: ConfigurationContext) {
    let cwd = '.';
    if (vscode.workspace.workspaceFolders?.length) {
      cwd = vscode.workspace.workspaceFolders[0].uri.fsPath;
    }
    const workspaceFolder = findWorkspaceFolder(cwd);

    // ======= Commands =========

    this.addCommand(CommandName.Redo, this.handleCommandRedo);
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyToClipboard);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);

    this.addRedoableCommand(CommandName.Invoke, this.handleCommandInvoke);
    this.addRedoableCommand(CommandName.Run, this.handleCommandRun);
    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);

    // ======= Settings =========

    const bazelSettings = (this.bazelSettings = this.addDisposable(new BazelSettings(configCtx, 'bsv.bazel')));

    const bzlSettings = this.addDisposable(
      new BzlSettings(configCtx, 'bsv.bzl.server', ctx, this.bazelSettings)
    );

    const subscriptionSettings = this.addDisposable(
      new SubscriptionSettings(configCtx, 'bsv.subscription', ctx)
    );

    const remoteCacheSettings = this.addDisposable(
      new RemoteCacheSettings(configCtx, 'bsv.bzl.remoteCache', bzlSettings)
    );

    const buildifierSettings = this.addDisposable(new BuildifierSettings(configCtx, 'bsv.buildifier'));
    const buildozerSettings = this.addDisposable(new BuildozerSettings(configCtx, 'bsv.buildozer', buildifierSettings));

    const besSettings = this.addDisposable(new BuildEventServiceSettings(configCtx, 'bsv.bes', bzlSettings));

    const debugSettings = this.addDisposable(
      new StarlarkDebuggerSettings(configCtx, 'bsv.bzl.starlarkDebugger', bzlSettings)
    );

    const codeSearchSettings = this.addDisposable(new CodeSearchSettings(configCtx, 'bsv.bzl.codesearch'));

    const invocationsSettings = (this.invocationsSettings = this.addDisposable(
      new InvocationsSettings(configCtx, 'bsv.bzl.invocation', subscriptionSettings)
    ));

    const languageServerSettings = this.addDisposable(
      new LanguageServerSettings(configCtx, 'bsv.bzl.lsp', bzlSettings, subscriptionSettings)
    );

    // ======= Components =========

    const subscription = this.addComponent(new Subscription(subscriptionSettings, bzlSettings));

    if (workspaceFolder) {
      const bzl = (this.bzl = this.addComponent(
        new Bzl(
          bzlSettings,
          subscription,
          bazelSettings,
          invocationsSettings,
          workspaceFolder
        )
      ));
      const bes = this.addComponent(new BuildEventService(besSettings, bzl));
      const bazelServer = (this.bazelServer = this.addComponent(
        new BazelServer(bazelSettings, bzl)
      ));
      const lspClient = this.addComponent(
        new BzlLanguageClient(workspaceFolder.fsPath, languageServerSettings)
      );
      const invocations = this.invocations = this.addDisposable(
        new Invocations(invocationsSettings, lspClient, bzl, this.api)
      );
      const buildifier = this.addComponent(new Buildifier(buildifierSettings));
      const buildozer = this.addComponent(new Buildozer(buildozerSettings));
      const remoteCache = this.addComponent(new RemoteCache(remoteCacheSettings));
      const starlarkDebugger = (this.starlarkDebugger = this.addComponent(
        new StarlarkDebugger(debugSettings, bazelSettings, bzlSettings, workspaceFolder)
      ));
      const codeSearch = this.addComponent(new CodeSearch(codeSearchSettings, bzl));
      this.addDisposable(
        new BezelWorkspaceView(
          lspClient,
          bzl,
          buildifier,
          buildozer,
          remoteCache,
          subscription,
          bes,
          bazelServer,
          starlarkDebugger,
          codeSearch,
          invocations
        )
      );
    }


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
      await this.configCtx.workspaceState.update(Memento.RedoCommand, command);
      await this.configCtx.workspaceState.update(Memento.RedoArguments, args);
      return fn(args);
    });
  }

  protected addCommand(name: string, command: (...args: any) => any) {
    this.addDisposable(vscode.commands.registerCommand(name, command, this));
  }

  async handleCommandRedo(): Promise<void> {
    const lastRedoableCommand = this.configCtx.workspaceState.get<string>(Memento.RedoCommand);
    const lastRedoableArgs = this.configCtx.workspaceState.get<string[]>(Memento.RedoArguments);
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
      vscode.Uri.parse('https://bzl.io/@')
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

  async handleCommandBuildDebug(label: string): Promise<boolean> {
    if (!this.starlarkDebugger) {
      vscode.window.showWarningMessage('Cannot invoke debugger without WORKSPACE file');
      return false;
    }
    return this.starlarkDebugger.invoke('build', label);
  }

  async handleCommandInvoke(args: string[]): Promise<void> {
    if (!(this.invocations && this.bazelServer && this.bzl)) {
      vscode.window.showWarningMessage('Cannot invoke bazel without WORKSPACE file');
      return;
    }

    if (this.invocations.status !== Status.READY) {
      return this.bazelServer.runInBazelTerminal(args);
    }

    const cfg = await this.invocationsSettings.get();
    if (!cfg.invokeWithBuildEventStreaming) {
      return this.bazelServer.runInBazelTerminal(args);
    }

    // Don't run a debugger process outside the terminal for now.
    const dbg = args.some(arg => arg.indexOf('--experimental_skylark_debug') !== -1);
    if (dbg) {
      return this.bazelServer.runInBazelTerminal(args);
    }

    return this.bzl.runWithEvents(args);
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
