import * as vscode from 'vscode';
import {
  BazelConfiguration,
  BzlConfiguration,
  StarlarkDebuggerConfiguration,
  StarlarkDebuggerSettings,
} from './configuration';
import { CommandName } from './constants';
import { Settings } from './settings';
import { LaunchableComponent, LaunchArgs, Status } from './status';

export class StarlarkDebugger
  extends LaunchableComponent<StarlarkDebuggerConfiguration>
  implements vscode.Disposable
{
  constructor(
    public readonly settings: StarlarkDebuggerSettings,
    private readonly bazelSettings: Settings<BazelConfiguration>,
    public readonly bzlSettings: Settings<BzlConfiguration>,
    private readonly workspaceFolder: string
  ) {
    super('SDB', settings, CommandName.LaunchDebugCLI, 'debug-cli');
  }

  async shouldLaunch(e: Error): Promise<boolean> {
    return false;
  }

  async launchInternal(): Promise<void> {}

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
      showSuccessfulLaunchTerminal: true,
      showFailedLaunchTerminal: true,
    };
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
