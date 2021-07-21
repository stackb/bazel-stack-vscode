import stripAnsi = require('strip-ansi');
import path = require('path');
import Long = require('long');
import * as vscode from 'vscode';
import * as fs from 'graceful-fs';
import {
  _build_event_stream_BuildEventId_ActionCompletedId,
  _build_event_stream_BuildEventId_NamedSetOfFilesId as NamedSetOfFilesId,
  _build_event_stream_BuildEventId_TargetCompletedId,
  _build_event_stream_BuildEventId_TestResultId,
} from '../proto/build_event_stream/BuildEventId';
import { ActionExecuted } from '../proto/build_event_stream/ActionExecuted';
import { BuildFinished } from '../proto/build_event_stream/BuildFinished';
import { BuildStarted } from '../proto/build_event_stream/BuildStarted';
import { BuiltInCommands } from '../constants';
import {
  ThemeIconCloudDownload,
  ContextValue,
  ThemeIconReport,
  ThemeIconSymbolInterface,
  DiagnosticCollectionName,
  ThemeIconInfo,
  CommandName,
  ThemeIconZap,
} from './constants';
import { Container, MediaIconName } from '../container';
import { FailureDetail } from '../proto/failure_details/FailureDetail';
import { File } from '../proto/build_event_stream/File';
import { NamedSetOfFiles } from '../proto/build_event_stream/NamedSetOfFiles';
import { problemMatcher, markers, markerService } from 'vscode-common';
import { Progress } from '../proto/build_event_stream/Progress';
import { TargetComplete } from '../proto/build_event_stream/TargetComplete';
import { TargetConfigured } from '../proto/build_event_stream/TargetConfigured';
import { TestResult } from '../proto/build_event_stream/TestResult';
import { URL } from 'url';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceConfig } from '../proto/build_event_stream/WorkspaceConfig';
import { BazelBuildEvent } from './bepHandler';
import { Aborted } from '../proto/build_event_stream/Aborted';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { BzlLanguageClient, Invocation } from './lsp';
import { RunnableComponent, Status } from './status';
import { BzlConfiguration, InvocationsConfiguration } from './configuration';
import {
  BzlFrontendLinkItem,
  DisabledItem,
  Expandable,
  Revealable,
  RunnableComponentItem,
  UsageItem,
} from './workspaceView';
import { Bzl } from './bzl';
import { Settings } from './settings';

export class Invocations extends RunnableComponent<InvocationsConfiguration> {
  constructor(
    settings: Settings<InvocationsConfiguration>,
    public readonly lsp: BzlLanguageClient,
    public readonly bzl: Bzl,
    public readonly problemMatcherRegistry: problemMatcher.IProblemMatcherRegistry
  ) {
    super('INV', settings);
    bzl.onDidChangeStatus(this.restart, this, this.disposables);

    this.addCommand(CommandName.InvocationInvoke, this.handleCommandInvocationInvoke);
  }

  async startInternal() {
    if (this.bzl.status !== Status.READY) {
      throw new Error(`Bzl Service not ready`);
    }
  }

  async stopInternal() {}

  async handleCommandInvocationInvoke(item: InvocationItem): Promise<void> {
    let args = [item.inv.command];
    if (item.inv.arguments) {
      args = args.concat(item.inv.arguments);
    }
    return vscode.commands.executeCommand(CommandName.Invoke, args);
  }
}

/**
 * Renders a view for invocations.
 */
export class InvocationsItem
  extends RunnableComponentItem<InvocationsConfiguration>
  implements Revealable
{
  private readonly recentInvocations: RecentInvocationsItem;
  public readonly currentInvocation: CurrentInvocationItem;

  constructor(
    private invocations: Invocations,
    bzlSettings: Settings<BzlConfiguration>,
    onDidChangeTreeData: (item: vscode.TreeItem) => void,
    onShouldRevealTreeItem: (item: vscode.TreeItem) => void
  ) {
    super('Invocations', 'Service', invocations, onDidChangeTreeData);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;

    invocations.bzl.bepRunner.onDidReceiveBazelBuildEvent.event(
      this.handleBazelBuildEvent,
      this,
      this.disposables
    );
    invocations.bzl.bepRunner.onDidRunRequest.event(this.handleRunRequest, this, this.disposables);

    const problemCollector = new ProblemCollector(invocations.problemMatcherRegistry);
    this.disposables.push(problemCollector);

    this.recentInvocations = new RecentInvocationsItem(
      this,
      invocations.lsp,
      onDidChangeTreeData,
      onShouldRevealTreeItem,
      this.disposables
    );

    this.currentInvocation = new CurrentInvocationItem(
      bzlSettings,
      invocations.problemMatcherRegistry,
      problemCollector,
      this.invocations.settings,
      onDidChangeTreeData,
      onShouldRevealTreeItem,
      this.disposables
    );
  }

  async handleCommandInvocationsRefresh(): Promise<void> {
    return this.recentInvocations.refresh();
  }

  getParent(): vscode.TreeItem | undefined {
    return undefined;
  }

  handleRunRequest(request: RunRequest) {
    this.currentInvocation?.clear();
  }

  async openFile(file: File | undefined): Promise<void> {
    if (!(file && file.uri)) {
      return;
    }
    return vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.parse(file.uri));
  }

  async handleBazelBuildEvent(e: BazelBuildEvent) {
    this.currentInvocation.handleBazelBuildEvent(e);
  }

  async getChildrenInternal(): Promise<vscode.TreeItem[]> {
    const items: vscode.TreeItem[] = [];

    if (this.invocations.status === Status.DISABLED) {
      items.push(new DisabledItem('Depends on the Bzl Service'));
      return items;
    }
    if (this.invocations.status !== Status.READY) {
      items.push(new DisabledItem('Service not ready'));
      return items;
    }

    const bzlConfig = await this.invocations.bzl.settings.get();

    items.push(await this.createUsageItem());
    items.push(new BzlFrontendLinkItem(bzlConfig, 'Invocations', 'Browser', 'pipeline'));
    items.push(this.recentInvocations);

    return items;
  }

  async createUsageItem(): Promise<vscode.TreeItem> {
    const item = new UsageItem(
      'Click on a "build" or "test" codelens action in a BUILD file to start a bazel invocation'
    );
    return item;
  }
}

/**
 * Renders a view for the current invocation.
 */
export class CurrentInvocationItem extends vscode.TreeItem implements Expandable, Revealable {
  private isEnabled: boolean = true;
  private items: BazelBuildEventItem[] = [];
  private testsPassed: TestResult[] = [];
  private state = new BuildEventState();
  private pending: Map<string, BazelBuildEventItem> = new Map();
  // private refreshItems = Event.debounce(this.onDidUpdateItems.event, (last, e) => last, 250);

  constructor(
    private bzlSettings: Settings<BzlConfiguration>,
    // private parent: vscode.TreeItem,
    protected problemMatcherRegistry: problemMatcher.IProblemMatcherRegistry,
    private problemCollector: ProblemCollector,
    private invocationsSettings: Settings<InvocationsConfiguration>,
    private onDidChangeTreeData: (item: vscode.TreeItem) => void,
    private onShouldRevealTreeItem: (item: vscode.TreeItem) => void,
    disposables: vscode.Disposable[]
  ) {
    super('Event');
    this.description = 'Stream';
    this.contextValue = 'currentInvocation';
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.clear();

    invocationsSettings.onDidConfigurationChange(
      c => {
        this.setEnabled(c.invokeWithBuildEventStreaming);
      },
      this,
      disposables
    );
  }

  getParent(): vscode.TreeItem | undefined {
    return undefined;
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    if (!this.isEnabled) {
      return [new DisabledItem('invokeWithBuildEventStreaming false')];
    }
    return this.items;
  }

  setEnabled(enabled: boolean) {
    if (enabled) {
      this.iconPath = new vscode.ThemeIcon('circle-large-outline');
    } else {
      this.iconPath = new vscode.ThemeIcon('circle-slash');
    }
    this.isEnabled = enabled;
  }

  async clear() {
    const cfg = await this.invocationsSettings.get();
    this.setEnabled(cfg.invokeWithBuildEventStreaming);

    this.items.length = 0;
    this.testsPassed.length = 0;
    this.state.reset();
    this.pending.clear();
    this.problemCollector.clear();
  }

  addItem(item: BazelBuildEventItem) {
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.items.unshift(item);
    this.onDidChangeTreeData(this);
  }

  replaceLastItem(item: BazelBuildEventItem) {
    this.items[this.items.length - 1] = item;
    this.onDidChangeTreeData(this);
  }

  async handleBazelBuildEvent(e: BazelBuildEvent) {
    this.pending.delete(e.bes.id!.id!);
    if (e.bes.children) {
      for (const id of e.bes.children) {
        if (id.targetCompleted && id.targetCompleted.label) {
          this.pending.set(id.id!, new TargetPendingItem(e, id.targetCompleted));
        } else if (id.actionCompleted && id.actionCompleted.label) {
          this.pending.set(id.id!, new ActionPendingItem(e, id.actionCompleted));
        } else if (id.testResult && id.testResult.label) {
          this.pending.set(id.id!, new TestResultPendingItem(e, id.testResult));
        }
      }
    }

    switch (e.bes.payload) {
      case 'aborted':
        return this.handleAbortedEvent(e, e.bes.aborted!);
      case 'progress':
        return this.handleProgressEvent(e, e.bes.progress!);
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
      case 'fetch':
        return this.handleFetchEvent(e);
      case 'completed':
        return this.handleCompletedEvent(e, e.bes.completed!);
      case 'finished':
        return this.handleFinishedEvent(e, e.bes.finished!);
      case 'testResult':
        return this.handleTestResultEvent(e, e.bes.testResult!);
      default:
        console.log(`skipping "${e.bes.payload}"`);
    }
  }

  async handleStartedEvent(e: BazelBuildEvent, started: BuildStarted) {
    await this.clear();
    const bzl = await this.bzlSettings.get();
    this.iconPath = new vscode.ThemeIcon('sync~spin');
    this.state.started = started;
    this.problemCollector.started = started;

    const startedItem = new BuildStartedItem(e, bzl.address);
    this.addItem(startedItem);

    this.onShouldRevealTreeItem(startedItem);
  }

  async handleProgressEvent(e: BazelBuildEvent, progress: Progress) {}

  async handleWorkspaceInfoEvent(e: BazelBuildEvent, workspaceInfo: WorkspaceConfig) {
    this.state.workspaceInfo = workspaceInfo;
  }

  async handleCompletedEvent(e: BazelBuildEvent, completed: TargetComplete) {
    this.addItem(new TargetCompleteItem(e, this.state));
  }

  async handleAbortedEvent(e: BazelBuildEvent, aborted: Aborted) {
    // TODO: consider put this feature under a flag to filter attentive items at the end.
    // this.items = this.items.filter(item => item.attention);
    this.addItem(new BuildAbortedItem(e, aborted));
  }

  async handleFinishedEvent(e: BazelBuildEvent, finished: BuildFinished) {
    this.state.finished = finished;
    this.pending.clear();
    // this.items = this.items.filter(item => item.attention);
    if (finished.overallSuccess) {
      this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
      this.addItem(new BuildSuccessItem(e, this.state.started));
      vscode.commands.executeCommand(BuiltInCommands.ClosePanel);
    } else {
      this.iconPath = new vscode.ThemeIcon('testing-failed-icon');
      this.addItem(new BuildFailedItem(e, this.state.started!, finished));
    }
  }

  handleNamedSetOfFilesEvent(e: BazelBuildEvent) {
    this.state.handleNamedSetOfFiles(e);
  }

  handleTargetConfiguredEvent(e: BazelBuildEvent) {
    this.state.handleTargetConfigured(e);
  }

  handleFetchEvent(e: BazelBuildEvent) {
    const item = new FetchItem(e);
    this.addItem(item);
  }

  async handleActionExecutedEvent(e: BazelBuildEvent, action: ActionExecuted) {
    if (action.success) {
      return this.handleActionExecutedEventSuccess(e, action);
    }
    this.addItem(new ActionExecutedFailedItem(e, action, this.problemCollector));
  }

  async handleActionExecutedEventSuccess(e: BazelBuildEvent, action: ActionExecuted) {
    const item = new ActionExecutedSuccessItem(e, action);
    this.addItem(item);
    // if (this.items[this.items.length - 1] instanceof ActionExecutedSuccessItem) {
    //   this.replaceLastItem(item);
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

export class RecentInvocationsItem extends vscode.TreeItem implements Expandable, Revealable {
  constructor(
    private parent: vscode.TreeItem,
    private lsp: BzlLanguageClient,
    private onDidChangeTreeData: (item: vscode.TreeItem) => void,
    private onShouldRevealTreeItem: (item: vscode.TreeItem) => void,
    disposables: vscode.Disposable[]
  ) {
    super('Recent');
    this.description = 'Invocations';
    this.contextValue = 'recentInvocations';
    this.iconPath = new vscode.ThemeIcon('debug-step-back');
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

    disposables.push(
      vscode.commands.registerCommand(CommandName.InvocationsRefresh, this.refresh, this)
    );
  }

  getParent(): vscode.TreeItem {
    return this.parent;
  }

  refresh() {
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    this.onShouldRevealTreeItem(this);
    this.onDidChangeTreeData(this);
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    const result = await this.lsp.recentInvocations();
    if (!result) {
      return [];
    }
    const items = result.map(i => new InvocationItem(i));
    items.sort(byCreatedAtTime);
    return items;
  }
}

export class BazelBuildEventItem extends vscode.TreeItem implements Expandable {
  constructor(public readonly event: BazelBuildEvent, public label?: string) {
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

export class InvocationItem extends vscode.TreeItem {
  constructor(public inv: Invocation) {
    super(inv.command);
    this.description = inv.arguments.join(' ');
    this.tooltip = inv.invocationId;
    this.iconPath = new vscode.ThemeIcon(
      inv.success ? 'testing-passed-icon' : 'testing-failed-icon'
    );
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    this.contextValue = 'invocation';
  }

  async getChildren(): Promise<void> {}
}

export class BuildStartedItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, bzlAddress: vscode.Uri) {
    super(event, event.bes.started?.command);
    this.description = event.bes.started?.uuid;
    this.tooltip = event.bes.started?.optionsDescription;
    this.iconPath = Container.media(MediaIconName.StackBuildBlue);
    this.command = {
      title: 'Open Browser',
      command: BuiltInCommands.Open,
      arguments: [
        vscode.Uri.parse(`http://${bzlAddress.authority}/pipeline/${event.bes.started?.uuid}`),
      ],
    };
  }

  get attention(): boolean {
    return true;
  }
}

export class BuildProgressItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, progress: Progress) {
    super(event, 'Progress');
    this.description = stripAnsi(progress.stderr!);
    this.iconPath = ThemeIconInfo;
  }

  get attention(): boolean {
    return true;
  }
}

export class BuildFinishedItem extends BazelBuildEventItem {
  protected timeDelta: Long | undefined;
  constructor(event: BazelBuildEvent, started: BuildStarted | undefined) {
    super(event, event.bes.finished?.exitCode?.name);
    const end = Long.fromValue(event.bes.finished?.finishTimeMillis!);
    const start = Long.fromValue(started?.startTimeMillis!);
    try {
      this.timeDelta = end.sub(start);
    } catch (e) {
      console.warn(`Could not compute timeDelta ${end}, ${start}`);
    }
    let elapsed = '';
    if (this.timeDelta) {
      elapsed = `${this.timeDelta?.toString()}ms`;
    }
    this.description = elapsed;
  }

  get attention(): boolean {
    return true;
  }
}

export class BuildSuccessItem extends BuildFinishedItem {
  constructor(event: BazelBuildEvent, started: BuildStarted | undefined) {
    super(event, started);
    // this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
    this.iconPath = Container.media(MediaIconName.BazelIcon);
  }
}

export class BuildFailedItem extends BuildFinishedItem {
  constructor(event: BazelBuildEvent, started: BuildStarted, finished: BuildFinished | undefined) {
    super(event, started);
    this.iconPath = new vscode.ThemeIcon('testing-failed-icon');
  }
}

export class BuildAbortedItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, aborted: Aborted | undefined) {
    super(event, 'Aborted');
    this.description = `${aborted?.reason}`;
    this.iconPath = new vscode.ThemeIcon('testing-error-icon');
  }
}

export class ActionExecutedItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, private action: ActionExecuted) {
    super(event, `${action.type} action`);
    this.action = action;
    this.description = `${action.label || ''}`;
    this.tooltip = action.commandLine?.join(' ');
    this.resourceUri = this.getActionPrimaryOutputFileUri();
    if (!this.resourceUri) {
      this.iconPath = ThemeIconZap;
    }
  }

  getActionPrimaryOutputFileUri(): vscode.Uri | undefined {
    const file = this.action.primaryOutput;
    if (!file) {
      return undefined;
    }
    let uri = file.uri;
    if (uri) {
      if (uri.startsWith('bytestream://')) {
        uri += getActionMnemonicExtension(this.action.type!);
      }
      return vscode.Uri.parse(uri);
    }
    if (file.name) {
      return vscode.Uri.file(file.name);
    }
    return undefined;
  }

  getPrimaryOutputFile(): File | undefined {
    if (this.action?.stderr) {
      return this.action?.stderr;
    }
    return this.action?.stdout || undefined;
  }
}

export class TestResultPendingItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, id: _build_event_stream_BuildEventId_TestResultId) {
    super(event, 'Testing');
    this.description = `${id.label}`;
    this.iconPath = new vscode.ThemeIcon('loading~spin');
  }
}

export class TargetPendingItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, id: _build_event_stream_BuildEventId_TargetCompletedId) {
    super(event, 'Building target');
    this.description = `${id.label}`;
    this.iconPath = new vscode.ThemeIcon('loading~spin');
  }
}

export class ActionPendingItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent, id: _build_event_stream_BuildEventId_ActionCompletedId) {
    super(event, 'Executing action');
    this.description = `${id.label}`;
    this.iconPath = new vscode.ThemeIcon('loading~spin');
  }

  getPrimaryOutputFile(): File | undefined {
    if (this.event.bes.action?.stderr) {
      return this.event.bes.action?.stderr;
    }
    return this.event.bes.action?.stdout || undefined;
  }
}

export class ActionExecutedFailedItem extends ActionExecutedItem {
  private problems: FileProblems;

  constructor(
    event: BazelBuildEvent,
    action: ActionExecuted,
    public readonly problemCollector: ProblemCollector
  ) {
    super(event, action);
    this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
  }

  get attention(): boolean {
    return true;
  }

  async getChildren(): Promise<BazelBuildEventItem[] | undefined> {
    const problems = (this.problems = await this.problemCollector.actionProblems(
      this.event.bes.action!
    ));
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

export class ActionExecutedSuccessItem extends ActionExecutedItem {
  constructor(event: BazelBuildEvent, action: ActionExecuted) {
    super(event, action);
  }
}

export class FetchItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent) {
    super(event);
    this.description = `${event.bes.id?.fetch?.url}`;
    this.iconPath = ThemeIconCloudDownload;
  }

  get attention(): boolean {
    return !this.event.bes.fetch?.success;
  }
}

export class TestResultItem extends BazelBuildEventItem {
  constructor(event: BazelBuildEvent) {
    super(
      event,
      `${event.bes.testResult?.cachedLocally ? 'CACHED' : event.bes.testResult?.status}`
    );
    this.description = `${event.bes.id?.testResult?.label || ''} ${
      event.bes.testResult?.statusDetails || ''
    }`;
    // this.iconPath = new vscode.ThemeIcon(event.bes.testResult?.cachedLocally ? 'testing-skipped-icon' : 'testing-passed-icon');
    this.iconPath = new vscode.ThemeIcon('testing-passed-icon');
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
  constructor(event: BazelBuildEvent) {
    super(event);
    this.iconPath = new vscode.ThemeIcon('testing-failed-icon');
  }

  get attention(): boolean {
    return true;
  }
}

export class TargetCompleteItem extends BazelBuildEventItem {
  private outputs: FileItem[] | undefined;

  constructor(event: BazelBuildEvent, private readonly state: BuildEventState) {
    super(event, `${state.getTargetKind(event)}${event.bes.completed?.success ? '' : ' failed'} `);
    this.description = `${event.bes.id?.targetCompleted?.label}`;
    this.iconPath = state.getTargetIcon(event, event.bes.completed!);
    this.collapsibleState = event.bes.completed?.success
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;
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
  constructor(event: BazelBuildEvent, public readonly file: File) {
    super(event, path.basename(file.name || ''));
    this.description = `${file.name}`;
    this.iconPath = vscode.ThemeIcon.File;
    this.resourceUri = file.uri ? vscode.Uri.parse(file.uri!) : vscode.Uri.file(file.name!);
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
    public readonly markers: markers.IMarker[]
  ) {
    super(event, `${path.basename(uri.fsPath || '')}`);
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
    public readonly marker: markers.IMarker
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
  constructor(event: BazelBuildEvent, public readonly detail: FailureDetail) {
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
  public finished: BuildFinished | undefined;

  constructor() {}

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
      cwd: this.started?.workingDirectory,
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
      // kind = kind.slice(0, kind.length - 5);
      // return Container.media(MediaIconName.Package);
      // return ruleClassIconUri(kind);
      return new vscode.ThemeIcon('symbol-constructor');
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

  constructor(protected problemMatcherRegistry: problemMatcher.IProblemMatcherRegistry) {
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
    return (this.diagnostics = vscode.languages.createDiagnosticCollection(
      DiagnosticCollectionName.Bazel
    ));
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

    const problems = new Map<vscode.Uri, markers.IMarker[]>();

    await this.collectFileProblems(action.type!, action.stderr || undefined, problems);
    await this.collectFileProblems(action.type!, action.stdout || undefined, problems);

    problems.forEach((markers, uri) => {
      this.diagnostics!.set(
        uri,
        markers.map(marker => createDiagnosticFromMarker(marker))
      );
    });

    return problems;
  }

  async collectFileProblems(
    type: string,
    file: File | undefined,
    problems: Map<vscode.Uri, markers.IMarker[]>
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
    problems: Map<vscode.Uri, markers.IMarker[]>
  ) {
    return undefined;
  }

  async collectFileUriProblems(
    type: string,
    matcher: problemMatcher.ProblemMatcher,
    uri: string,
    problems: Map<vscode.Uri, markers.IMarker[]>
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
  problems: Map<vscode.Uri, markers.IMarker[]>
) {
  const decoder = new problemMatcher.LineDecoder();
  const collector = new problemMatcher.StartStopProblemCollector([matcher], markerService);

  const processLine = async (line: string) => {
    return collector.processLine(stripAnsi(line));
  };

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

function getActionIcon(action: ActionExecuted): vscode.Uri | vscode.ThemeIcon {
  if (action.type) {
    return vscode.Uri.parse(`https://bzl.io/v1/image/mnemonic/${action.type}`);
  }
  return new vscode.ThemeIcon('symbol-event');
}

function getActionMnemonicExtension(mnemonic: string): string {
  switch (mnemonic) {
    case 'JavaIjar':
      return '.java';
    case 'Javac':
      return '.java';
    case 'Turbine':
      return '.java';
    case 'JavacTurbine':
      return '.java';
    case 'JavaSourceJar':
      return '.java';
    case 'CppCompile':
      return '.cpp';
    case 'CppLink':
      return '.cpp';
    case 'CcStrip':
      return '.cpp';
    case 'SolibSymlink':
      return '.cpp';
    case 'GoCompilePkg':
      return '.go';
    case 'GoLink':
      return '.go';
    case 'GoSourcesData':
      return '.go';
    case 'haskell':
      return '.hs';
    case 'jsonnet':
      return '.json';
    case 'kotlin':
      return '.kt';
    case 'objc':
      return '.objc';
    case 'py':
      return '.py';
    case 'python':
      return '.py';
    case 'r':
      return '.R';
    case 'ruby':
      return '.rb';
    case 'SoyCompiler':
      return '.rb';
    case 'rust':
      return '.rs';
    case 'scala':
      return '.scala';
    case 'Scalac':
      return '.scala';
    case 'ScalaDeployJar':
      return '.scala';
    case 'sh':
      return '.sh';
    case 'GZIP':
      return '.sh';
    case 'Genrule':
      return '.sh';
    case 'FileWrite':
      return '.sh';
    case 'TemplateExpand':
      return '.sh';
    case 'swift':
      return '.swift';
    case 'ts':
      return '.ts';
    case 'js':
      return '.js';
    case 'Closure':
      return '.js';
    case 'TestRunner':
      return '.test';
    case 'Commands':
      return '.sh';
    case 'BazelWorkspaceStatusAction':
      return '.sh';
    case 'SkylarkAction':
      return '.sh';
    case 'Middleman':
      return '.sh';
    case 'PackagingSourcesManifest':
      return '.sh';
    case 'SymlinkTree':
      return '.sh';
    case 'SourceSymlinkManifest':
      return '.sh';
    case 'ExecutableSymlink':
      return '.sh';
    case 'docker':
      return '.docker';
    case 'ImageConfig':
      return '.docker';
    case 'ImageLayer':
      return '.docker';
    case 'SHA256':
      return '.docker';
    case 'android':
      return '.java';
    case 'csharp':
      return '.cs';
    case 'GenProtoDescriptorSet':
      return '.proto';
    case 'GoProtocGen':
      return '.proto';
    case 'ProtoCompile':
      return '.proto';
    case 'GenProto':
      return '.proto';
    case 'proto':
      return '.proto';
    case 'elm':
      return '.elm';
    case 'genmnemonic':
      return '.bazel';
    case 'filegroup':
      return '.bazel';
    case 'platform':
      return '.baze';
    case 'toolchain':
      return '.bazel';
    case 'config':
      return '.bazel';
    case 'constraint':
      return '.bazel';
    case 'alias':
      return '.bazel';
    case 'skylark':
      return '.bazel';
    case 'css':
      return '.css';
    case 'SassCompiler':
      return '.sass';
    case 'TypeScriptCompile':
      return '.ts';
    case 'AngularTemplateCompile':
      return '.ts';
    case 'Rustc':
      return '.rs';
    case 'CoreCompile':
      return '.cs';
    default:
      return '';
  }
}

function byCreatedAtTime(a: InvocationItem, b: InvocationItem): number {
  return b.inv.createdAt - a.inv.createdAt;
}

// async handleCommandInvocationUi(item: InvocationItem | BazelBuildEventItem): Promise<void> {
//   const client = this.client;
//   const api = this.client?.api;
//   if (!(client && api)) {
//     return;
//   }

//   let invocationId = undefined;
//   if (item instanceof InvocationItem) {
//     invocationId = item.inv.invocationId;
//   } else if (item instanceof BazelBuildEventItem) {
//     invocationId = this.state.started?.uuid;
//   }
//   if (!invocationId) {
//     return;
//   }

//   vscode.commands.executeCommand(
//     BuiltInCommands.Open,
//     vscode.Uri.parse(`http://${api.address}/pipeline/${invocationId}`)
//   );
// }

// async handleCommandFileDownload(item: FileItem): Promise<void> {
//   const client = this.client;
//   const api = this.client?.api;
//   if (!(client && api)) {
//     return;
//   }

//   const response = await api.downloadFile(
//     this.state.createWorkspace(),
//     FileKind.EXTERNAL,
//     item.file.uri!
//   );

//   vscode.commands.executeCommand(
//     BuiltInCommands.Open,
//     vscode.Uri.parse(`${api.httpURL()}${response.uri}`)
//   );
// }

// async handleCommandFileClippy(item: FileItem): Promise<void> {
//   if (!item.file.uri) {
//     return;
//   }
//   const fsPath = vscode.Uri.parse(item.file.uri).fsPath;
//   vscode.window.setStatusBarMessage(`"${fsPath}" copied to clipboard`, 3000);
//   return vscode.env.clipboard.writeText(fsPath);
// }

// async handleCommandFileSave(item: FileItem): Promise<void> {
//   const client = this.client;
//   const api = this.client?.api;
//   if (!(client && api)) {
//     return;
//   }
//   const response = await api.downloadFile(
//     this.state.createWorkspace(),
//     FileKind.EXTERNAL,
//     item.file.uri!
//   );
//   const hostDir = api.address.replace(':', '-');
//   const relname = path.join('bzl-out', hostDir, item.file.name!);
//   let rootDir = this.state.workspaceInfo?.localExecRoot!;
//   if (!fs.existsSync(rootDir)) {
//     rootDir = vscode.workspace.rootPath || '.';
//   }
//   const filename = path.join(rootDir, relname);
//   const url = `${api.httpURL()}${response.uri}`;
//   const humanSize = filesize(Long.fromValue(response.size!).toNumber());
//   try {
//     await vscode.window.withProgress<void>(
//       {
//         location: vscode.ProgressLocation.Notification,
//         title: `Downloading ${path.basename(relname)} (${humanSize})`,
//         cancellable: true,
//       },
//       async (
//         progress: vscode.Progress<{ message: string | undefined }>,
//         token: vscode.CancellationToken
//       ): Promise<void> => {
//         return downloadAsset(url, filename, response.mode!, response.sha256);
//       }
//     );
//   } catch (e) {
//     vscode.window.showErrorMessage(e instanceof Error ? e.message : e);
//     return;
//   }
//   const selection = await vscode.window.showInformationMessage(
//     `Saved ${relname} (${humanSize})`,
//     ButtonName.Reveal
//   );
//   if (selection === ButtonName.Reveal) {
//     return vscode.commands.executeCommand(
//       BuiltInCommands.RevealFileInOS,
//       vscode.Uri.file(filename)
//     );
//   }
// }

// async handleCommandActionStderr(item: ActionExecutedFailedItem): Promise<void> {
//   if (!(item instanceof ActionExecutedFailedItem)) {
//     return;
//   }
//   return this.openFile(item.event.bes.action?.stderr);
// }

// async handleCommandActionStdout(item: ActionExecutedFailedItem): Promise<void> {
//   if (!(item instanceof ActionExecutedFailedItem)) {
//     return;
//   }
//   return this.openFile(item.event.bes.action?.stdout);
// }

// async handleCommandPrimaryOutputFile(item: BazelBuildEventItem): Promise<void> {
//   const file = item.getPrimaryOutputFile();
//   if (!file) {
//     return;
//   }
//   return this.openFile(file);
// }
