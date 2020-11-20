import * as cp from 'child_process';
import * as kill from 'tree-kill';
import * as vscode from 'vscode';
import { Logger } from '../logger';

const SERVER_LOGLEVEL_REGEX = /^\[([A-Z]+)\](.*)$/;
const DOWNLOAD_PROGRESS_CHAR = '.';
const BZL_LICENSE_EXPIRED_EXIT_CODE = 5;

export class BzlServer implements vscode.Disposable {
    private readonly _onDidStart: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    private readonly _onDidStop: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    private ready = false;
    private port: number | undefined;
    private restarting = false;
    private logger: Logger;
    private outputChannel: vscode.OutputChannel;

    public readonly onDidStart: vscode.Event<void> = this._onDidStart.event;
    public readonly onDidStop: vscode.Event<void> = this._onDidStop.event;

    private process?: cp.ChildProcessWithoutNullStreams;

    constructor(
        private onDidLicenseExpire: vscode.EventEmitter<void>,
        private executable: string,
        private command: string[],
    ) { 
        this.outputChannel = vscode.window.createOutputChannel('Bzl Server');
        this.logger = new Logger('bzl');
        this.logger.setLoggingChannel(this.outputChannel);
    }

    public async start(): Promise<void> {
        this.logger.debug('Starting server');
        this.logger.debug(`Bzl Server cmd: ${this.executable} ${this.command.join(' ')}`);
        const cwd = '.';

        this.process = cp.spawn(`"${this.executable}"`, this.command, {
            cwd,
            shell: true,
        });

        this.process.stdout.on('data', this.logOutput);
        this.process.stderr.on('data', this.logOutput);
        this.process
            .on('error', (err: Error) => this.logger.error(err.message))
            .on('exit', async (code) => {
                this.logger.warn('Bzl server stopped');
                this._onDidStop.fire();
                this.ready = false;
                this.process?.removeAllListeners();
                if (this.restarting) {
                    this.restarting = false;
                    await this.start();
                } else if (code !== 0) {
                    await this.handleServerStartError(code);
                }
            });

        this.fireOnStart();
    }

    public isReady(): boolean {
        return this.ready;
    }

    public async showRestartMessage(): Promise<void> {
        const OPT_RESTART = 'Restart Server';
        const input = await vscode.window.showErrorMessage(
            'No connection to bzl server. Try restarting the server.',
            OPT_RESTART
        );
        if (input === OPT_RESTART) {
            await this.start();
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private logOutput = (data: any): void => {
        const str = data.toString().trim();
        if (!str || str === DOWNLOAD_PROGRESS_CHAR) {
            return;
        }
        const logLevelMatches = str.match(SERVER_LOGLEVEL_REGEX);
        if (logLevelMatches && logLevelMatches.length) {
            const [, serverLogLevel, serverLogMessage] = logLevelMatches;
            const logLevel = serverLogLevel.toLowerCase() as
                | 'debug'
                | 'info'
                | 'warn'
                | 'error';
            this.logger[logLevel](serverLogMessage.trim());
        } else {
            this.logger.info(str);
        }
    };

    private killProcess(): void {
        if (this.process) {
            kill(this.process.pid, 'SIGTERM');
        }
    }

    private async handleServerStartError(code: number | null): Promise<void> {
        if (code === BZL_LICENSE_EXPIRED_EXIT_CODE) {
            this.onDidLicenseExpire.fire();
        }
        await this.showRestartMessage();
    }

    private fireOnStart(): void {
        this.ready = true;
        this._onDidStart.fire();
    }

    public stop(): void {
        this.process?.removeAllListeners();
        this.killProcess();
        this.ready = false;
    }

    public dispose(): void {
        this.stop();
        this.outputChannel.dispose();
        this._onDidStart.dispose();
        this._onDidStop.dispose();
    }

    public getPort(): number | undefined {
        return this.port;
    }

}




// import * as vscode from 'vscode';
// import * as vlc from 'vscode-languageclient';
// import { Server } from './constants';


// /**
//  * Child process for the Bzl Server.
//  */
// export class BzlServer implements vscode.Disposable, vscode.OutputChannel {
//     /**
//      * The human-readable name of this output channel.
//      */
//     readonly name: string = 'Bzl Server';

//     private disposables: vscode.Disposable[] = [];
//     private client: vlc.LanguageClient;

//     // number of times the server has been restarted
//     private restarts: number = 0;
//     // the backing output channel
//     private output: vscode.OutputChannel;
//     // a string buffer that holds output content while the server is failing.
//     private lastOutputBuffer = '';

//     constructor(
//         private onDidServerDoNotRestart: vscode.EventEmitter<string>,
//         executable: string,
//         command: string[],
//     ) {
//         this.output = vscode.window.createOutputChannel('Bzl Server');
//         this.disposables.push(this.output);

//         let serverOptions: vlc.ServerOptions = {
//             command: executable,
//             args: command,
//         };

//         let clientOptions: vlc.LanguageClientOptions = {
//             // Register the server for all documents to keep it running
//             documentSelector: [{ pattern: '**/*' }],
//             errorHandler: this,
//             outputChannel: this,
//         };

//         // Create the language client and start the client.
//         this.client = new vlc.LanguageClient(
//             Server.BinaryName,
//             Server.Description,
//             serverOptions,
//             clientOptions
//         );
//     }

//     public start() {
//         this.disposables.push(this.client.start());
//     }

//     public async onReady(): Promise<void> {
//         return this.client.onReady();
//     }

//     public getLanguageClientForTesting(): vlc.LanguageClient {
//         return this.client;
//     }

//     /**
//      * An error has occurred while writing or reading from the connection.
//      *
//      * @param error - the error received
//      * @param message - the message to be delivered to the server if know.
//      * @param count - a count indicating how often an error is received. Will
//      *  be reset if a message got successfully send or received.
//      */
//     error(error: Error, message: vlc.Message, count: number): vlc.ErrorAction {
//         // NOTE: for some reason the 'error' method is not being called.
//         console.log(`vlc error: ${error.message} (count=${count})`, error, message);
//         if (count < 5) {
//             return vlc.ErrorAction.Continue;
//         }
//         return vlc.ErrorAction.Shutdown;
//     }

//     /**
//      * The connection to the server got closed.
//      */
//     closed(): vlc.CloseAction {
//         if (this.restarts++ < 3) {
//             this.lastOutputBuffer = '';
//             // set a timer to reset the restart count after a 
//             return vlc.CloseAction.Restart;
//         }
//         this.onDidServerDoNotRestart.fire(this.lastOutputBuffer.replace('\n', ''));
//         return vlc.CloseAction.DoNotRestart;
//     }

//     public dispose() {
//         if (this.client) {
//             this.client.stop();
//         }
//         for (const disposable of this.disposables) {
//             disposable.dispose();
//         }
//     }

//     /**
//      * Append the given value to the channel.
//      *
//      * @param value A string, falsy values will not be printed.
//      */
//     append(value: string): void {
//         if (this.restarts) {
//             this.lastOutputBuffer += value;
//         }
//         this.output.append(value);
//     }

//     /**
//      * Append the given value and a line feed character
//      * to the channel.
//      *
//      * @param value A string, falsy values will be printed.
//      */
//     appendLine(value: string): void {
//         this.output.appendLine(value);
//     }

//     /**
//      * Removes all output from the channel.
//      */
//     clear(): void {
//         this.output.clear();
//     }

//     show(columnOrPreserveFocus?: vscode.ViewColumn | boolean, preserveFocus?: boolean): void {
//         this.output.show(preserveFocus);
//     }

//     /**
//      * Hide this channel from the UI.
//      */
//     hide(): void {
//         this.output.hide();
//     }
// }
