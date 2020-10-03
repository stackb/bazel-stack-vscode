import * as filesize from 'filesize';
import * as fs from 'graceful-fs';
import * as path from 'path';
import { URL } from 'url';
import * as vscode from 'vscode';
import { markers, markerService, problemMatcher, strings } from 'vscode-common';
import { BuiltInCommands } from '../../constants';
import { downloadAsset } from '../../download';
import { FileKind } from '../../proto/build/stack/bezel/v1beta1/FileKind';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { ActionExecuted } from '../../proto/build_event_stream/ActionExecuted';
import { _build_event_stream_BuildEventId_NamedSetOfFilesId as NamedSetOfFilesId } from '../../proto/build_event_stream/BuildEventId';
import { BuildFinished } from '../../proto/build_event_stream/BuildFinished';
import { BuildStarted } from '../../proto/build_event_stream/BuildStarted';
import { File } from '../../proto/build_event_stream/File';
import { NamedSetOfFiles } from '../../proto/build_event_stream/NamedSetOfFiles';
import { TargetComplete } from '../../proto/build_event_stream/TargetComplete';
import { TargetConfigured } from '../../proto/build_event_stream/TargetConfigured';
import { TestResult } from '../../proto/build_event_stream/TestResult';
import { WorkspaceConfig } from '../../proto/build_event_stream/WorkspaceConfig';
import { FailureDetail } from '../../proto/failure_details/FailureDetail';
import { BzlClient } from '../bzlclient';
import { BazelBuildEvent } from '../commandrunner';
import { bazelSvgIcon, bazelWireframeSvgIcon, ButtonName, CommandName, ContextValue, DiagnosticCollectionName, ruleClassIconUri, ThemeIconDebugStackframe, ThemeIconDebugStackframeFocused, ThemeIconReport, ThemeIconSymbolEvent, ThemeIconSymbolInterface, ViewName } from '../constants';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BuildEventProtocolView extends BzlClientTreeDataProvider<BazelBuildEventItem> {

    private items: BazelBuildEventItem[] = [];
    private testsPassed: TestResult[] = [];
    private state = new BuildEventState();
    private problemCollector: ProblemCollector;

    constructor(
        protected problemMatcherRegistry: problemMatcher.IProblemMatcherRegistry,
        onDidChangeBzlClient: vscode.Event<BzlClient>,
        onDidRecieveBazelBuildEvent: vscode.Event<BazelBuildEvent>
    ) {
        super(ViewName.BEP, onDidChangeBzlClient);

        onDidRecieveBazelBuildEvent(this.handleBazelBuildEvent, this, this.disposables);

        this.disposables.push(this.problemCollector = new ProblemCollector(
            problemMatcherRegistry,
        ));
    }

    registerCommands() {
        // super.registerCommands(); // explicitly skipped as we don't need a 'refresh' command
        this.addCommand(CommandName.BEPActionStderr, this.handleCommandActionStderr);
        this.addCommand(CommandName.BEPActionStdout, this.handleCommandActionStdout);
        this.addCommand(CommandName.BEPActionOutput, this.handleCommandPrimaryOutputFile);
        this.addCommand(CommandName.BEPStartedExplore, this.handleCommandStartedExplore);
        this.addCommand(CommandName.BEPFileDownload, this.handleCommandFileDownload);
        this.addCommand(CommandName.BEPFileSave, this.handleCommandFileSave);
    }

    async handleCommandFileDownload(item: FileItem): Promise<void> {
        const client = this.client;
        if (!client) {
            return;
        }
        const response = await client.downloadFile(
            this.state.createWorkspace(), FileKind.EXTERNAL, item.file.uri!);
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${client.httpURL()}${response.uri}`));
    }

    async handleCommandFileSave(item: FileItem): Promise<void> {
        const client = this.client;
        if (!client) {
            return;
        }
        const response = await client.downloadFile(
            this.state.createWorkspace(), FileKind.EXTERNAL, item.file.uri!);
        const hostDir = client.address.replace(':', '-');
        const relname = path.join('bazel-out', hostDir, item.file.name!);
        let rootDir = this.state.workspaceInfo?.localExecRoot!;
        if (!fs.existsSync(rootDir)) {
            rootDir = vscode.workspace.rootPath || '.';
        }
        const filename = path.join(rootDir, relname);
        const url = `${client.httpURL()}${response.uri}`;
        const humanSize = filesize(Long.fromValue(response.size!).toNumber());
        try {
            await vscode.window.withProgress<void>({
                location: vscode.ProgressLocation.Notification,
                title: `Downloading ${path.basename(relname)} (${humanSize})`,
                cancellable: true,
            }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {
                return downloadAsset(url, filename, response.mode!, response.sha256);
            });
        } catch (e) {
            vscode.window.showErrorMessage(e instanceof Error ? e.message : e);
            return;
        }
        const selection = await vscode.window.showInformationMessage(
            `Saved ${relname} (${humanSize})`,
            ButtonName.Reveal,
        );
        if (selection === ButtonName.Reveal) {
            return vscode.commands.executeCommand(BuiltInCommands.RevealFileInOS, vscode.Uri.file(filename));
        }
    }

    async handleCommandStartedExplore(item: BuildStartedItem): Promise<void> {
        if (!(item instanceof BuildStartedItem)) {
            return;
        }
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`${this.client?.httpURL()}/stream/${item.event.bes.started?.uuid}`));
    }

    async handleCommandActionStderr(item: ActionFailedItem): Promise<void> {
        if (!(item instanceof ActionFailedItem)) {
            return;
        }
        return this.openFile(item.event.bes.action?.stderr);
    }

    async handleCommandActionStdout(item: ActionFailedItem): Promise<void> {
        if (!(item instanceof ActionFailedItem)) {
            return;
        }
        return this.openFile(item.event.bes.action?.stdout);
    }

    async handleCommandPrimaryOutputFile(item: BazelBuildEventItem): Promise<void> {
        const file = item.getPrimaryOutputFile();
        if (!file) {
            return;
        }
        return this.openFile(file);
    }

    async openFile(file: File | undefined): Promise<void> {
        if (!(file && file.uri)) {
            return;
        }
        return vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(file.uri));
    }

    clear(): void {
        this.items.length = 0;
        this.testsPassed.length = 0;
        this.state.reset();
        this.problemCollector.clear();
    }

    addItem(item: BazelBuildEventItem) {
        this.items.push(item);
        this.refresh();
    }

    replaceLastItem(item: BazelBuildEventItem) {
        this.items[this.items.length - 1] = item;
        this.refresh();
    }

    getTreeItem(element: BazelBuildEventItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BazelBuildEventItem): Promise<BazelBuildEventItem[] | undefined> {
        if (element) {
            return element.getChildren();
        }
        return this.getRootItems();
    }

    async getRootItems(): Promise<BazelBuildEventItem[] | undefined> {
        return this.items;
    }

    async handleBazelBuildEvent(e: BazelBuildEvent) {
        switch (e.bes.payload) {
            case 'started':
                return this.handleStartedEvent(e, e.bes.started!);
            case 'workspaceInfo':
                return this.handleWorkspaceInfoEvent(e, e.bes.workspaceInfo!);
            case 'action':
                return this.handleActionExecutedEvent(e, e.bes.action!);
            case 'namedSetOfFiles':
                return this.handleNamedSetOfFilesEvent(e);
            case 'configured':
                return this.handleTargetConfiguredEvent(e);
            case 'completed':
                return this.handleCompletedEvent(e, e.bes.completed!);
            case 'finished':
                return this.handleFinishedEvent(e, e.bes.finished!);
            case 'testResult':
                return this.handleTestResultEvent(e, e.bes.testResult!);
            default:
            // console.log(`skipping "${e.bes.payload}"`);
        }
    }

    async handleStartedEvent(e: BazelBuildEvent, started: BuildStarted) {
        this.clear();
        this.state.started = started;
        this.problemCollector.started = started;
        this.addItem(new BuildStartedItem(e));
    }

    async handleWorkspaceInfoEvent(e: BazelBuildEvent, workspaceInfo: WorkspaceConfig) {
        this.state.workspaceInfo = workspaceInfo;
    }

    async handleCompletedEvent(e: BazelBuildEvent, completed: TargetComplete) {
        this.addItem(new TargetCompleteItem(e, this.state));
    }

    async handleFinishedEvent(e: BazelBuildEvent, finished: BuildFinished) {
        this.items = this.items.filter(item => item.attention);
        if (finished.overallSuccess) {
            this.addItem(new BuildSuccessItem(e, this.state.started));
        } else {
            this.addItem(new BuildFailedItem(e, this.state.started));
        }
    }

    handleNamedSetOfFilesEvent(e: BazelBuildEvent) {
        this.state.handleNamedSetOfFiles(e);
    }

    handleTargetConfiguredEvent(e: BazelBuildEvent) {
        this.state.handleTargetConfigured(e);
    }

    async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
        if (action.success) {
            return this.handleActionExecutedEventSuccess(e, action);
        }
        this.addItem(new ActionFailedItem(e, this.problemCollector));
    }

    async handleActionExecutedEventSuccess(e: BazelBuildEvent, action: ActionExecuted) {
        const item = new ActionSuccessItem(e);
        if (this.items[this.items.length - 1] instanceof ActionSuccessItem) {
            this.replaceLastItem(item);
        } else {
            this.addItem(item);
        }
    }

    async handleTestResultEvent(e: BazelBuildEvent, test: TestResult) {
        if (test.status === 'PASSED') {
            this.testsPassed.push(test);
            this.addItem(new TestResultItem(e));
            return;
        }
        this.addItem(new TestResultFailedItem(e));
    }

}


export class BazelBuildEventItem extends vscode.TreeItem {
    
    constructor(
        public readonly event: BazelBuildEvent,
        public label?: string,
    ) {
        super(label || event.bes.payload!);
        this.tooltip = `#${event.obe.sequenceNumber} ${event.bes.payload}`;
        this.contextValue = event.bes.payload;

        // this.iconPath = stackbSvg;
        // this.command = {
        //     title: 'Open Primary Output File',
        //     command: BuildEventProtocolView.commandPrimaryOutputFile,
        //     arguments: [this],
        // };
    }

    /**
     * This flag is used to filter events the end of a build to indicate if it
     * requires attention by the user.
     */
    get attention(): boolean {
        return false;
    }
    
    getPrimaryOutputFile(): File | undefined {
        return undefined;
    }

    async getChildren(): Promise<BazelBuildEventItem[] | undefined> {
        return undefined;
    }
}

export class BuildStartedItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
    ) {
        // super(event, `Started bazel ${event.bes.started?.buildToolVersion}`);
        super(event, 'Started');
        this.description = `${event.bes.started?.command} ${event.bes.started?.optionsDescription}`;
        this.tooltip = this.description;
        this.iconPath = bazelSvgIcon;
    }

    get attention(): boolean {
        return true;
    }
}


export class BuildFinishedItem extends BazelBuildEventItem {
    protected timeDelta: Long | undefined;
    constructor(
        event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, 'Finished');
        const end = Long.fromValue(event.bes.finished?.finishTimeMillis!);
        const start = Long.fromValue(started?.startTimeMillis!);
        try {
            this.timeDelta = end.sub(start);
        } catch (e) {
            console.warn(`Could not compute timeDelta ${end}, ${start}`);
        }
        let elapsed = '';
        if (this.timeDelta) {
            elapsed = `(${this.timeDelta?.toString()}ms)`;
        }
        this.description = `${event.bes.finished?.exitCode?.name} ${elapsed}`;
    }

    get attention(): boolean {
        return true;
    }
}

export class BuildSuccessItem extends BuildFinishedItem {
    constructor(
        event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, started);
        this.iconPath = bazelSvgIcon;
    }
}

export class BuildFailedItem extends BuildFinishedItem {
    constructor(
        event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, started);
        this.iconPath = bazelWireframeSvgIcon;
    }
}

export class ActionExecutedItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.action?.type} action`);
        this.description = `${event.bes.action?.label || ''}`;
        this.tooltip = event.bes.action?.commandLine?.join(' ');
        this.iconPath = ThemeIconSymbolEvent;
    }

    getPrimaryOutputFile(): File | undefined {
        if (this.event.bes.action?.stderr) {
            return this.event.bes.action?.stderr;
        }
        return this.event.bes.action?.stdout;
    }
}

export class ActionFailedItem extends ActionExecutedItem {
    private problems: FileProblems;

    constructor(
        event: BazelBuildEvent,
        public readonly problemCollector: ProblemCollector,
    ) {
        super(event);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }

    get attention(): boolean {
        return true;
    }

    async getChildren(): Promise<BazelBuildEventItem[] | undefined> {
        const problems = this.problems = await this.problemCollector.actionProblems(this.event.bes.action!);
        if (!problems) {
            this.collapsibleState = vscode.TreeItemCollapsibleState.None;
            return undefined;
        }
        const children: BazelBuildEventItem[] = [];
        const seen = new Set<string>();
        problems.forEach((markers, uri) => {
            const uriString = uri.toString();
            if (!seen.has(uriString)) {
                seen.add(uriString);
                const label = this.problemCollector.asRelativePath(uri.fsPath);
                children.push(new ProblemFileItem(this.event, label, uri, markers));
            }
        });
        return children;
    }
}

export class ActionSuccessItem extends ActionExecutedItem {
    constructor(
        event: BazelBuildEvent,
    ) {
        super(event);
    }
}

export class TestResultItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.testResult?.status}`);
        this.description = `${event.bes.testResult?.cachedLocally ? '(cached) ' : ''}${event.bes.id?.testResult?.label || ''} ${event.bes.testResult?.statusDetails || ''}`;
        this.iconPath = event.bes.testResult?.cachedLocally ? ThemeIconDebugStackframeFocused : ThemeIconDebugStackframeFocused;
    }

    get attention(): boolean {
        return !this.event.bes.testResult?.cachedLocally;
    }

    getPrimaryOutputFile(): File | undefined {
        for (const file of this.event.bes.testResult?.testActionOutput!) {
            if (!file) {
                continue;
            }
            if (file.name === 'test.log') {
                return file;
            }
        }
        return undefined;
    }
}

export class TestResultFailedItem extends TestResultItem {
    constructor(
        event: BazelBuildEvent,
    ) {
        super(event);
        this.iconPath = ThemeIconDebugStackframe;
    }

    get attention(): boolean {
        return true;
    }
}

export class TargetCompleteItem extends BazelBuildEventItem {
    private outputs: FileItem[] | undefined;

    constructor(
        event: BazelBuildEvent,
        private readonly state: BuildEventState,
    ) {
        super(
            event, 
            `${state.getTargetKind(event)}${event.bes.completed?.success ? '' : ' failed'} `,
        );
        this.description = `${event.bes.id?.targetCompleted?.label}`;
        this.iconPath = state.getTargetIcon(event, event.bes.completed!);
        this.collapsibleState = event.bes.completed?.success ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
    }

    get attention(): boolean {
        return this.state.started?.command === 'build';
    }

    async getChildren(): Promise<BazelBuildEventItem[] | undefined> {
        const detail = this.event.bes.completed?.failureDetail;
        if (detail) {
            return this.getFailureDetailItems(detail);
        }
        
        if (!this.outputs) {
            this.outputs = [];
            const files = new Set<File>();
            for (const group of this.event.bes?.completed?.outputGroup || []) {
                this.state.collectFilesFromFileSetIds(group.fileSets, files);
            }
            files.forEach(file => {
                this.outputs?.push(new FileItem(this.event, file));
            });
        }
        return this.outputs;
    }

    getFailureDetailItems(detail: FailureDetail): BazelBuildEventItem[] {
        const items: BazelBuildEventItem[] = [];
        items.push(new FailureDetailItem(this.event, detail));
        return items;
    }

    getPrimaryOutputFile(): File | undefined {
        for (const file of this.event.bes?.completed?.importantOutput || []) {
            return file;
        }
        return undefined;
    }
}

export class FileItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
        public readonly file: File,
    ) {
        super(event, path.basename(file.name!));
        this.description = `${file.name}`;
        this.iconPath = vscode.ThemeIcon.File;
        if (file.uri) {
            this.resourceUri = vscode.Uri.parse(file.uri);
        }
        this.contextValue = 'file';
        this.command = {
            title: 'Download File',
            command: BuiltInCommands.Open,
            arguments: [this.resourceUri],
        };
    }
}

export class ProblemFileItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
        public readonly desc: string,
        public readonly uri: vscode.Uri,
        public readonly markers: markers.IMarker[],
    ) {
        super(event, `${path.basename(uri.fsPath!)}`);
        this.description = desc;
        this.resourceUri = uri;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.contextValue = ContextValue.ProblemFile;
    }

    async getChildren(): Promise<BazelBuildEventItem[] | undefined> {
        return this.markers.map(marker => new FileMarkerItem(this.event, this.uri, marker));
    }
}

export class FileMarkerItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
        public readonly uri: vscode.Uri,
        public readonly marker: markers.IMarker,
    ) {
        super(event, undefined);
        this.label = '';
        this.description = `${marker.message} [${marker.startLineNumber}, ${marker.startColumn}]`;
        this.iconPath = new vscode.ThemeIcon(markers.MarkerSeverity.toThemeIconName(marker.severity));
        this.contextValue = ContextValue.ProblemFileMarker;
        this.command = {
            title: 'Open File',
            command: BuiltInCommands.Open,
            arguments: [uri.with({ fragment: `${marker.startLineNumber},${marker.startColumn}` })],
        };
    }
}

export class FailureDetailItem extends BazelBuildEventItem {
    constructor(
        event: BazelBuildEvent,
        public readonly detail: FailureDetail,
    ) {
        super(event, 'Failed');
        this.description = `${detail.message} (${detail.category})`;
        this.iconPath = ThemeIconReport;
    }
}

class BuildEventState {
    private fileSets = new Map<string, NamedSetOfFiles>();
    private targetsConfigured = new Map<string, TargetConfigured>();
    public workspaceInfo: WorkspaceConfig | undefined;
    public started: BuildStarted | undefined;

    constructor() {
    }
    
    handleNamedSetOfFiles(event: BazelBuildEvent) {
        const id = event.bes.id?.namedSet;
        const fileSet = event.bes.namedSetOfFiles;
        this.fileSets.set(id?.id!, fileSet!);
    }

    handleTargetConfigured(event: BazelBuildEvent) {
        const id = event.bes.id?.targetConfigured;
        const configured = event.bes.configured;
        this.targetsConfigured.set(id?.label!, configured!);
    }

    reset() {
        this.fileSets.clear();
        this.workspaceInfo = undefined;
        this.started = undefined;
    }

    collectFilesFromFileSet(fileSet: NamedSetOfFiles | undefined, files: Set<File>) {
        if (!fileSet) {
            return undefined;
        }
        for (const file of fileSet.files || []) {
            files.add(file);
        }
        this.collectFilesFromFileSetIds(fileSet.fileSets, files);
    }

    collectFilesFromFileSetId(id: NamedSetOfFilesId | undefined, files: Set<File>) {
        if (!id) {
            return;
        }
        this.collectFilesFromFileSet(this.fileSets.get(id.id!), files);
    }

    collectFilesFromFileSetIds(ids: NamedSetOfFilesId[] | undefined, files: Set<File>) {
        if (!ids) {
            return;
        }
        for (const id of ids) {
            this.collectFilesFromFileSetId(id, files);
        }
    }

    /**
     * Convenience method to create a Workspace object from the current bes
     * state.
     */
    createWorkspace(): Workspace {
        return {
            cwd: this.started?.workingDirectory
        };
    }

    getTargetKind(event: BazelBuildEvent): string | undefined {
        const label = event.bes.id?.targetCompleted?.label!;
        const configured = this.targetsConfigured.get(label);
        if (!configured) {
            return undefined;
        }
        let kind = configured.targetKind;
        return kind;
    }

    getTargetIcon(event: BazelBuildEvent, completed: TargetComplete): vscode.Uri | vscode.ThemeIcon {
        let kind = this.getTargetKind(event);
        if (kind?.endsWith(' rule')) {
            kind = kind.slice(0, kind.length - 5);
            return ruleClassIconUri(kind);
        }
        return ThemeIconSymbolInterface;
    }

}

type FileProblems = Map<vscode.Uri, markers.IMarker[]> | undefined;

class ProblemCollector implements vscode.Disposable {
    // our dx collection
    private diagnostics: vscode.DiagnosticCollection;
    // required be framework
    private markerService = new markerService.MarkerService();
    // a set of URI strings that have already been drawn as tree item nodes,
    // used as a hacky way to deduplicate information.  TODO: remove this.
    public rendered: Set<string> = new Set();
    // the started event, needed for the workspace cwd.
    public started: BuildStarted | undefined;
    
    constructor(
        protected problemMatcherRegistry: problemMatcher.IProblemMatcherRegistry,
    ) {
        this.diagnostics = this.recreateDiagnostics();
    }

    clear() {
        this.recreateDiagnostics();
        this.rendered.clear();
        this.started = undefined;
    }
    
    recreateDiagnostics(): vscode.DiagnosticCollection {
        if (this.diagnostics) {
            this.diagnostics.clear();
            this.diagnostics.dispose();
        }
        return this.diagnostics = 
            vscode.languages.createDiagnosticCollection(DiagnosticCollectionName.Bazel);
    }

    provideUri(path: string): vscode.Uri {
        if (this.started) {
            // TODO: will this work on windows?
            path = path.replace('/${workspaceRoot}', this.started.workspaceDirectory!);
        }
        return vscode.Uri.file(path);
    }

    asRelativePath(filename: string): string {
        if (filename.startsWith(this.started?.workingDirectory!)) {
            filename = filename.slice(this.started?.workingDirectory!.length! + 1);
        }
        return filename;
    }
    
    async actionProblems(action: ActionExecuted): Promise<FileProblems> {
        if (action.success) {
            return undefined;
        }

        const problems = new Map<vscode.Uri,markers.IMarker[]>();

        await this.collectFileProblems(action.type!, action.stderr, problems);
        await this.collectFileProblems(action.type!, action.stdout, problems);

        problems.forEach((markers, uri) => {
            this.diagnostics!.set(uri, markers.map(marker => createDiagnosticFromMarker(marker)));
        });

        return problems;
    }

    async collectFileProblems(
        type: string, 
        file: File | undefined, 
        problems: Map<vscode.Uri,markers.IMarker[]>,
    ) {
        if (!file) {
            return;
        }
        const matcher = this.problemMatcherRegistry.get(type);
        if (!matcher) {
            return;
        }
        matcher.uriProvider = this.provideUri.bind(this);

        if (file.contents) {
            return this.collectFileContentProblems(type, matcher, file.contents, problems);
        } else if (file.uri) {
            return this.collectFileUriProblems(type, matcher, file.uri, problems);
        }
    }

    async collectFileContentProblems(
        type: string, 
        matcher: problemMatcher.ProblemMatcher, 
        contents: string | Uint8Array | Buffer | undefined, 
        problems: Map<vscode.Uri,markers.IMarker[]>,
    ) {
        return undefined;
    }

    async collectFileUriProblems(
        type: string, 
        matcher: problemMatcher.ProblemMatcher, 
        uri: string, 
        problems: Map<vscode.Uri,markers.IMarker[]>,
    ) {
        const url = new URL(uri);

        // TODO: support bytestream URIs
        const data = fs.readFileSync(url);

        return collectProblems(type, matcher, data, this.markerService, problems);
    }    

    public dispose() {
        this.diagnostics.dispose();
        this.markerService.dispose();
    }
}

function createDiagnosticFromMarker(marker: markers.IMarker): vscode.Diagnostic {
    const severity = markers.MarkerSeverity.toDiagnosticSeverity(marker.severity);
    const start = new vscode.Position(marker.startLineNumber - 1, marker.startColumn - 1);
    const end = new vscode.Position(marker.endLineNumber - 1, marker.endColumn - 1);
    const range = new vscode.Range(start, end);
    return new vscode.Diagnostic(range, marker.message, severity);
}

export async function collectProblems(
    owner: string, 
    matcher: problemMatcher.ProblemMatcher, 
    data: Buffer, 
    markerService: markers.IMarkerService, 
    problems: Map<vscode.Uri,markers.IMarker[]>,
) {
    const decoder = new problemMatcher.LineDecoder();
    const collector = new problemMatcher.StartStopProblemCollector([matcher], markerService);

    const processLine = async (line: string) => 
        collector.processLine(strings.removeAnsiEscapeCodes(line));

    for (const line of decoder.write(data)) {
        await processLine(line);
    }
    let line = decoder.end();
    if (line) {
        await processLine(line);
    }

    collector.done();
    collector.dispose();

    const markers = markerService.read({
        owner: owner,
    });
    
    for (const marker of markers) {
        if (!marker.resource) {
            console.log('skipping marker without a resource?', marker);
            continue;
        }
        let items = problems.get(marker.resource);
        if (!items) {
            items = [];
            problems.set(marker.resource, items);
        }
        items.push(marker);
    }
}
