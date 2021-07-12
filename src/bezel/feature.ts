import * as grpc from '@grpc/grpc-js';
import request = require('request');
import * as vscode from 'vscode';
import { API } from '../api';
import { AppClient, BzlAPIClient, createBzlServerClient } from './bzl';
import { createLicensesClient, loadLicenseProtos } from './proto';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { Reconfigurable } from '../reconfigurable';
import { BEPRunner } from './bepRunner';
import { BazelCodelensProvider } from './codelens';
import {
  AccountConfiguration,
  BezelConfiguration,
  createBezelConfiguration,
  writeLicenseFile,
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
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { RemoteExecutionClient } from './remote_cache';

/**
 * Fallback version of bazel executable if none defined.
 */
const defaultBazelExecutable = 'bazel';

export const BzlFeatureName = 'bsv.bzl';

export class BzlFeature extends Reconfigurable<BezelConfiguration> {
  private onDidChangeBzlLanguageClient: vscode.EventEmitter<BzlLanguageClient> = new vscode.EventEmitter();
  private onDidChangeBzlAPIClient: vscode.EventEmitter<BzlAPIClient> = new vscode.EventEmitter();
  private onDidChangeLicenseClient: vscode.EventEmitter<LicensesClient> = new vscode.EventEmitter();
  private onDidChangeLicenseToken: vscode.EventEmitter<string> = new vscode.EventEmitter();
  private onDidReceiveBazelBuildEvent: vscode.EventEmitter<BazelBuildEvent> =
    new vscode.EventEmitter();

  private readonly workspaceDirectory: string;
  private cfg: BezelConfiguration | undefined;
  private bazelTerminal: vscode.Terminal | undefined;
  private codesearchPanel: CodesearchPanel | undefined;
  private debugCLITerminal: vscode.Terminal | undefined;
  private bepRunner: BEPRunner | undefined;

  private lspClient: BzlLanguageClient | undefined;
  private apiClient: BzlAPIClient | undefined;
  private licensesClient: LicensesClient | undefined;

  constructor(private api: API) {
    super(BzlFeatureName);

    if (!vscode.workspace.workspaceFolders) {
      throw new Error('Bzl requires that a vscode workspace folder is present.');
    }
    this.workspaceDirectory = vscode.workspace.workspaceFolders[0].uri.fsPath;

    this.onDidConfigurationChange.event(this.handleConfigurationChanged, this, this.disposables);

    new UriHandler(this.disposables);

    this.add(this.onDidChangeBzlAPIClient);
    this.add(this.onDidChangeLicenseClient);
    this.add(this.onDidChangeLicenseToken);
    this.add(this.onDidReceiveBazelBuildEvent);

    this.bepRunner = this.add(new BEPRunner(this.onDidChangeBzlAPIClient.event));
    this.add(
      new BezelWorkspaceView(
        this.onDidChangeBzlLanguageClient.event,
        this.onDidChangeBzlAPIClient.event,
        this.onDidChangeLicenseClient.event,
        this.onDidChangeLicenseToken.event,
        this.onDidConfigurationChange.event
      )
    );
    this.add(
      new BuildEventProtocolView(
        this.api,
        this.onDidChangeBzlLanguageClient.event,
        this.bepRunner.onDidReceiveBazelBuildEvent.event,
        this.bepRunner.onDidRunRequest.event
      )
    );
    this.add(
      new BazelCodelensProvider(
        this.onDidConfigurationChange.event,
        this.onDidChangeBzlLanguageClient.event
      )
    );
    this.add(new CodeSearch(this.onDidChangeBzlAPIClient.event));
    this.add(
      vscode.window.onDidCloseTerminal(terminal => {
        switch (terminal.name) {
          case 'bazel':
            this.bazelTerminal?.dispose();
            this.bazelTerminal = undefined;
          case 'debug-cli':
            this.debugCLITerminal?.dispose();
            this.debugCLITerminal = undefined;
        }
      })
    );

    this.addCommand(CommandName.Redo, this.handleCommandRedo);
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyToClipboard);
    this.addCommand(CommandName.CopyLabel, this.handleCommandCopyLabel);
    this.addCommand(CommandName.Codesearch, this.handleCommandCodesearch);
    this.addCommand(CommandName.UiLabel, this.handleCommandUILabel);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);
    this.addCommand(CommandName.Login, this.handleCommandLogin);

    this.addRedoableCommand(CommandName.Invoke, this.handleCommandInvoke);
    this.addRedoableCommand(CommandName.Run, this.handleCommandRun);
    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);
    this.addRedoableCommand(CommandName.DebugTest, this.handleCommandTestDebug);
  }

  async configure(config: vscode.WorkspaceConfiguration): Promise<BezelConfiguration> {
    setWorkspaceContextValue('LOADING');
    return createBezelConfiguration(Container.context, config);
  }

  async tryShutdownExistingAPIClient(address: string) {
    try {
      const appClient = AppClient.fromAddress(address);
      const md = await appClient.getMetadata(false, 1); // no wait for ready, 1 sec
      await appClient.shutdown(false); // no restart

      console.log(`successfully shut down existing bzl server at ${address}`);
    } catch (e) {
      if (isGrpcError(e)) {
        if (e.code === grpc.status.UNAVAILABLE) {
          console.log(`existing running bzl server not found: ${e.message}`);
        } else {
          console.log(`could not shut down existing bzl server: ${e.message}`);
        }
      }
    }
  }

  async startBzlLanguageClient(cfg: BezelConfiguration) {
    this.tryShutdownExistingAPIClient(cfg.bzl.address);

    const ws: Workspace = {
      cwd: this.workspaceDirectory,
      bazelBinary: cfg.bazel.executable,
    };

    let command = cfg.bzl.command;
    command.push('--address=' + cfg.bzl.address);


    // If the remote cache address is configured, try and start it unless a
    // service already exists
    if (cfg.remoteCache.address) {
      try {
        const reClient = RemoteExecutionClient.fromAddress(cfg.remoteCache.address);
        await reClient.getServerCapabilities();  
        // if we get here, assume the cache is already running, don't try and
        // start a new one.
        console.log(`remote cache ${cfg.remoteCache.address} is already running`);
      } catch (ex) {
        // assume cache is not running.  In this case add arguments to start the cache
        command.push('--remote_cache=' + cfg.remoteCache.address);
        if (cfg.remoteCache.maxSizeGb) {
          command.push('--remote_cache_size_gb=' + cfg.remoteCache.maxSizeGb);
        }
        if (cfg.remoteCache.dir) {
          command.push('--remote_cache_dir=' + cfg.remoteCache.dir);
        }  
      }
    }

    try {
      this.lspClient = new BzlLanguageClient(
        this.workspaceDirectory,
        cfg.bzl.executable,
        command,
        this.disposables,
      );
      await this.lspClient.start();
      this.onDidChangeBzlLanguageClient.fire(this.lspClient);

      this.apiClient = createBzlServerClient(ws, cfg.bzl.address);
      await this.apiClient.start();
      this.onDidChangeBzlAPIClient.fire(this.apiClient);

    } catch (e) {
      setWorkspaceContextValue('LOADING_ERROR');
      vscode.window.showErrorMessage(`failed to prepare Bzl client: ${e.message}`);
    }
  }

  async startBzlAPIClient(cfg: BezelConfiguration) {
  }


  async startLicensesClient(cfg: AccountConfiguration) {
    try {
      if (this.licensesClient) {
        this.licensesClient.close();
      }
      const licenseProto = loadLicenseProtos(Container.protofile('license.proto').fsPath);
      this.licensesClient = createLicensesClient(licenseProto, cfg.serverAddress);
      this.onDidChangeLicenseToken.fire(cfg.token);
      this.onDidChangeLicenseClient.fire(this.licensesClient);
    } catch (e) {
      setWorkspaceContextValue('LOADING_ERROR');
      vscode.window.showErrorMessage(`failed to prepare Licenses client: ${e.message}`);
    }
  }

  async handleConfigurationChanged(cfg: BezelConfiguration) {
    this.cfg = cfg;

    if (this.licensesClient) {
      this.licensesClient.close();
      this.licensesClient = undefined;
    }
    if (this.lspClient) {
      this.lspClient.stop();
      this.lspClient = undefined;
    }

    await this.startLicensesClient(cfg.account);
    await this.startBzlLanguageClient(cfg);
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
    this.add(vscode.commands.registerCommand(name, command, this));
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
    if (!this.lspClient) {
      return;
    }
    try {
      const label = await this.lspClient.getLabelAtDocumentPosition(
        editor.document.uri,
        selection
      );
      if (!label) {
        return;
      }
      return vscode.commands.executeCommand(CommandName.CopyToClipboard, label);
    } catch (e) {
      console.debug(e.message);
    }
  }

  async handleCommandBuild(label: string): Promise<void> {
    const args = ['build', label];
    args.push(...this.cfg!.bazel.buildFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandTest(label: string): Promise<void> {
    const args = ['test', label];
    args.push(...this.cfg!.bazel.buildFlags);
    args.push(...this.cfg!.bazel.testFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandRun(label: string): Promise<void> {
    const args = ['run', label];
    args.push(...this.cfg!.bazel.runFlags);
    this.handleCommandInvoke(args);
  }

  async handleCommandBuildDebug(label: string): Promise<void> {
    return this.handleCommandInvokeDebug('build', label);
  }

  async handleCommandTestDebug(label: string): Promise<void> {
    return this.handleCommandInvokeDebug('test', label);
  }

  async handleCommandInvokeDebug(command: string, label: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      this.debugInfoMessage(),
      'OK',
      'Cancel'
    );
    if (action !== 'OK') {
      return;
    }
    const args = [command, label];
    args.push(...this.cfg!.bazel.buildFlags);
    args.push(...this.cfg!.bazel.starlarkDebuggerFlags);

    this.handleCommandInvoke(args);
    this.runInDebugCLITerminal(['debug']);
  }

  async handleCommandInvoke(args: string[]): Promise<void> {
    if (this.cfg?.codelens.enableBuildEventProtocol) {
      return this.runWithEvents(args);
    }
    return this.runInBazelTerminal(args);
  }

  async runWithEvents(args: string[]): Promise<void> {
    const ws = this.apiClient?.ws;
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
    const ws = this.apiClient?.ws;
    if (!(ws && ws.cwd)) {
      return;
    }

    const expr = `deps(${label})`;

    vscode.commands.executeCommand(CommandName.CodesearchSearch, {
      cwd: ws.cwd,
      args: [expr],
    });
  }

  async handleCommandUILabel(label: string): Promise<void> {
    const ws = this.apiClient?.ws;
    if (!(ws && ws.id)) {
      return;
    }
    const rel = uiUrlForLabel(ws.id, label);
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${this.cfg?.bzl.address}/${rel}`)
    );
  }

  async handleCommandSignIn(): Promise<void> {
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse('https://bzl.io/bezel/install')
    );
  }

  async handleCommandLogin(release: string, token: string): Promise<void> {
    const cfg = this.cfg;
    if (!cfg) {
      return;
    }
    request.get(
      cfg.bzl.downloadBaseURL + '/latest/license.key',
      {
        auth: {
          bearer: token,
        },
      },
      (err, resp, body) => {
        if (err) {
          vscode.window.showErrorMessage(`could not download license file: ${err.message}`);
          return;
        }
        if (resp.statusCode !== 200) {
          vscode.window.showErrorMessage(
            `unexpected HTTP response code whhile downloading license file: ${resp.statusCode}: ${resp.statusMessage}`
          );
          return;
        }
        writeLicenseFile(body);
        cfg.account.token = token;
        return vscode.commands.executeCommand(BuiltInCommands.Reload);
        // this.handleConfigurationChanged(cfg);
      }
    );
  }

  debugInfoMessage(): string {
    return "This will start the Bazel starlark debug server in one terminal and the debug client CLI in a second terminal.  Running the bazel server in starlark debug mode blocks all other operations and may require server shutdown to end the debug session.  It is recommended to make source code changes in the area of debugging interest to defeat Bazel's agressive incremental caching.   Are you sure you want to continue?";
  }

  getOrCreateBazelTerminal(): vscode.Terminal {
    if (!this.bazelTerminal) {
      this.bazelTerminal = vscode.window.createTerminal('bazel');
      this.add(this.bazelTerminal);
    }
    return this.bazelTerminal;
  }

  getOrCreateDebugCLITerminal(): vscode.Terminal {
    if (!this.debugCLITerminal) {
      this.debugCLITerminal = vscode.window.createTerminal('debug-cli');
      this.add(this.debugCLITerminal);
    }
    return this.debugCLITerminal;
  }

  runInBazelTerminal(args: string[]): void {
    this.runInTerminal(this.getOrCreateBazelTerminal(),
      [this.cfg!.bazel.executable || defaultBazelExecutable].concat(args));
  }

  runInDebugCLITerminal(args: string[]): void {
    this.runInTerminal(this.getOrCreateDebugCLITerminal(), [
      this.cfg!.bzl.executable,
      '--debug_working_directory=.',
    ].concat(args));
  }

  runInTerminal(terminal: vscode.Terminal, args: string[]): void {
    terminal.sendText(args.join(' '), true);
    terminal.show();
  }

  async dispose() {
    super.dispose();

    if (this.licensesClient) {
      this.licensesClient.close();
      this.licensesClient = undefined;
    }
    if (this.apiClient) {
      await this.apiClient.dispose();
      this.apiClient = undefined;
    }
    if (this.lspClient) {
      await this.lspClient.stop();
      this.lspClient = undefined;
    }
  }
}

export function setWorkspaceContextValue(value: string): Thenable<unknown> {
  return vscode.commands.executeCommand('setContext', ViewName.Workspace + '.status', value);
}

function isGrpcError(e: any): e is grpc.ServiceError {
  return 'code' in e && 'message' in e;
}