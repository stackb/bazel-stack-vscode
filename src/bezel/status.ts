import { Stats } from 'fs';
import * as vscode from 'vscode';
import { Settings } from './settings';

export enum Status {
  UNKNOWN = 'unknown',
  DISABLED = 'disabled',
  INITIAL = 'initial',
  CONFIGURING = 'configuring',
  STARTING = 'starting',
  READY = 'ready',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  LAUNCHING = 'launching',
  FAILED = 'failed',
  ERROR = 'error',
}

export interface Runnable<T> {
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

export abstract class RunnableComponent<T> implements vscode.Disposable, Runnable<T> {
  protected disposables: vscode.Disposable[] = [];
  private _status: Status = Status.INITIAL;
  private _statusError: Error | undefined;

  _onDidChangeStatus: vscode.EventEmitter<Status> = new vscode.EventEmitter<Status>();
  readonly onDidChangeStatus: vscode.Event<Status> = this._onDidChangeStatus.event;

  constructor(public readonly name: string, public readonly settings: Settings<T>) {
    this.disposables.push(this._onDidChangeStatus);

    settings.onDidConfigurationChange(
      async () => {
        await this.restart();
      },
      this,
      this.disposables
    );

    settings.onDidConfigurationError(err => this.setError(err), this, this.disposables);
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
      this._status === Status.INITIAL;
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
    if (this._status === Status.DISABLED) {
      return;
    }
    return this.startInternal();
  }

  async stop(): Promise<void> {
    if (this._status === Status.DISABLED) {
      return;
    }
    return this.stopInternal();
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

export abstract class LaunchableComponent<T> extends RunnableComponent<T> {
  protected launchTerminal: vscode.Terminal | undefined;

  constructor(
    name: string,
    public readonly settings: Settings<T>,
    commandName: string,
    protected terminalName: string,
    private launchIntervalMs = 1000,
    private launchIterations = 10
  ) {
    super(name, settings);

    this.disposables.push(
      vscode.commands.registerCommand(commandName, this.handleCommandLaunch, this)
    );

    this.disposables.push(
      vscode.window.onDidOpenTerminal(terminal => {
        if (terminal.name === this.terminalName) {
          this.launchTerminal = terminal;
          this.disposables.push(terminal);
        }
      })
    );

    this.disposables.push(
      vscode.window.onDidCloseTerminal(terminal => {
        if (terminal.name === this.terminalName) {
          this.launchTerminal?.dispose();
          this.launchTerminal = undefined;
          setTimeout(() => {
            this.restart();
          }, 500);
        }
      })
    );
  }

  async restart() {
    await this.start();
  }

  abstract getLaunchArgs(): Promise<LaunchArgs>;

  async handleCommandLaunch(extraArgs: string[] = []): Promise<void> {
    if (this.launchTerminal) {
      this.launchTerminal.show();
      return;
    }

    const launch = await this.getLaunchArgs();
    const args = launch.command.concat(extraArgs);

    const terminal = this.getOrCreateTerminal();
    terminal.sendText(args.join(' '), true);
    terminal.show();

    this.setStatus(Status.LAUNCHING);

    let iteration = this.launchIterations;
    const timeout = setInterval(() => {
      iteration--;

      switch (this.status) {
        case Status.READY:
          clearTimeout(timeout);
          if (!launch.noHideOnReady) {
            this.launchTerminal?.hide();
          }
          return;
        default:
          console.info(`launch iteration ${iteration}`);
          if (iteration <= 0) {
            clearTimeout(timeout);
            this.setStatus(Status.FAILED);
            console.warn(
              `"${this.terminalName}" failed to launch.  Please check the terminal where it was started for more information.`
            );
            this.launchTerminal?.show();
            this.setError(new Error('Failed to start (timeout)'));
          } else {
            this.restart();
          }
      }
    }, this.launchIntervalMs);
  }

  getOrCreateTerminal(): vscode.Terminal {
    return vscode.window.createTerminal(this.terminalName);
  }
}
