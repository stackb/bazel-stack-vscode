import * as grpc from '@grpc/grpc-js';
import request = require('request');
import * as vscode from 'vscode';
import { API } from '../api';
import { BzlClient } from './bzl';
import {
  createLicensesClient,
  loadBzlProtos,
  loadCodesearchProtos,
  loadLicenseProtos,
} from './proto';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { Reconfigurable } from '../reconfigurable';
import { BEPRunner } from './bepRunner';
import { BazelCodelensProvider } from './codelens';
import {
  AccountConfiguration,
  BezelConfiguration,
  BzlConfiguration,
  createBezelConfiguration,
  writeLicenseFile,
} from './configuration';
import { CommandName, ViewName } from './constants';
import { BuildEventProtocolView } from './invocationView';
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { uiUrlForLabel } from './ui';
import { UriHandler } from './urihandler';
import { BezelWorkspaceView } from './workspaceView';
import { BazelBuildEvent } from './bepHandler';
import { CodesearchPanel } from './codesearch/panel';

export const BezelFeatureName = 'bsv.bazel';

// workspaceNotFoundErrorMessage is the error message returned by the lsp server
// when the workspace is not found.
const workspaceNotFoundErrorMessage = 'WORKSPACE_NOT_FOUND';

export class BezelFeature extends Reconfigurable<BezelConfiguration> {
  private onDidBazelInfoChange: vscode.EventEmitter<BazelInfoResponse> = new vscode.EventEmitter();
  private onDidChangeLSPClient: vscode.EventEmitter<BezelLSPClient> = new vscode.EventEmitter();
  private onDidChangeBzlClient: vscode.EventEmitter<BzlClient> = new vscode.EventEmitter();
  private onDidChangeLicenseClient: vscode.EventEmitter<LicensesClient> = new vscode.EventEmitter();
  private onDidChangeLicenseToken: vscode.EventEmitter<string> = new vscode.EventEmitter();
  private onDidReceiveBazelBuildEvent: vscode.EventEmitter<BazelBuildEvent> =
    new vscode.EventEmitter();
  private onDidRequestRestart: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();

  private cfg: BezelConfiguration | undefined;
  private bazelTerminal: vscode.Terminal | undefined;
  private codesearchPanel: CodesearchPanel | undefined;
  private debugCLITerminal: vscode.Terminal | undefined;
  private lastRedoableCommand: string = '';
  private lastRedoableArgs: string[] = [];
  private bepRunner: BEPRunner | undefined;

  private lspClient: BezelLSPClient | undefined;
  private bzlClient: BzlClient | undefined;
  private licensesClient: LicensesClient | undefined;

  constructor(private api: API) {
    super(BezelFeatureName);

    this.onDidConfigurationChange.event(this.handleConfigurationChanged, this, this.disposables);

    new UriHandler(this.disposables);
    this.add(this.onDidChangeLSPClient);
    this.add(this.onDidChangeBzlClient);
    this.add(this.onDidChangeLicenseClient);
    this.add(this.onDidChangeLicenseToken);
    this.add(this.onDidReceiveBazelBuildEvent);
    this.add(this.onDidBazelInfoChange);

    this.bepRunner = this.add(new BEPRunner(this.onDidChangeBzlClient.event));
    this.add(
      new BezelWorkspaceView(
        this.onDidChangeBzlClient.event,
        this.onDidChangeLicenseClient.event,
        this.onDidChangeLicenseToken.event,
        this.onDidChangeLSPClient.event,
        this.onDidBazelInfoChange.event
      )
    );
    this.add(
      new BuildEventProtocolView(
        this.api,
        this.onDidChangeBzlClient.event,
        this.bepRunner.onDidReceiveBazelBuildEvent.event
      )
    );
    this.add(
      new BazelCodelensProvider(
        this.onDidConfigurationChange.event,
        this.onDidChangeLSPClient.event
      )
    );

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
    this.addCommand(CommandName.CopyToClipboard, this.handleCommandCopyLabel);
    this.addCommand(CommandName.Codesearch, this.handleCommandCodesearch);
    this.addCommand(CommandName.UI, this.handleCommandUI);
    this.addCommand(CommandName.SignIn, this.handleCommandSignIn);
    this.addCommand(CommandName.Login, this.handleCommandLogin);

    this.addRedoableCommand(CommandName.Build, this.handleCommandBuild);
    this.addRedoableCommand(CommandName.BuildEvents, this.handleCommandBuildEvents);
    this.addRedoableCommand(CommandName.DebugBuild, this.handleCommandBuildDebug);
    this.addRedoableCommand(CommandName.Test, this.handleCommandTest);
    this.addRedoableCommand(CommandName.TestEvents, this.handleCommandTestEvents);
    this.addRedoableCommand(CommandName.DebugTest, this.handleCommandTestDebug);
  }

  async configure(config: vscode.WorkspaceConfiguration): Promise<BezelConfiguration> {
    setWorkspaceContextValue('LOADING');
    return createBezelConfiguration(Container.context, config);
  }

  async startLspClient(cfg: BezelConfiguration) {
    let lspCommand = cfg.bzl.command;
    if (cfg.account.token) {
      lspCommand = lspCommand.concat(['--address', cfg.bzl.address, '--grpc_log_level=debug']);
    }

    try {
      if (this.lspClient) {
        this.lspClient.dispose();
      }
      // Make the LSP Client and notify listeners
      const client = (this.lspClient = await this.createLspClient(cfg.bzl.executable, lspCommand));
      client.start();
      await client.onReady();
      await this.fetchBazelInfo(client);
      this.onDidChangeLSPClient.fire(client);
      // vscode.window.showInformationMessage(`Created new LSP Client ${lspCommand}`);
    } catch (e) {
      setWorkspaceContextValue('LOADING_ERROR');
      vscode.window.showErrorMessage(`failed to prepare LSP client: ${e.message}`);
      return;
    }
  }

  async startBzlClient(cfg: BzlConfiguration) {
    try {
      if (this.bzlClient) {
        await this.bzlClient.shutdown(false);
      }
      this.bzlClient = this.createBzlClient(cfg);
      await this.bzlClient.waitForReady();
      this.onDidChangeBzlClient.fire(this.bzlClient);
      // vscode.window.showInformationMessage(`Created new Bzl Client`);
    } catch (e) {
      setWorkspaceContextValue('LOADING_ERROR');
      vscode.window.showErrorMessage(`failed to prepare Bzl client: ${e.message}`);
      return;
    }
  }

  async startLicensesClient(cfg: AccountConfiguration) {
    try {
      if (this.licensesClient) {
        this.licensesClient.close();
      }
      this.licensesClient = await this.createLicensesClient(cfg);
      this.onDidChangeLicenseToken.fire(cfg.token);
      this.onDidChangeLicenseClient.fire(this.licensesClient);
      // vscode.window.showInformationMessage(`Created new Licenses Client`);
    } catch (e) {
      setWorkspaceContextValue('LOADING_ERROR');
      vscode.window.showErrorMessage(`failed to prepare Licenses client: ${e.message}`);
      return;
    }
  }

  async handleConfigurationChanged(cfg: BezelConfiguration) {
    this.cfg = cfg;

    if (!this.lspClient) {
      this.startLspClient(cfg);
    }

    if (!this.bzlClient && cfg.account.token) {
      this.startBzlClient(cfg.bzl);
    }

    if (!this.licensesClient) {
      this.startLicensesClient(cfg.account);
    }
  }

  addRedoableCommand(command: string, callback: (...args: any[]) => any) {
    const fn = callback.bind(this);
    this.addCommand(command, args => {
      this.lastRedoableCommand = command;
      this.lastRedoableArgs = args;
      return fn(args);
    });
  }

  async fetchBazelInfo(client: BezelLSPClient): Promise<void> {
    try {
      const info = await client.bazelInfo();
      setWorkspaceContextValue('LOADED');
      this.onDidBazelInfoChange.fire(info);
    } catch (e) {
      if (e.message === workspaceNotFoundErrorMessage) {
        setWorkspaceContextValue(workspaceNotFoundErrorMessage);
      }
      throw e;
    }
  }

  protected async createLspClient(executable: string, command: string[]): Promise<BezelLSPClient> {
    return new BezelLSPClient(executable, command);
  }

  protected createBzlClient(cfg: BzlConfiguration): BzlClient {
    const bzlProto = loadBzlProtos(Container.protofile('bzl.proto').fsPath);
    const codesearchProto = loadCodesearchProtos(Container.protofile('codesearch.proto').fsPath);

    return new BzlClient(
      cfg.executable,
      bzlProto,
      codesearchProto,
      cfg.address,
      this.onDidRequestRestart
    );
  }

  protected async createLicensesClient(cfg: AccountConfiguration): Promise<LicensesClient> {
    const licenseProto = loadLicenseProtos(Container.protofile('license.proto').fsPath);
    const licenseClient = createLicensesClient(licenseProto, cfg.serverAddress);
    // this.closeables.push(licenseClient);
    return licenseClient;
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
    if (!(this.lastRedoableCommand && this.lastRedoableArgs.length)) {
      return;
    }
    return vscode.commands.executeCommand(this.lastRedoableCommand, this.lastRedoableArgs);
  }

  async handleCommandCopyLabel(label: string): Promise<void> {
    vscode.window.setStatusBarMessage(`"${label}" copied to clipboard`, 3000);
    return vscode.env.clipboard.writeText(label);
  }

  async handleCommandBuild(label: string): Promise<void> {
    const args = ['build', label];
    args.push(...this.cfg!.bazel.buildFlags);
    this.runInBazelTerminal(args);
  }

  async handleCommandBuildEvents(label: string): Promise<void> {
    this.runEvents('build', label);
  }

  async handleCommandTestEvents(label: string): Promise<void> {
    this.runEvents('test', label);
  }

  async runEvents(command: string, label: string): Promise<void> {
    const ws = this.lspClient?.ws;
    if (!ws) {
      vscode.window.setStatusBarMessage(`Sorry, lspClient workspace not set`);
      return;
    }

    const request: RunRequest = {
      arg: [command, label, '--color=yes'],
      workspace: ws,
    };

    return this.bepRunner!.runTask(
      request,
      (
        err: grpc.ServiceError | undefined,
        md: grpc.Metadata | undefined,
        response: RunResponse | undefined
      ) => {
        if (err) {
          console.warn('run error', err);
          return;
        }
      }
    );
  }

  async handleCommandTest(label: string): Promise<void> {
    const args = ['test', label];
    args.push(...this.cfg!.bazel.buildFlags);
    args.push(...this.cfg!.bazel.testFlags);

    this.runInBazelTerminal(args);
  }

  async handleCommandBuildDebug(label: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      this.debugInfoMessage(),
      'OK',
      'Cancel'
    );
    if (action !== 'OK') {
      return;
    }
    const args = ['build', label];
    args.push(...this.cfg!.bazel.buildFlags);
    args.push(...this.cfg!.bazel.starlarkDebuggerFlags);

    this.runInBazelTerminal(args);
    this.runInDebugCLITerminal(['debug']);
  }

  async handleCommandTestDebug(label: string): Promise<void> {
    const action = await vscode.window.showInformationMessage(
      this.debugInfoMessage(),
      'OK',
      'Cancel'
    );
    if (action !== 'OK') {
      return;
    }
    const args = ['test', label];
    args.push(...this.cfg!.bazel.buildFlags);
    args.push(...this.cfg!.bazel.testFlags);
    args.push(...this.cfg!.bazel.starlarkDebuggerFlags);
    this.runInBazelTerminal(args);
  }

  async handleCommandCodesearch(label: string): Promise<void> {
    const expr = `deps(${label})`;

    vscode.commands.executeCommand(CommandName.CodesearchSearch, {
      cwd: this.lspClient?.info?.workspace,
      args: [expr],
    });
  }

  async handleCommandUI(label: string): Promise<void> {
    if (!(this.lspClient && this.lspClient.getWorkspaceID())) {
      return;
    }
    const rel = uiUrlForLabel(this.lspClient.getWorkspaceID(), label);

    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`http://${this.cfg?.bzl.address}/${rel}`)
    );
  }

  async handleCommandSignIn(): Promise<void> {
    vscode.commands.executeCommand(
      BuiltInCommands.Open,
      vscode.Uri.parse(`https://bzl.io/bezel/install`)
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
        this.handleConfigurationChanged(cfg);
      }
    );
    // const config = vscode.workspace.getConfiguration(BezelFeatureName);
    // config.update(ConfigSection.AccountToken, token, vscode.ConfigurationTarget.Global);
    // config.update(ConfigSection.BzlRelease, release, vscode.ConfigurationTarget.Global);
  }

  debugInfoMessage(): string {
    return `This will start the Bazel starlark debug server in one terminal and the debug client CLI in a second terminal.  Running the bazel server in starlark debug mode blocks all other operations and may require server shutdown to end the debug session.  Are you sure you want to continue?`;
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
    args.unshift(this.cfg!.bazel.executable);
    this.runInTerminal(this.getOrCreateBazelTerminal(), args);
  }

  runInDebugCLITerminal(args: string[]): void {
    args.unshift('--debug_working_directory=.');
    args.unshift(this.cfg!.bzl.executable);

    this.runInTerminal(this.getOrCreateDebugCLITerminal(), args);
  }

  runInTerminal(terminal: vscode.Terminal, args: string[]): void {
    terminal.sendText(args.join(' '), true);
    terminal.show();
  }

  dispose() {
    super.dispose();

    if (this.licensesClient) {
      this.licensesClient.close();
      this.licensesClient = undefined;
    }
    if (this.lspClient) {
      this.lspClient.dispose();
      this.lspClient = undefined;
    }
    if (this.bzlClient) {
      this.bzlClient.shutdown(false); // false=no-restart
      this.bzlClient = undefined;
    }
  }
}

export function setWorkspaceContextValue(value: string): Thenable<unknown> {
  return vscode.commands.executeCommand('setContext', ViewName.Workspace + '.status', value);
}
