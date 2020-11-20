import * as vscode from 'vscode';
import * as vlc from 'vscode-languageclient';
import { Server } from './constants';


/**
 * Client implementation to the Bzl Server Process.
 */
export class BzlServer implements vscode.Disposable, vscode.OutputChannel {
    /**
     * The human-readable name of this output channel.
     */
    readonly name: string = 'Bzl Server';

    private disposables: vscode.Disposable[] = [];
    private client: vlc.LanguageClient;

    // number of times the server has been restarted
    private restarts: number = 0;
    // the backing output channel
    private output: vscode.OutputChannel;
    // a string buffer that holds output content while the server is failing.
    private lastOutputBuffer = '';

    constructor(
        private onDidServerDoNotRestart: vscode.EventEmitter<string>,
        executable: string,
        command: string[],
    ) {
        this.output = vscode.window.createOutputChannel('Bzl Server');
        this.disposables.push(this.output);

        let serverOptions: vlc.ServerOptions = {
            command: executable,
            args: command,
        };

        let clientOptions: vlc.LanguageClientOptions = {
            // Register the server for all documents to keep it running
            documentSelector: [{ pattern: '**/*' }],
            errorHandler: this,
            outputChannel: this,
        };

        // Create the language client and start the client.
        this.client = new vlc.LanguageClient(
            Server.BinaryName,
            Server.Description,
            serverOptions,
            clientOptions
        );
    }

    public start() {
        this.disposables.push(this.client.start());
    }

    public async onReady(): Promise<void> {
        return this.client.onReady();
    }

    public getLanguageClientForTesting(): vlc.LanguageClient {
        return this.client;
    }

    /**
     * An error has occurred while writing or reading from the connection.
     *
     * @param error - the error received
     * @param message - the message to be delivered to the server if know.
     * @param count - a count indicating how often an error is received. Will
     *  be reset if a message got successfully send or received.
     */
    error(error: Error, message: vlc.Message, count: number): vlc.ErrorAction {
        // NOTE: for some reason the 'error' method is not being called.
        console.log(`vlc error: ${error.message} (count=${count})`, error, message);
        if (count < 5) {
            return vlc.ErrorAction.Continue;
        }
        return vlc.ErrorAction.Shutdown;
    }

    /**
     * The connection to the server got closed.
     */
    closed(): vlc.CloseAction {
        if (this.restarts++ < 3) {
            this.lastOutputBuffer = '';
            return vlc.CloseAction.Restart;
        }
        this.onDidServerDoNotRestart.fire(this.lastOutputBuffer.replace('\n', ''));
        return vlc.CloseAction.DoNotRestart;
    }

    public dispose() {
        if (this.client) {
            this.client.stop();
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

    /**
     * Append the given value to the channel.
     *
     * @param value A string, falsy values will not be printed.
     */
    append(value: string): void {
        if (this.restarts) {
            this.lastOutputBuffer += value;
        }
        this.output.append(value);
    }

    /**
     * Append the given value and a line feed character
     * to the channel.
     *
     * @param value A string, falsy values will be printed.
     */
    appendLine(value: string): void {
        this.output.appendLine(value);
    }

    /**
     * Removes all output from the channel.
     */
    clear(): void {
        this.output.clear();
    }

    show(columnOrPreserveFocus?: vscode.ViewColumn | boolean, preserveFocus?: boolean): void {
        this.output.show(preserveFocus);
    }

    /**
     * Hide this channel from the UI.
     */
    hide(): void {
        this.output.hide();
    }
}
