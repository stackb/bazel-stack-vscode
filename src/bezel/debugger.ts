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
    private readonly workspaceFolder: string
  ) {
    super('SDB', settings, CommandName.LaunchDebugCLI, 'debug-cli');

    this.disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory('starlark', this));
    this.disposables.push(vscode.debug.registerDebugConfigurationProvider('starlark', this));
  }

  async shouldLaunch(e: Error): Promise<boolean> {
    return false;
  }

  async launchInternal(): Promise<void> { }

  async invoke(command: string, label: string): Promise<void> {
    const bazel = await this.bazelSettings.get();
    const debug = await this.settings.get();

    const action = await vscode.window.showInformationMessage(debugInfoMessage(), 'OK', 'Cancel');
    if (action !== 'OK') {
      return;
    }
    const args = [command, label];
    args.push(...bazel.buildFlags);
    args.push(...debug.serverFlags);

    return vscode.commands.executeCommand(CommandName.Invoke, args);
  }

  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();
    const bzlCfg = await this.bzlSettings.get();
    return {
      command: [bzlCfg.executable]
        .concat(cfg.cliCommand)
        .map(a => a.replace('${workspaceFolder}', this.workspaceFolder)),
      noHideOnReady: true,
    };
  }

  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {

    // if launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'bazel') {
        config.type = 'starlark';
        config.name = 'Attach to Starlark Debug Server';
        config.request = 'launch';
        config.stopOnEntry = true;
      }
    }

    // if (!config.program) {
    // 	return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
    // 		return undefined;	// abort launch
    // 	});
    // }

    return config;
  }


  /**
   * This hook is directly called after 'resolveDebugConfiguration' but with all variables substituted.
   * It can be used to resolve or verify a [debug configuration](#DebugConfiguration) by filling in missing values or by adding/changing/removing attributes.
   * If more than one debug configuration provider is registered for the same type, the 'resolveDebugConfigurationWithSubstitutedVariables' calls are chained
   * in arbitrary order and the initial debug configuration is piped through the chain.
   * Returning the value 'undefined' prevents the debug session from starting.
   * Returning the value 'null' prevents the debug session from starting and opens the underlying debug configuration instead.
   *
   * @param folder The workspace folder from which the configuration originates from or `undefined` for a folderless setup.
   * @param debugConfiguration The [debug configuration](#DebugConfiguration) to resolve.
   * @param token A cancellation token.
   * @return The resolved debug configuration or undefined or null.
   */
  resolveDebugConfigurationWithSubstitutedVariables?(folder: vscode.WorkspaceFolder | undefined, debugConfiguration: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    console.log('resolved', debugConfiguration);
    return debugConfiguration;
  }

  async createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): Promise<vscode.ProviderResult<vscode.DebugAdapterDescriptor>> {
    // param "executable" contains the executable optionally specified in the package.json (if any)
    const bzl = await this.bzlSettings.get();
    const cfg = await this.settings.get();

    // use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
    if (!executable) {
      const args = ["dap", "--address=localhost:3737"];
      const options = {
        cwd: this.workspaceFolder,
        env: { "VAR": "some value" }
      };
      executable = new vscode.DebugAdapterExecutable(bzl.executable, args, options);
    }

    // make VS Code launch the DA executable
    return executable;
  }
}

function debugInfoMessage(): string {
  return (
    'Running Bazel in debug mode blocks until a debug client attaches.  ' +
    "It is recommended to make changes to BUILD/bzl files in the area of interest to defeat Bazel's aggressive caching mechanism.  " +
    'Once the debug server has started, "Launch" the Debug CLI (hover over the "Usage" item for command help).  ' +
    'Once attached, you can set breakpoints (b [FILE:]LINE), continue (c), step (s), list threads (t), stack frames (f), locals/globals variables (l, g), and drill down into complex variables (v NUM).  ' +
    'Are you sure you want to continue?'
  );
}


// Debugger plan:
//
// 1. Move server.go into other package.
// 2. Add a client field to the struct (and a constructor)
// 3. Make Serve an method.
// 4. Implement Attach.