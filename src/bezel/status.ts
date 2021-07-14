import * as vscode from 'vscode';
import { ConnectivityState } from '@grpc/grpc-js/build/src/channel';
import { Settings } from './settings';

export enum Status {
    UNKNOWN = 'unknown',
    INITIAL = 'initial',
    CONFIGURING = 'configuring',
    STARTING = 'starting',
    READY = 'ready',
    STOPPING = 'stopping',
    STOPPED = 'stopped',
    LOADING = 'loading',
    ERROR = 'error',
}

export interface Runnable<T> {
    settings: Settings<T>
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

    constructor(public readonly settings: Settings<T>) {
        this.disposables.push(this._onDidChangeStatus);

        settings.onDidConfigurationChange(async () => {
            await this.stop();
            await this.start();
        }, this, this.disposables);

        settings.onDidConfigurationError(err => this.setError(err), this, this.disposables);
    }

    public get status(): Status {
        return this._status;
    }

    public get statusErrorMessage(): string | undefined {
        return this._statusError?.message;
    }

    protected setStatus(status: Status) {
        this._status = status;
        this._onDidChangeStatus.fire(status);
    }

    protected setStatusFromConnectivityState(state: ConnectivityState) {
        switch (state) {
            case ConnectivityState.IDLE:
                this.setStatus(Status.READY);
                break;
            case ConnectivityState.CONNECTING:
                this.setStatus(Status.LOADING);
                break;
            case ConnectivityState.READY:
                this.setStatus(Status.READY);
                break;
            case ConnectivityState.SHUTDOWN:
                this.setStatus(Status.STOPPED);
                break;
            default:
                this.setStatus(Status.UNKNOWN);
                break;
        }
    }

    protected setError(err: Error) {
        this._statusError = err;
        this.setStatus(Status.ERROR);
    }

    abstract start(): Promise<void>;
    abstract stop(): Promise<void>;

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables.length = 0;
    }
}
