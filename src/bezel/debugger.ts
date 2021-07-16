import * as vscode from 'vscode';
import { BzlSettings, StarlarkDebuggerConfiguration, StarlarkDebuggerSettings } from './configuration';
import { CommandName } from './constants';
import { RunnableComponent, Status } from './status';


export class StarlarkDebugger extends RunnableComponent<StarlarkDebuggerConfiguration> implements vscode.Disposable {
  private debugCLITerminal: vscode.Terminal | undefined;

  constructor(
    public readonly settings: StarlarkDebuggerSettings,
    public readonly bzlSettings: BzlSettings,
  ) {
    super(settings);

    this.disposables.push(vscode.commands.registerCommand(CommandName.LaunchDebugCLI, this.handleCommandLaunchDebugCLI, this));
  }

  async handleCommandLaunchDebugCLI(): Promise<void> {
    if (this.debugCLITerminal) {
      this.debugCLITerminal.show();
      return;
    }
    this.launchDebugCLITerminal();
  }

  async start(): Promise<void> {
    this.setStatus(Status.STARTING);
    this.setStatus(Status.READY);
  }

  async stop(): Promise<void> {
    this.setStatus(Status.STOPPED);
  }

  getOrCreateDebugCLITerminal(): vscode.Terminal {
    if (!this.debugCLITerminal) {
      this.debugCLITerminal = vscode.window.createTerminal('debug-cli');
      this.disposables.push(this.debugCLITerminal);
    }
    return this.debugCLITerminal;
  }

  async launchDebugCLITerminal(args = ['debug']) {
    const cfg = await this.bzlSettings.get();

    this.runInTerminal(this.getOrCreateDebugCLITerminal(), [
      cfg.executable,
      '--debug_working_directory=.',
    ].concat(args));
  }

  runInTerminal(terminal: vscode.Terminal, args: string[]): void {
    terminal.sendText(args.join(' '), true);
    terminal.show();
  }

  dispose() {
    super.dispose();
  }  
}
