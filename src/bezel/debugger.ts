import * as vscode from 'vscode';

import {
  BazelConfiguration,
  BzlConfiguration,
  StarlarkDebuggerConfiguration,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName } from './constants';
import { Settings } from './settings';
import { LaunchableComponent, LaunchArgs, Status, StatusError } from './status';
import { SocketDebugClient, LogLevel } from 'node-debugprotocol-client';
import { isDefined } from 'vscode-common/out/types';


export class StarlarkDebugger
  extends LaunchableComponent<StarlarkDebuggerConfiguration>
  implements vscode.Disposable, vscode.DebugAdapterDescriptorFactory, vscode.DebugConfigurationProvider {

  constructor(
    public readonly settings: StarlarkDebuggerSettings,
    private readonly bazelSettings: Settings<BazelConfiguration>,
    public readonly bzlSettings: Settings<BzlConfiguration>,
    private readonly workspaceFolder: vscode.Uri | undefined,
  ) {
    super('SDB', settings, CommandName.LaunchDebugAdapter, 'starlark-debug-adapter');

    this.disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory('starlark', this));
    this.disposables.push(vscode.debug.registerDebugConfigurationProvider('starlark', this));

    vscode.commands.registerCommand(CommandName.AskForDebugTargetLabel, this.handleCommandAskForDebugTargetLabel, this.disposables);
  }

  async handleCommandAskForDebugTargetLabel(): Promise<string | undefined> {
    return vscode.window.showInputBox({
      placeHolder: 'Please enter the label of bazel build target for the debug session',
      value: '//:your_build_target_here'
    });
  }

  /**
   * Invoke is typically triggered from a 'debug' code action click.  It tries
   * to check that the debug adapter is running and then starts a debug session.
   * @param command
   * @param label
   * @returns
   */
  async invoke(command: string, label: string): Promise<boolean> {
    const debugSettings = await this.settings.get();

    let folder: vscode.WorkspaceFolder | undefined = undefined;
    if (this.workspaceFolder) {
      folder = vscode.workspace.getWorkspaceFolder(this.workspaceFolder);
    }

    return vscode.debug.startDebugging(
      folder,
      {
        type: 'starlark',
        name: 'Launch to a Starlark Debug Session for ' + label,
        request: 'launch',
        targetLabel: label,
        debugServerHost: debugSettings.debugAdapterHost,
        debugServerPort: debugSettings.debugAdapterPort
      },
    );

  }

  /**
   * @override 
   */
  async shouldLaunch(e: Error): Promise<boolean> {
    if (!this.workspaceFolder) {
      vscode.window.showWarningMessage('Cannot launch debug adapter in folder without a workspace.');
      return false;
    }
    const cfg = await this.settings.get();
    return cfg.autoLaunch;
  }

  /**
   * @override 
   */
  async launchInternal(): Promise<void> {
    const cfg = await this.settings.get();

    const client = new SocketDebugClient({
      port: cfg.debugAdapterPort,
      host: cfg.debugAdapterHost,
      logLevel: LogLevel.On,
      loggerName: 'Starlark Debug Adapter Client'
    });

    try {
      await client.connectAdapter();
    } catch (e) {
      if (isTCPConnectionError(e) && e.code === 'ECONNREFUSED') {
        throw new StatusError('Debug Adapter is not running', Status.STOPPED);
      } else {
        throw e;
      }
    } finally {
      client.disconnectAdapter();
    }

  }

  // getLaunchArgs returns the CLI arguments for the debug adapter
  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();

    const args: string[] = [
      cfg.debugAdapterExecutable,
      ...cfg.debugAdapterCommand,
      `--address=${cfg.debugAdapterHost}:${cfg.debugAdapterPort}`,
      `--debug_working_directory=${this.workspaceFolder!.fsPath}`,
    ];
    if (cfg.debugServerHost) {
      args.push(`--debug_server_host=${cfg.debugServerHost}`);
    }
    if (cfg.debugServerPort) {
      args.push(`--debug_server_port=${cfg.debugServerPort}`);
    }

    return {
      command: args.map(a => a.replace('${workspaceFolder}', this.workspaceFolder!.fsPath)),
      showSuccessfulLaunchTerminal: false,
      showFailedLaunchTerminal: true,
    };
  }

  handleLaunchFailed(launchArgs: LaunchArgs, terminal: vscode.Terminal) {
    super.handleLaunchFailed(launchArgs, terminal);
  }

  async createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
    return this.createDebugAdapterServerDescriptor(session, executable);
  }

  async createDebugAdapterServerDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
    const cfg = await this.settings.get();
    return new vscode.DebugAdapterServer(cfg.debugAdapterPort, cfg.debugAdapterHost);
  }

  /**
   * Massage a debug configuration just before a debug session is being
   * launched, e.g. add all missing attributes to the debug configuration.
   */
  async resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration | null | undefined> {
    return config;
  }

  /**
   * This hook is directly called after 'resolveDebugConfiguration' but with all
   * variables substituted. It can be used to resolve or verify a [debug
   * configuration](#DebugConfiguration) by filling in missing values or by
   * adding/changing/removing attributes. If more than one debug configuration
   * provider is registered for the same type, the
   * 'resolveDebugConfigurationWithSubstitutedVariables' calls are chained in
   * arbitrary order and the initial debug configuration is piped through the
   * chain. Returning the value 'undefined' prevents the debug session from
   * starting. Returning the value 'null' prevents the debug session from
   * starting and opens the underlying debug configuration instead.
   *
   * @param folder The workspace folder from which the configuration originates
   * from or `undefined` for a folderless setup.
   * @param debugConfiguration The [debug configuration](#DebugConfiguration) to
   * resolve.
   * @param token A cancellation token.
   * @return The resolved debug configuration or undefined or null.
   */
  async resolveDebugConfigurationWithSubstitutedVariables(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): Promise<vscode.DebugConfiguration | undefined> {
    let targetLabel = config.targetLabel;
    if (!targetLabel) {
      targetLabel = await this.handleCommandAskForDebugTargetLabel();
    }
    if (!targetLabel) {
      vscode.window.showInformationMessage('A label for the "bazel build" command is required.  Please add it to your launch configuration.');
      return;
    }

    // launch the debug adapter if it not already running
    if (this.status !== Status.READY && this.status !== Status.DISABLED) {
      // this needs to wait until the thing is actually running!
      await this.handleCommandLaunch();
      this.restart();
    }

    // launch the bazel debugger if this is a launch config
    if (config.request === 'launch') {
      const bazelSettings = await this.bazelSettings.get();
      const flags = bazelSettings.starlarkDebugFlags || [];
      const extraFlags = config.extraBazelFlags || [];

      await vscode.commands.executeCommand(CommandName.Invoke,
        ['build', targetLabel, ...flags, ...extraFlags].filter(arg => isDefined(arg)));
    }

    return config;
  }

}

interface TCPConnectionError {
  code: string;
  errno: number;
  syscall: string;
  address: string;
  port: number;
}

export function isTCPConnectionError(e: any): e is TCPConnectionError {
  return (e as TCPConnectionError).code !== undefined;
}
