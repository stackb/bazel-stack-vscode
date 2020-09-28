import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
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
import { TestResult } from '../../proto/build_event_stream/TestResult';
import { WorkspaceConfig } from '../../proto/build_event_stream/WorkspaceConfig';
import { BzlClient } from '../bzlclient';
import { BazelBuildEvent } from '../commandrunner';
import { BzlClientTreeDataProvider } from './bzlclienttreedataprovider';
import Long = require('long');

const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');
const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BuildEventProtocolView extends BzlClientTreeDataProvider<BazelBuildEventItem> {
    static readonly viewId = 'bzl-events';
    static readonly commandActionStderr = BuildEventProtocolView.viewId + '.action.stderr';
    static readonly commandActionStdout = BuildEventProtocolView.viewId + '.action.stdout';
    static readonly commandPrimaryOutputFile = BuildEventProtocolView.viewId + '.event.output';
    static readonly commandStartedExplore = BuildEventProtocolView.viewId + '.started.explore';
    static readonly commandFileDownload = BuildEventProtocolView.viewId + '.file.download';
    static readonly commandFileSave = BuildEventProtocolView.viewId + '.file.save';
    static readonly revealButton = 'Reveal';

    private items: BazelBuildEventItem[] = [];
    private testsPassed: TestResult[] = [];
    private state = new BuildEventState();

    constructor(
        onDidChangeBzlClient: vscode.Event<BzlClient>,
        onDidRecieveBazelBuildEvent: vscode.Event<BazelBuildEvent>
    ) {
        super(BuildEventProtocolView.viewId, onDidChangeBzlClient);

        onDidRecieveBazelBuildEvent(this.handleBazelBuildEvent, this, this.disposables);
    }

    registerCommands() {
        // super.registerCommands(); // explicitly skipped as we don't need a 'refresh' command
        this.disposables.push(vscode.window.registerTreeDataProvider(BuildEventProtocolView.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandActionStderr, this.handleCommandActionStderr, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandActionStdout, this.handleCommandActionStdout, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandPrimaryOutputFile, this.handleCommandPromaryOutputFile, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandStartedExplore, this.handleCommandStartedExplore, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandFileDownload, this.handleCommandFileDownload, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandFileSave, this.handleCommandFileSave, this));
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
        await vscode.window.withProgress<void>({
            location: vscode.ProgressLocation.SourceControl,
            title: `Downloading ${path.basename(relname)}`,
            cancellable: true,
        }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {
            return downloadAsset(url, filename, response.mode!);
        });
        const selection = await vscode.window.showInformationMessage(
            `Saved ${relname}`,
            BuildEventProtocolView.revealButton,
        );
        if (selection === BuildEventProtocolView.revealButton) {
            return vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(filename));
            // return vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(filename));
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

    async handleCommandPromaryOutputFile(item: BazelBuildEventItem): Promise<void> {
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

    reset(): void {
        this.items.length = 0;
        this.testsPassed.length = 0;
        this.state.reset();
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
        this.reset();
        this.state.started = started;
        this.addItem(new BuildStartedItem(e));
    }

    async handleWorkspaceInfoEvent(e: BazelBuildEvent, workspaceInfo: WorkspaceConfig) {
        this.reset();
        this.state.workspaceInfo = workspaceInfo;
    }

    async handleCompletedEvent(e: BazelBuildEvent, completed: TargetComplete) {
        this.addItem(new TargetCompleteItem(e, this.state));
    }

    async handleFinishedEvent(e: BazelBuildEvent, finished: BuildFinished) {
        if (finished.overallSuccess) {
            this.addItem(new BuildSuccessItem(e, this.state.started));
        } else {
            this.addItem(new BuildFailedItem(e, this.state.started));
        }
    }

    handleNamedSetOfFilesEvent(e: BazelBuildEvent) {
        this.state.handleNamedSetOfFiles(e);
    }

    async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
        if (action.success) {
            return this.handleActionExecutedEventSuccess(e, action);
        }
        this.addItem(new ActionFailedItem(e));
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
        this.description = `#${event.obe.sequenceNumber} ${event.bes.payload}`;
        this.iconPath = stackbSvg;
        this.contextValue = event.bes.payload;
        this.command = {
            title: 'Open Primary Output File',
            command: BuildEventProtocolView.commandPrimaryOutputFile,
            arguments: [this],
        };
    }

    getPrimaryOutputFile(): File | undefined {
        return undefined;
    }

    getChildren(): BazelBuildEventItem[] | undefined {
        return undefined;
    }
}

export class BuildStartedItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `Started bazel ${event.bes.started?.buildToolVersion} ${event.bes.started?.command}`);
        this.description = event.bes.started?.optionsDescription;
        // this.iconPath = new vscode.ThemeIcon('debug-continue');
        this.iconPath = bazelSvg;
    }
}


export class BuildFinishedItem extends BazelBuildEventItem {
    protected timeDelta: Long | undefined;
    constructor(
        public readonly event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, `Bazel ${event.bes.started?.buildToolVersion} ${event.bes.started?.command}`);
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
        this.label = `${event.bes.finished?.exitCode?.name} ${elapsed}`;
    }
}


export class BuildSuccessItem extends BuildFinishedItem {
    constructor(
        public readonly event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, started);
        this.iconPath = bazelSvg;
    }
}

export class BuildFailedItem extends BuildFinishedItem {
    constructor(
        public readonly event: BazelBuildEvent,
        started: BuildStarted | undefined,
    ) {
        super(event, started);
        this.iconPath = bazelWireframeSvg;
    }
}

export class ActionExecutedItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
        public label?: string,
    ) {
        super(event, label || `${event.bes.action?.type}`);
        this.description = `${event.bes.action?.label} (#${event.obe.sequenceNumber})`;
        this.tooltip = event.bes.action?.commandLine?.join(' ');
        this.iconPath = new vscode.ThemeIcon('symbol-event');
    }

    getPrimaryOutputFile(): File | undefined {
        if (this.event.bes.action?.stderr) {
            return this.event.bes.action?.stderr;
        }
        return this.event.bes.action?.stdout;
    }

}

export class ActionFailedItem extends ActionExecutedItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.action?.type}`);
    }
}

export class ActionSuccessItem extends ActionExecutedItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.action?.type}`);
        this.iconPath = new vscode.ThemeIcon('symbol-event');
    }
}

export class TestResultFailedItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.testResult?.status} test`);
        this.description = `#${event.obe.sequenceNumber} test ${event.bes.testResult?.statusDetails}`;
        this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data');
        // this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-disabled');
        // this.iconPath = new vscode.ThemeIcon('debug-breakpoint-data-disabled');
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

export class TargetCompleteItem extends BazelBuildEventItem {
    private outputs: FileItem[] | undefined;

    constructor(
        public readonly event: BazelBuildEvent,
        private readonly state: BuildEventState,
    ) {
        super(event, 'Complete');
        this.description = `${event.bes.id?.targetCompleted?.label} #${event.obe.sequenceNumber}`;
        this.iconPath = new vscode.ThemeIcon('github-action');
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }

    getChildren(): BazelBuildEventItem[] | undefined {
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

    getPrimaryOutputFile(): File | undefined {
        for (const file of this.event.bes?.completed?.importantOutput || []) {
            return file;
        }
        return undefined;
    }
}

export class FileItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
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
            command: BuildEventProtocolView.commandFileDownload,
            arguments: [this],
        };
    }
}

class BuildEventState {
    private fileSets = new Map<string, NamedSetOfFiles>();

    public workspaceInfo: WorkspaceConfig | undefined;
    public started: BuildStarted | undefined;

    handleNamedSetOfFiles(event: BazelBuildEvent) {
        const id = event.bes.id?.namedSet;
        const fileSet = event.bes.namedSetOfFiles;
        this.fileSets.set(id?.id!, fileSet!);
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
}