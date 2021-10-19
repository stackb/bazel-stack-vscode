import * as vscode from 'vscode';
import {
  BazelConfiguration,
  BzlConfiguration,
  StarlarkDebuggerConfiguration,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName } from './constants';
import { Settings } from './settings';
import { LaunchableComponent, LaunchArgs } from './status';

export class StarlarkDebugger
  extends LaunchableComponent<StarlarkDebuggerConfiguration>
  implements vscode.Disposable, vscode.DebugAdapterDescriptorFactory, vscode.DebugConfigurationProvider {
  constructor(
    public readonly settings: StarlarkDebuggerSettings,
    private readonly bazelSettings: Settings<BazelConfiguration>,
    public readonly bzlSettings: Settings<BzlConfiguration>,
    private readonly workspaceFolder: vscode.Uri,
  ) {
    super('SDB', settings, CommandName.LaunchDebugAdapter, 'starlark-debug-adapter');

    this.disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory('starlark', this));
    this.disposables.push(vscode.debug.registerDebugConfigurationProvider('starlark', this));
  }

  /**
   * @override 
   */
  async shouldLaunch(e: Error): Promise<boolean> {
    return false;
  }

  /**
   * @override 
   */
  async launchInternal(): Promise<void> { }

  async invoke(command: string, label: string): Promise<boolean> {
    const bazelSettings = await this.bazelSettings.get();
    const debugSettings = await this.settings.get();

    const action = await vscode.window.showInformationMessage(debugInfoMessage(), 'OK', 'Cancel');
    if (action !== 'OK') {
      return false;
    }

    const args = [command, label];
    args.push(...bazelSettings.buildFlags, ...bazelSettings.starlarkDebugFlags);

    await vscode.commands.executeCommand(CommandName.Invoke, args);

    return vscode.debug.startDebugging(
      vscode.workspace.getWorkspaceFolder(this.workspaceFolder),
      {
        type: 'starlark',
        name: 'Attach to a Starlark Debug Session',
        request: 'attach',
        debugServerHost: debugSettings.debugAdapterHost,
        debugServerPort: debugSettings.debugAdapterPort
      },
    );

  }

  // getLaunchArgs returns the CLI arguments for the debug adapter
  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();

    const args: string[] = [
      cfg.debugAdapterExecutable,
      ...cfg.debugAdapterCommand,
      `--address=${cfg.debugAdapterHost}:${cfg.debugAdapterPort}`,
      `--debug_working_directory=${this.workspaceFolder.fsPath}`,
    ];
    if (cfg.debugServerHost) {
      args.push(`--debug_server_host=${cfg.debugServerHost}`);
    }
    if (cfg.debugServerPort) {
      args.push(`--debug_server_port=${cfg.debugServerPort}`);
    }

    return {
      command: args.map(a => a.replace('${workspaceFolder}', this.workspaceFolder.fsPath)),
      showSuccessfulLaunchTerminal: true,
      showFailedLaunchTerminal: true,
    };
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
  resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
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
  resolveDebugConfigurationWithSubstitutedVariables(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    return debugConfiguration;
  }

}

function debugInfoMessage(): string {
  return (
    'Running Bazel in debug mode blocks until the debug adapter client attaches.  ' +
    "It is recommended to make changes to BUILD/bzl files in the area of interest to defeat Bazel's aggressive caching mechanism.  " +
    'Are you sure you want to continue?'
  );
}
