import * as vscode from 'vscode';
import { BazelConfiguration, BzlConfiguration, BzlSettings, StarlarkDebuggerConfiguration, StarlarkDebuggerSettings } from './configuration';
import { CommandName } from './constants';
import { Settings } from './settings';
import { LaunchableComponent, RunnableComponent, Status } from './status';


export class StarlarkDebugger extends LaunchableComponent<StarlarkDebuggerConfiguration> implements vscode.Disposable {

  constructor(
    public readonly settings: StarlarkDebuggerSettings,
    private readonly bazelSettings: Settings<BazelConfiguration>,
    public readonly bzlSettings: Settings<BzlConfiguration>,
    private readonly workspaceFolder: string,
  ) {
    super('SDB', settings, CommandName.LaunchDebugCLI, 'debug-cli');
  }

  async startInternal(): Promise<void> {
    this.setStatus(Status.STARTING);
    this.setStatus(Status.READY);
  }

  async stopInternal(): Promise<void> {
    this.setStatus(Status.STOPPED);
  }

  async invoke(command: string, label: string): Promise<void> {
    const bazel = await this.bazelSettings.get();
    const debug = await this.settings.get();

    const action = await vscode.window.showInformationMessage(
      debugInfoMessage(),
      'OK',
      'Cancel'
    );
    if (action !== 'OK') {
      return;
    }
    const args = [command, label];
    args.push(...bazel.buildFlags);
    args.push(...debug.serverFlags);

    this.handleCommandLaunch();

    return vscode.commands.executeCommand(CommandName.Invoke, args);
  }

  async getLaunchArgs(): Promise<string[]> {
    const cfg = await this.settings.get();
    const bzlCfg = await this.bzlSettings.get();
    return [bzlCfg.executable]
      .concat(cfg.cliCommand)
      .map(a => a.replace('${workspaceFolder}', this.workspaceFolder));
  }

}

function debugInfoMessage(): string {
  return "This will start the Bazel starlark debug server in one terminal and the debug client CLI in a second terminal.  Running the bazel server in starlark debug mode blocks all other operations and may require server shutdown to end the debug session.  It is recommended to make source code changes in the area of debugging interest to defeat Bazel's agressive incremental caching.   Are you sure you want to continue?";
}
