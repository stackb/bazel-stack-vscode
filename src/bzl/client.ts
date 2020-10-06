import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions
} from 'vscode-languageclient';
import { Server } from './constants';


/**
 * Client implementation to the Bzl Server Process.
 */
export class BzlServerProcess implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private client: LanguageClient;

    constructor(executable: string, command: string[]) {
        let serverOptions: ServerOptions = {
            command: executable,
            args: command,
        };

        let clientOptions: LanguageClientOptions = {
            // Register the server for all documents to keep it running
            documentSelector: [{ pattern: '**/*' }]
        };

        // Create the language client and start the client.
        this.client = new LanguageClient(
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

    public getLanguageClientForTesting(): LanguageClient {
        return this.client;
    }

    public dispose() {
        if (this.client) {
            this.client.stop();
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

}
