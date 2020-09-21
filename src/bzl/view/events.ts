import Long = require('long');
import * as path from 'path';
import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { ActionExecuted } from '../../proto/build_event_stream/ActionExecuted';
import { BuildFinished } from '../../proto/build_event_stream/BuildFinished';
import { BuildStarted } from '../../proto/build_event_stream/BuildStarted';
import { File } from '../../proto/build_event_stream/File';
import { TestResult } from '../../proto/build_event_stream/TestResult';
import { BazelBuildEvent } from '../commandrunner';

const bazelSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-icon.svg');
const bazelWireframeSvg = path.join(__dirname, '..', '..', '..', 'media', 'bazel-wireframe.svg');
const stackbSvg = path.join(__dirname, '..', '..', '..', 'media', 'stackb.svg');

/**
 * Renders a view for bezel license status.  Makes a call to the status
 * endpoint to gather the data.
 */
export class BuildEventProtocolView implements vscode.Disposable, vscode.TreeDataProvider<BazelBuildEventItem> {
    private static readonly viewId = 'bzl-events';
    private static readonly commandActionStderr = BuildEventProtocolView.viewId + '.action.stderr';
    private static readonly commandActionStdout = BuildEventProtocolView.viewId + '.action.stdout';
    private static readonly commandTestResultLog = BuildEventProtocolView.viewId + '.testResult.log';
    private static readonly commandStartedExplore = BuildEventProtocolView.viewId + '.started.explore';

    private disposables: vscode.Disposable[] = [];
    private _onDidChangeTreeData: vscode.EventEmitter<BazelBuildEventItem | undefined> = new vscode.EventEmitter<BazelBuildEventItem | undefined>();
    private items: BazelBuildEventItem[] = [];
    private testsPassed: TestResult[] = [];
    private started: BuildStarted | undefined;

    constructor(
        private httpServerAddress: string,
        onDidRecieveBazelBuildEvent: vscode.Event<BazelBuildEvent>
    ) {
        onDidRecieveBazelBuildEvent(this.handleBazelBuildEvent, this, this.disposables);

        this.disposables.push(vscode.window.registerTreeDataProvider(BuildEventProtocolView.viewId, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandActionStderr, this.handleCommandActionStderr, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandActionStdout, this.handleCommandActionStdout, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandTestResultLog, this.handleCommandTestResultLog, this));
        this.disposables.push(vscode.commands.registerCommand(BuildEventProtocolView.commandStartedExplore, this.handleCommandStartedExplore, this));
    }

    readonly onDidChangeTreeData: vscode.Event<BazelBuildEventItem | undefined> = this._onDidChangeTreeData.event;

    async handleCommandStartedExplore(item: BuildStartedItem): Promise<void> {
        if (!(item instanceof BuildStartedItem)) {
            return;
        }
        vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(`http://${this.httpServerAddress}/stream/${item.event.bes.started?.uuid}`));
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

    async handleCommandTestResultLog(item: TestResultFailedItem): Promise<void> {
        if (!(item instanceof TestResultFailedItem)) {
            return;
        }
        for (const file of item.event.bes.testResult?.testActionOutput!) {
            if (!file) {
                continue;
            }
            if (file.name !== 'test.log') {
                continue;
            }
            return this.openFile(file);
        }
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
        this.started = undefined;
    }

    addItem(item: BazelBuildEventItem) {
        this.items.push(item);
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    getTreeItem(element: BazelBuildEventItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: BazelBuildEventItem): Promise<BazelBuildEventItem[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }

    private getRootItems(): BazelBuildEventItem[] {
        return this.items;
    }

    async handleBazelBuildEvent(e: BazelBuildEvent) {
        switch (e.bes.payload) {
            case 'started':
                return this.handleStartedEvent(e, e.bes.started!);
            case 'action':
                return this.handleActionExecutedEvent(e, e.bes.action!);
            case 'finished':
                return this.handleFinishedEvent(e, e.bes.finished!);
            case 'testResult':
                return this.handleTestResultEvent(e, e.bes.testResult!);
            default:
                console.log(`skipping "${e.bes.payload}"`);
        }
    }

    async handleStartedEvent(e: BazelBuildEvent, started: BuildStarted) {
        this.reset();
        this.started = started;
        this.addItem(new BuildStartedItem(e));
    }

    async handleFinishedEvent(e: BazelBuildEvent, finished: BuildFinished) {
        if (finished.overallSuccess) {
            this.addItem(new BuildSuccessItem(e, this.started));
        } else {
            this.addItem(new BuildFailedItem(e, this.started));
        }
    }

    async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
        if (action.success) {
            return;
        }
        this.addItem(new ActionFailedItem(e));
    }

    async handleTestResultEvent(e: BazelBuildEvent, test: TestResult) {
        if (test.status === 'PASSED') {
            this.testsPassed.push(test);
            return;
        }
        this.addItem(new TestResultFailedItem(e));
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
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
    }
}

export class BuildStartedItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `Bazel ${event.bes.started?.buildToolVersion} ${event.bes.started?.command}`);
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
        this.label = `${event.bes.finished?.exitCode?.name} (${this.timeDelta?.toString()}ms)`;
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

export class ActionFailedItem extends BazelBuildEventItem {
    constructor(
        public readonly event: BazelBuildEvent,
    ) {
        super(event, `${event.bes.action?.type}`);
        this.description = `#${event.obe.sequenceNumber} exited with ${event.bes.action?.exitCode}`;
        this.tooltip = event.bes.action?.commandLine?.join(' ');
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
    }
}