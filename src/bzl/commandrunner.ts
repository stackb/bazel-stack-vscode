import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import * as vscode from 'vscode';
import { Telemetry } from '../constants';
import { Container } from '../container';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { EnvironmentVariable } from '../proto/build/stack/bezel/v1beta1/EnvironmentVariable';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { BuildEvent as BuildEventStreamEvent } from '../proto/build_event_stream/BuildEvent';
import { BuildEvent } from '../proto/google/devtools/build/v1/BuildEvent';
import { OrderedBuildEvent } from '../proto/google/devtools/build/v1/OrderedBuildEvent';
import { BzlClient } from './bzlclient';
import { CommandTaskConfiguration } from './configuration';
import { MatcherName } from './constants';
import path = require('path');

interface Resolver<T> {
    resolve: (value: T | PromiseLike<T> | undefined) => void
    reject: (reason: any) => void
}

export interface BazelBuildEvent {
    obe: OrderedBuildEvent
    be: BuildEvent
    bes: BuildEventStreamEvent
    token: vscode.CancellationToken
}

export interface CommandTaskRunner {
    runTask(
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
    /** The diagnostics collection for bep events. */
    private buildEventType: Promise<protobuf.Type>;
    private client: BzlClient | undefined;

    public onDidRunCommand = new vscode.EventEmitter<RunRequest>();
    public onDidReceiveBazelBuildEvent = new vscode.EventEmitter<BazelBuildEvent>();

    constructor(
        protected taskConfiguration: CommandTaskConfiguration,
        protected onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        this.output = vscode.window.createOutputChannel('Bazel Output');
        this.disposables.push(this.output);
        this.disposables.push(this.onDidReceiveBazelBuildEvent);
        this.buildEventType = new Promise((resolve, reject) => {
            const root = protobuf.load(taskConfiguration.buildEventStreamProtofile).then(root => {
                resolve(root.lookupType('build_event_stream.BuildEvent'));
            }, reject);
        });
        onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
    }
    
    handleBzlClientChange(client: BzlClient) {
        this.client = client;
    }
    
    async newBuildEventProtocolHandler(token: vscode.CancellationToken): Promise<BuildEventProtocolHandler> {
        return new BuildEventProtocolHandler(await this.buildEventType, this.onDidReceiveBazelBuildEvent, token);

    }
    
    async runTask(
        request: RunRequest,
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
    ): Promise<void> {
        const client = this.client;
        if (!client) {
            return Promise.reject('bzl client not available');
        }

        Container.telemetry.sendTelemetryEvent(Telemetry.BzlRunTask);

        return vscode.window.withProgress<void>(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${request.arg?.join(' ')}`,
                cancellable: true,
            }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {

                if (this.taskConfiguration.bazelExecutable) {
                    request.workspace!.bazelBinary = this.taskConfiguration.bazelExecutable;
                }
                if (this.taskConfiguration.bazelVersion) {
                    request.workspace!.bazelVersion = this.taskConfiguration.bazelVersion;
                }
                request.actionEvents = true;
                const bepHandler = await this.newBuildEventProtocolHandler(token);
                const proxyCallback = (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => {
                    if (response) {
                        bepHandler.handleOrderedBuildEvents(response.orderedBuildEvent);
                    }
                    callback(err, md, response);
                };

                let run: RunCommandTask<void>;

                return new Promise<void>(async (resolve, reject) => {
                    run = new RunCommandTask<void>(
                        { resolve, reject },
                        'bzl-run',
                        'bzl-run',
                        client,
                        request,
                        progress,
                        token,
                        proxyCallback,
                    );

                    return vscode.tasks.executeTask(run.newTask());

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
        private client: BzlClient,
        private request: RunRequest,
        private progress: vscode.Progress<{ message: string }>,
        token: vscode.CancellationToken,
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
        const task = new vscode.Task(taskDefinition, scope, name, source, execution, [MatcherName.Bazel]);
        task.presentationOptions = {
            clear: true,
            echo: false,
            showReuseMessage: false,
            panel: vscode.TaskPanelKind.Shared,
        };
        task.group = vscode.TaskGroup.Rebuild;
        
        return task;
    }

    async cancel(): Promise<CancelResponse | undefined> {
        if (!this.commandId) {
            return Promise.resolve(undefined);
        }

        const commandId = this.commandId;
        this.commandId = '';

        // using 'resolve' here rather than 'reject' as 'reject' will produce an
        // error message after the withProgress completes...
        this.resolver.resolve(undefined);

        return this.client.cancelCommand({ 
            commandId, 
            workspace: this.request.workspace });
    }

    async execute(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const stream = this.client.commands.run(this.request, new grpc.Metadata());

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
        protected emitter: vscode.EventEmitter<BazelBuildEvent>,
        protected token: vscode.CancellationToken,
    ) {
    }

    async handleOrderedBuildEvents(obes: OrderedBuildEvent[] | undefined): Promise<void> {
        if (!obes) {
            return;
        }
        for (const obe of obes) {
            this.handleOrderedBuildEvent(obe);
        }
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
            case 'type.googleapis.com/build_event_stream.BuildEvent':
                return this.handleBazelBuildEvent(obe, be, this.makeBesBuildEvent(any.value as Uint8Array));
            default:
                console.warn(`Unknown any type: ${any.type_url}`);
        }
    }

    async handleBazelBuildEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BuildEventStreamEvent) {
        // console.log(`handleBazelBuildEvent "${e.payload}"`);
        this.emitter.fire({
            obe: obe,
            be: be,
            bes: e,
            token: this.token,
        });
    }

    makeBesBuildEvent(data: Uint8Array): BuildEventStreamEvent {
        return this.buildEventType.toObject(this.buildEventType.decode(data), {
            // keepCase: false,
            longs: String,
            enums: String,
            defaults: false,
            oneofs: true
        });
    }

}
