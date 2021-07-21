import * as os from 'os';
import * as vscode from 'vscode';
import { ComponentConfiguration } from './configuration';
import { quote } from 'shell-quote';
import { Settings } from './settings';

export enum Status {
  UNKNOWN = 'unknown',
  DISABLED = 'disabled',
  INITIAL = 'initial',
  STARTING = 'starting',
  READY = 'ready',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  FAILED = 'failed',
  ERROR = 'error',
}

export interface Runnable<T extends ComponentConfiguration> {
  settings: Settings<T>;
  // Returns current status
  status: Status;
  // Error message if the status is 'ERROR'
  statusErrorMessage: string | undefined;
  // An event to listen for status changes
  onDidChangeStatus: vscode.Event<Status>;
  // a start function
  start(): Promise<void>;
  // a stop function
  stop(): Promise<void>;
}

export abstract class RunnableComponent<T extends ComponentConfiguration>
  implements vscode.Disposable, Runnable<T>
{
  protected disposables: vscode.Disposable[] = [];
  private _status: Status = Status.INITIAL;
  private _statusError: Error | undefined;

  _onDidChangeStatus: vscode.EventEmitter<Status> = new vscode.EventEmitter<Status>();
  readonly onDidChangeStatus: vscode.Event<Status> = this._onDidChangeStatus.event;

  constructor(public readonly name: string, public readonly settings: Settings<T>) {
    this.disposables.push(this._onDidChangeStatus);
    settings.onDidConfigurationChange(this.handleConfigurationChanged, this, this.disposables);
    settings.onDidConfigurationError(this.handleConfigurationError, this, this.disposables);
  }

  protected async handleConfigurationChanged(cfg: T) {
    await this.restart();
  }

  protected async handleConfigurationError(err: Error) {
    this.setError(err);
  }

  public get status(): Status {
    return this._status;
  }

  public get statusErrorMessage(): string | undefined {
    return this._statusError?.message;
  }

  protected addCommand(name: string, command: (...args: any) => any) {
    this.disposables.push(vscode.commands.registerCommand(name, command, this));
  }

  protected setDisabled(d: boolean) {
    if (d) {
      this.stop();
      this.setStatus(Status.DISABLED);
    } else {
      this._status = Status.INITIAL;
      this.restart();
    }
  }

  protected setStatus(status: Status) {
    if (this._status === status) {
      return;
    }
    if (this._status === Status.DISABLED) {
      console.log(`${this.name} skip status change (currently disabled) => ${status}`);
      return;
    }
    console.log(`${this.name} status change: ${this._status} => ${status}`);
    this._status = status;
    this._onDidChangeStatus.fire(status);
  }

  protected setError(err: Error) {
    this._statusError = err;
    this.setStatus(Status.ERROR);
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  async start(): Promise<void> {
    const cfg = await this.settings.get();
    if (!cfg.enabled) {
      this.setDisabled(true);
      return;
    }
    if (this.status === Status.DISABLED && cfg.enabled) {
      this.setDisabled(false);
      return;
    }
    this.setStatus(Status.STARTING);
    try {
      await this.startInternal();
      this.setStatus(Status.READY);
    } catch (e) {
      this.setError(e);
    }
  }

  async stop(): Promise<void> {
    if (this._status === Status.DISABLED) {
      return;
    }
    this.setStatus(Status.STOPPING);
    try {
      await this.stopInternal();
      this.setStatus(Status.STOPPED);
    } catch (e) {
      this.setError(e);
    }
  }

  abstract startInternal(): Promise<void>;
  abstract stopInternal(): Promise<void>;

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables.length = 0;
  }
}

export interface LaunchArgs {
  command: string[];
  noHideOnReady?: boolean;
}

export abstract class LaunchableComponent<
  T extends ComponentConfiguration
> extends RunnableComponent<T> {
  public terminal: vscode.Terminal | undefined;

  _onDidAttachTerminal: vscode.EventEmitter<vscode.Terminal> =
    new vscode.EventEmitter<vscode.Terminal>();
  readonly onDidAttachTerminal: vscode.Event<vscode.Terminal> = this._onDidAttachTerminal.event;

  constructor(
    name: string,
    public readonly settings: Settings<T>,
    commandName: string,
    protected terminalName: string,
    private launchIntervalMs = 500,
    private launchIterations = 25
  ) {
    super(name, settings);

    this.disposables.push(
      vscode.commands.registerCommand(commandName, this.handleCommandLaunch, this)
    );

    this.disposables.push(
      vscode.window.onDidCloseTerminal(t => {
        if (t.name !== this.terminalName) {
          return;
        }
        this.disposeTerminal();
        setTimeout(() => {
          this.restart();
        }, 500);
      })
    );

    this.disposables.push(
      vscode.window.onDidOpenTerminal(t => {
        if (t.name !== this.terminalName) {
          return;
        }
        this.attachTerminal(t);
      })
    );

    vscode.window.terminals.forEach(t => {
      if (t.name !== this.terminalName) {
        return;
      }
      this.attachTerminal(t);
    });
  }

  setDisabled(b: boolean) {
    super.setDisabled(b);
    if (b) {
      this.disposeTerminal();
      vscode.window.terminals.forEach(t => {
        if (t.name !== this.terminalName) {
          return;
        }
        t.dispose();
      });
    }
  }

  protected cleanFinishedTerminals() {
    vscode.window.terminals.forEach(t => {
      if (t.name !== this.terminalName) {
        return;
      }
      if (t.exitStatus === undefined) {
        return;
      }
      t.dispose();
    });
  }

  protected attachTerminal(t: vscode.Terminal) {
    if (t.exitStatus !== undefined) {
      t.dispose();
      return;
    }
    if (this.status === Status.DISABLED) {
      t.dispose();
      return;
    }
    if (this.terminal) {
      return;
    }
    this.terminal = t;
    this.disposables.push(t);
    this._onDidAttachTerminal.fire(t);
  }

  protected async handleConfigurationChanged(cfg: T) {
    super.handleConfigurationChanged(cfg);

    if (!cfg.enabled) {
      this.disposeTerminal();
    }
  }

  disposeTerminal() {
    this.terminal?.dispose();
    this.terminal = undefined;
  }

  async restart() {
    await this.start();

    // After started, cleanup any terminals that are not still running.
    vscode.window.terminals.forEach(t => {
      if (t.name !== this.terminalName) {
        return;
      }
      if (t.exitStatus === undefined) {
        return;
      }
      t.dispose();
    });
  }

  async startInternal() {
    try {
      await this.launchInternal();
    } catch (e) {
      if (await this.shouldLaunch(e)) {
        this.handleCommandLaunch();
      } else {
        throw e;
      }
    }
  }

  async stopInternal(): Promise<void> {
    this.disposeTerminal();
  }

  abstract shouldLaunch(e: Error): Promise<boolean>;
  abstract launchInternal(): Promise<void>;
  abstract getLaunchArgs(): Promise<LaunchArgs>;

  async handleCommandLaunch(extraArgs: string[] = []): Promise<void> {
    if (this.terminal) {
      this.terminal.show();
      return;
    }

    console.log(`Launching terminal "${this.terminalName}"...`);

    const launch = await this.getLaunchArgs();
    const args = launch.command.concat(extraArgs);

    const terminal = vscode.window.createTerminal(this.terminalName);
    this.terminal = terminal;

    let command = '';
    if (os.platform() === 'win32') {
      command = args.join(' ');
    } else {
      command = quote(args);
    }
    terminal.sendText(command, true);
    terminal.show();

    this.setStatus(Status.STARTING);

    let iteration = this.launchIterations;
    const timeout = setInterval(async () => {
      try {
        await this.launchInternal();
        clearTimeout(timeout);
        this.handleLaunchSuccess(launch, terminal);
      } catch (err) {
        if (--iteration <= 0) {
          clearTimeout(timeout);
          this.handleLaunchFailed(launch, terminal);
          return;
        }
      }
    }, this.launchIntervalMs);
  }

  handleLaunchSuccess(launchArgs: LaunchArgs, terminal: vscode.Terminal) {
    this.setStatus(Status.READY);
    this.cleanFinishedTerminals();
    if (launchArgs.noHideOnReady) {
      return;
    }
    this.terminal?.hide();
  }

  handleLaunchFailed(launchArgs: LaunchArgs, terminal: vscode.Terminal) {
    console.warn(
      `"${this.terminalName}" failed to launch.  Please check the terminal where it was started for more information.`
    );
    this.setError(new Error('Failed to start (timeout)'));
    this.terminal?.show();
  }
}
