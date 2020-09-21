import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import * as vscode from 'vscode';
import { CancelRequest } from '../proto/build/stack/bezel/v1beta1/CancelRequest';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { EnvironmentVariable } from '../proto/build/stack/bezel/v1beta1/EnvironmentVariable';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { ActionExecuted } from '../proto/build_event_stream/ActionExecuted';
import { BuildEvent as BazelBuildEvent } from '../proto/build_event_stream/BuildEvent';
import { Progress } from '../proto/build_event_stream/Progress';
import { BuildEvent } from '../proto/google/devtools/build/v1/BuildEvent';
import { OrderedBuildEvent } from '../proto/google/devtools/build/v1/OrderedBuildEvent';
import { CommandTaskConfiguration } from './configuration';
import path = require('path');

const buildEventStreamProtoFile = path.join('..', '..', 'proto', 'build_event_stream.proto');

interface Resolver<T> {
    resolve: (value: T | PromiseLike<T> | undefined) => void
    reject: (reason: any) => void
}

export interface CommandTaskRunner {
    runTask(
        ruleClasses: string[],
        request: RunRequest,
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
        additionalMatchers?: string[],
    ): Promise<void>;
}

/**
 * Runs a command and pipes the output to a channel.
 */
export class BzlServerCommandRunner implements vscode.Disposable, CommandTaskRunner {

    private disposables: vscode.Disposable[] = [];
    private output: vscode.OutputChannel;

    public onDidRunCommand: vscode.EventEmitter<RunRequest> = new vscode.EventEmitter<RunRequest>();

    constructor(
        protected taskConfiguration: CommandTaskConfiguration,
        protected client: CommandServiceClient,
    ) {
        this.output = vscode.window.createOutputChannel('Bazel Output');
        this.disposables.push(this.output);
    }

    async newBuildEventStreamHandler(): BuildEventHandler {
        const root = await protobuf.load(buildEventStreamProtoFile);
        const buildEventType = root.lookupType('build_event_stream.BuildEvent');
        return new BuildEventHandler(buildEventType);

    }
    async cancel(
        request: CancelRequest,
        md: grpc.Metadata = new grpc.Metadata(),
    ): Promise<CancelResponse> {
        return new Promise((resolve, reject) => {
            this.client.cancel(request, md, (err: grpc.ServiceError | undefined, response: CancelResponse | undefined) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response!);
                }
            });
        });
    }

    async runTask(
        ruleClasses: string[],
        request: RunRequest,
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
        additionalMatchers?: string[],
    ): Promise<void> {

        const ruleClassMatchers = this.taskConfiguration.ruleClassMatchers;
        let matcherSet = new Set<string>();
        addAll(matcherSet, ruleClassMatchers.get('#all'));
        for (const ruleClass of ruleClasses) {
            addAll(matcherSet, ruleClassMatchers.get(ruleClass));
        }
        addAll(matcherSet, additionalMatchers);
        const matchers = Array.from(matcherSet.values());
        matchers.reverse();

        return vscode.window.withProgress<void>(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${request.arg?.join(' ')}`,
                cancellable: true,
            }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {

                let run: RunCommandTask<void>;

                return new Promise<void>(async (resolve, reject) => {
                    run = new RunCommandTask<void>(
                        { resolve, reject },
                        'bzl-run',
                        'bzl-run',
                        this.client,
                        request,
                        matchers,
                        progress,
                        token,
                        callback,
                    );

                    await vscode.tasks.executeTask(run.newTask());

                }).finally(() => {
                    this.onDidRunCommand.fire(request);
                    if (run) {
                        run.dispose();
                    }
                });
            });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

}


export abstract class PseudoterminalTask implements vscode.Pseudoterminal {
    protected writeEmitter = new vscode.EventEmitter<string>();
    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    protected closeEmitter = new vscode.EventEmitter<void>();
    onDidClose: vscode.Event<void> = this.closeEmitter.event;

    async open(initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
        return this.execute();
    }

    async close(): Promise<void> {
        this.closeEmitter.fire();
    }

    protected abstract async execute(): Promise<void>;
}

class RunCommandTask<T> extends PseudoterminalTask implements vscode.Disposable {
    private commandId: string | undefined;
    private disposables: vscode.Disposable[] = [];
    private lastLine: string | undefined;

    constructor(
        private resolver: Resolver<T>,
        private taskType: string,
        private taskSource: string,
        private client: CommandServiceClient,
        private request: RunRequest,
        private matchers: string[],
        private progress: vscode.Progress<{ message: string }>,
        private token: vscode.CancellationToken,
        private callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
    ) {
        super();

        token.onCancellationRequested(this.cancel, this, this.disposables);
        this.onDidClose(this.cancel, this, this.disposables);
    }

    newTask(): vscode.Task {
        const name = this.request.arg!.join(' ');

        disposeTerminalsByName(name);

        const taskDefinition: vscode.TaskDefinition = {
            type: this.taskType,
        };
        const scope = vscode.TaskScope.Workspace;
        const source = this.taskSource;
        const execution = new vscode.CustomExecution(async () => this);
        const task = new vscode.Task(taskDefinition, scope, name, source, execution, this.matchers);
        task.presentationOptions = {
            clear: true,
            echo: false,
            showReuseMessage: false,
            panel: vscode.TaskPanelKind.Shared,
        };

        return task;
    }

    async cancel(): Promise<void> {
        if (!this.commandId) {
            return Promise.resolve();
        }

        const commandId = this.commandId;
        this.commandId = '';

        // using 'resolve' here rather than 'reject' as 'reject' will produce an
        // error message after the withProgress completes...
        this.resolver.resolve(undefined);

        return new Promise((resolve, reject) => {
            this.client.cancel({ commandId, workspace: this.request.workspace }, new grpc.Metadata(), (err: grpc.ServiceError | undefined, response: CancelResponse | undefined) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    async execute(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const stream = this.client.run(this.request, new grpc.Metadata());

            stream.on('data', (response: RunResponse) => {
                this.commandId = response.commandId;

                this.callback(undefined, undefined, response);

                if (response.standardError instanceof Buffer) {
                    this.writeLines(response.standardError.toString());
                }
                if (response.standardOutput instanceof Buffer) {
                    this.writeLines(response.standardOutput.toString());
                }
                if (response.execRequest) {
                    this.spawn(response.execRequest);
                }
            });

            stream.on('metadata', (md: grpc.Metadata) => {
                this.callback(undefined, md, undefined);
            });

            stream.on('error', (err: Error) => {
                this.callback(err as grpc.ServiceError, undefined, undefined);
                reject(err.message);
                this.resolver.resolve(undefined);
            });

            stream.on('end', () => {
                resolve();
                this.resolver.resolve(undefined);
                this.closeEmitter.fire();
            });
        });
    }

    private async spawn(request: ExecRequest): Promise<void> {
        vscode.tasks.executeTask(new ExecTask(request).newTask());
    }

    private writeLines(chunk: string, reportFirstLine = false): void {
        if (!chunk) {
            return;
        }
        const lines = chunk.split('\n');
        if (reportFirstLine && lines.length) {
            this.progress.report({ message: lines[0] });
        }
        for (let i = 0; i < lines.length; i++) {
            if (!lines[i]) {
                continue;
            }
            if (i === 0 && lines[i] === this.lastLine) {
                continue;
            }
            if (i > 0 && lines[i] === lines[i - 1]) {
                continue;
            }
            this.writeEmitter.fire(lines[i].trim() + '\r\n');
        }

        this.lastLine = lines.pop();
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}

class ExecTask {
    private name: string;

    constructor(private request: ExecRequest) {
        this.name = this.request.argv?.join(' ')!;
    }

    newTask(): vscode.Task {
        disposeTerminalsByName(this.name);

        const taskDefinition: vscode.TaskDefinition = {
            type: this.name,
        };
        const scope = vscode.TaskScope.Workspace;
        const source = this.name;
        const argv = this.request.argv || [];
        const execution = new vscode.ProcessExecution(argv.shift()!, argv, {
            env: makeEnv(this.request.environmentVariable || []),
            cwd: this.request.workingDirectory,
        });
        const task = new vscode.Task(taskDefinition, scope, this.name, source, execution);
        task.presentationOptions = {
            clear: true,
            echo: false,
            showReuseMessage: false,
            panel: vscode.TaskPanelKind.Shared,
        };

        return task;
    }
}

type Env = { [key: string]: string; };

function makeEnv(vars: EnvironmentVariable[]): Env {
    const env: Env = {};
    for (const v of vars) {
        env[v.Name!] = v.value!;
    }
    return env;
}

function addAll<T>(set: Set<T>, items: T[] | undefined) {
    if (!items) {
        return;
    }
    for (const item of items) {
        set.add(item);
    }
}

function disposeTerminalsByName(name: string): void {
    setTimeout(() => {
        vscode.window.terminals.forEach(terminal => {
            if (terminal.name === `Task - ${name}`) {
                terminal.dispose();
            }
        });
    }, 0);
}

class BuildEventProtocolHandler {
    constructor(
        protected buildEventType: protobuf.Type,
    ) {
    }

    async handleOrderedBuildEvent(obe: OrderedBuildEvent): Promise<void> {
        if (obe.event) {
            return this.handleBuildEvent(obe, obe.event);
        }
    }

    async handleBuildEvent(obe: OrderedBuildEvent, be: BuildEvent): Promise<void> {
        if (!be.bazelEvent) {
            return;
        }
        const any = be.bazelEvent as {
            type_url: string;
            value: Buffer | Uint8Array | string;
        };
        switch (any.type_url) {
            case 'build_event_stream.BuildEvent':
                return this.handleBazelBuildEvent(obe, be, this.makeBazelBuildEvent(any.value as Uint8Array));
            default:
                console.warn(`Unknown any type: ${any.type_url}`);
        }
    }

    async handleBazelBuildEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BazelBuildEvent) {
        switch (e.payload) {
            case 'progress':
                return this.handleProgressEvent(obe, be, e, e.progress!);
            case 'action':
                return this.handleActionExecutedEvent(obe, be, e, e.action!);
        }
    }

    makeBazelBuildEvent(data: Uint8Array): BazelBuildEvent {
        return this.buildEventType.toObject(this.buildEventType.decode(data), {
            // keepCase: false,
            longs: String,
            enums: String,
            defaults: false,
            oneofs: true
        });
    }

    async handleProgressEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BazelBuildEvent, progress: Progress) {
    }

    async handleActionExecutedEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BazelBuildEvent, action: ActionExecuted) {
    }
}

class BuildEventProtocolDiagnosticsReporter extends BuildEventProtocolHandler implements vscode.Disposable {
    protected disposables: vscode.Disposable[] = [];

    // /** The diagnostics collection for action. */
    // private diagnosticsCollection =
    //     vscode.languages.createDiagnosticCollection('bep');

    constructor(
        buildEventType: protobuf.Type,
        protected providers: DiagnosticProviderManager,
        protected diagnostics: vscode.DiagnosticCollection,
        protected token: vscode.CancellationToken,
    ) {
        super(buildEventType);
    }

    async handleActionExecutedEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BazelBuildEvent, action: ActionExecuted) {
        if (action.success) {
            return;
        }

        const provider = this.providers.getProvider(action.type!);
        if (!provider) {
            return;
        }
        
        return provider.handleEvent<ActionExecuted>(action, this.diagnostics, this.token);
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