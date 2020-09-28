import { URL } from 'url';
import * as vscode from 'vscode';
import { IMarker, IMarkerService, MarkerSeverity } from '../common/markers';
import { MarkerService } from '../common/markerService';
import { IProblemMatcherRegistry, LineDecoder, ProblemMatcher, StartStopProblemCollector } from '../common/problemMatcher';
import * as Strings from '../common/strings';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { ActionExecuted } from '../proto/build_event_stream/ActionExecuted';
import { BuildStarted } from '../proto/build_event_stream/BuildStarted';
import { File } from '../proto/build_event_stream/File';
import { BazelBuildEvent } from './commandrunner';
import path = require('path');
import fs = require('fs');
import os = require('os');

/**
 * Derive vscode diagnostics from the BEP.
 */
export class BuildEventProtocolDiagnostics implements vscode.Disposable {
    static readonly CollectionName = 'bazel';

    private disposables: vscode.Disposable[] = [];
    private markerService = new MarkerService();
    private buildStarted: BuildStarted | undefined;
    private diagnostics: vscode.DiagnosticCollection | undefined;

    constructor(
        protected problemMatcherRegistry: IProblemMatcherRegistry,
        onDidCommandRun: vscode.Event<RunRequest>,
        onDidRecieveBazelBuildEvent: vscode.Event<BazelBuildEvent>,
    ) {
        this.disposables.push(this.markerService);
        this.markerService.onMarkerChanged(uris => {
            console.log('markers changed', uris);
        });
        onDidCommandRun(this.handleCommandRun, this, this.disposables);
        onDidRecieveBazelBuildEvent(this.handleBazelBuildEvent, this, this.disposables);
    }

    provideUri(path: string): vscode.Uri {
        if (this.buildStarted) {
            // TODO: will this work on windows?
            path = path.replace('/${workspaceRoot}', this.buildStarted.workspaceDirectory!);
        }
        return vscode.Uri.file(path);
    }

    async handleCommandRun(request: RunRequest) {
        this.recreateDiagnostics();
    }

    recreateDiagnostics(): vscode.DiagnosticCollection {
        if (this.diagnostics) {
            this.diagnostics.clear();
            this.diagnostics.dispose();    
        }
        const collection = vscode.languages.createDiagnosticCollection(
            BuildEventProtocolDiagnostics.CollectionName);
        return this.diagnostics = collection;
    }

    async handleBazelBuildEvent(e: BazelBuildEvent) {
        switch (e.bes.payload) {
            case 'started':
                return this.handleBuildStartedEvent(e, e.bes.started!);
            case 'action':
                return this.handleActionExecutedEvent(e, e.bes.action!);
        }
    }

    async handleBuildStartedEvent(e: BazelBuildEvent, started: BuildStarted) {
        this.diagnostics?.clear();
        this.buildStarted = started;
    }

    async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
        if (action.success) {
            return;
        }

        console.log(`Failed action #${e.obe.sequenceNumber} "${action.type}"`);

        if (action.stderr) {
            this.handleFile(action.type!, action.stderr);
        }
        if (action.stdout) {
            this.handleFile(action.type!, action.stdout);
        }
    }

    async handleFile(type: string, file: File) {
        const matcher = this.problemMatcherRegistry.get(type);
        if (!matcher) {
            return;
        }
        matcher.uriProvider = this.provideUri.bind(this);

        if (file.contents) {
            this.handleFileContents(type, matcher, file.contents);
        } else if (file.uri) {
            this.handleFileUri(type, matcher, file.uri);
        }
    }

    async handleFileContents(type: string, matcher: ProblemMatcher, contents: string | Uint8Array | Buffer | undefined) {
    }

    async handleFileUri(type: string, matcher: ProblemMatcher, uri: string) {
        console.log(`processing action file uri "${type}" ${uri}`);
        const url = new URL(uri);

        // TODO: support bytestream URIs
        const data = fs.readFileSync(url);

        const byResource = await parseProblems(matcher, data, this.markerService);

        byResource.forEach((markers, uri) => {
            this.diagnostics?.set(uri, markers.map(marker => createDiagnosticFromMarker(marker)));
        });
    }

    public dispose() {
        if (this.diagnostics) {
            this.diagnostics.dispose();
            this.diagnostics = undefined;
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}

export async function parseProblems(matcher: ProblemMatcher, data: Buffer, markerService: IMarkerService): Promise<Map<vscode.Uri, IMarker[]>> {
    const decoder = new LineDecoder();

    const collector = new StartStopProblemCollector([matcher], markerService);

    const processLine = async (line: string) => {
        line = Strings.removeAnsiEscapeCodes(line);
        return collector.processLine(line);
    };

    for (const line of decoder.write(data)) {
        await processLine(line);
    }
    // decoder.write(data).forEach(async (line) => await processLine(line));
    let line = decoder.end();
    if (line) {
        await processLine(line);
    }

    collector.done();

    collector.dispose();

    const markers = markerService.read({});
    const byResource = new Map<vscode.Uri, IMarker[]>();
    
    for (const marker of markers) {
        if (!marker.resource) {
            console.log('skipping marker without a resource?', marker);
            continue;
        }
        let items = byResource.get(marker.resource);
        if (!items) {
            items = [];
            byResource.set(marker.resource, items);
        }
        items.push(marker);
    }

    return byResource;
}

function createDiagnosticFromMarker(marker: IMarker): vscode.Diagnostic {
    const severity = MarkerSeverity.toDiagnosticSeverity(marker.severity);
    const start = new vscode.Position(marker.startLineNumber - 1, marker.startColumn - 1);
    const end = new vscode.Position(marker.endLineNumber - 1, marker.endColumn - 1);
    const range = new vscode.Range(start, end);
    return new vscode.Diagnostic(range, marker.message, severity);
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


// class MyMarkerService {
//     private _onMarkerChanged = new vscode.EventEmitter<readonly vscode.Uri[]>();

//     constructor() {
//         this.onMarkerChanged = this._onMarkerChanged.event;
//     }

// 	changeOne(owner: string, resource: vscode.Uri, markers: IMarkerData[]): void {
//         console.log(`changeOne ${owner} ${resource}`, markers);
//     }

// 	changeAll(owner: string, data: IResourceMarker[]): void {
//         console.log(`changeAll ${owner}`, data);
//     }

// 	remove(owner: string, resources: vscode.Uri[]): void {
//         console.log(`remove ${owner}`, resources);
//     }

// 	read(filter?: { owner?: string; resource?: vscode.Uri; severities?: number, take?: number; }): IMarker[] {
//         console.log('read', filter);
//         return [];
//     }

// 	readonly onMarkerChanged: vscode.Event<readonly vscode.Uri[]>;
// }
