import * as vscode from 'vscode';
import { ActionExecuted } from '../proto/build_event_stream/ActionExecuted';
import { File } from '../proto/build_event_stream/File';
import { BazelBuildEvent } from './commandrunner';
import path = require('path');

/**
 * Runs a command and pipes the output to a channel.
 */
export class BuildEventProtocolDiagnostics implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
// getProvider(name: string): DiagnosticProvider | undefined {
//     return undefined;
// }

    private diagnosticsCollection = vscode.languages.createDiagnosticCollection('bep');

    constructor(
        onDidRecieveBazelBuildEvent: vscode.Event<BazelBuildEvent>
    ) {
        this.disposables.push(this.diagnosticsCollection);
        onDidRecieveBazelBuildEvent(this.handleBazelBuildEvent, this, this.disposables);
    }
    
    async handleBazelBuildEvent(e: BazelBuildEvent) {
        console.log(`handleBazelBuildEvent "${e.bes.payload}"`);
        switch (e.bes.payload) {
            case 'action':
                return this.handleActionExecutedEvent(e, e.bes.action!);
        }
    }

    async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
        console.log(`Handling action #${e.obe.sequenceNumber} "${action.type}"`);
        if (action.success) {
            return;
        }

        console.log(`Handling failed action #${e.obe.sequenceNumber} "${action.type}" ${action.stderr?.name}`);

        if (action.stderr) {
            this.handleActionExecutedEventFile(e, action, action.stderr);
        }
    }

    async handleActionExecutedEventFile(e: BazelBuildEvent, action: ActionExecuted, file: File) {
        console.log(`action file #${e.obe.sequenceNumber} "${action.type}"`);
        if (action.success) {
            return;
        }

        if (file.contents) {
            this.handleActionExecutedEventFileContents(action, file.contents);
        } else if (file.uri) {
            this.handleActionExecutedEventFileUri(action, file.uri);
        }
    }

    async handleActionExecutedEventFileContents(action: ActionExecuted, contents: string | Uint8Array | Buffer | undefined) {
    }

    async handleActionExecutedEventFileUri(action: ActionExecuted, uri: string) {
        console.log(`processing action file uri "${action.type}" ${uri}`);
        
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}

/**
 * Implementations should be capable of accepting an event such as
 * ActionExecuted and producing diagnostics
 */
interface DiagnosticProvider {
    handleEvent<T>(event: T, diagnostics: vscode.DiagnosticCollection, token: vscode.CancellationToken): Promise<void>;
}

interface DiagnosticProviderManager {
    getProvider(name: string): DiagnosticProvider | undefined;
}
