import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { CancelRequest } from '../proto/build/stack/bezel/v1beta1/CancelRequest';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';

interface Resolver<T> {
    resolve: (value: T | PromiseLike<T> | undefined) => void
    reject: (reason: any) => void
}

/**
 * Runs a command and pipes the output to a channel.
 */
export class BzlServerCommandRunner implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private output: vscode.OutputChannel;

    public onDidRunCommand: vscode.EventEmitter<RunRequest> = new vscode.EventEmitter<RunRequest>();

    constructor(
        protected client: CommandServiceClient) {
        this.output = vscode.window.createOutputChannel('Bazel Output');
        this.disposables.push(this.output);
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

    async run(
        request: RunRequest,
        md: grpc.Metadata = new grpc.Metadata(),
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
    ): Promise<void> {
        this.output.clear();
        this.output.show();
        let commandId = '';
        return vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `${request.arg?.join(' ')}`,
                cancellable: true,
            }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {
                // the promise that will become the return value of withProgress
                return new Promise<void>((resolve, reject) => {
                    // start the call
                    const stream = this.client.run(request, md);

                    this.onDidRunCommand.fire(request);
                    
                    token.onCancellationRequested(() => {
                        if (commandId) {
                            this.cancel({ commandId });
                        }
                        reject(new Error('cancelled by user'));
                    });

                    // report response to callback and the output buffer
                    stream.on('data', (response: RunResponse) => {
                        callback(undefined, undefined, response);
                        if (response.standardError instanceof Buffer) {
                            const lines = response.standardError.toString().split('\n');
                            if (lines.length) {
                                progress.report({ message: lines[0] });
                                for (let i = 0; i < lines.length; i++) {
                                    this.output.appendLine(lines[i]);
                                }
                            }
                        }
                        if (response.standardOutput instanceof Buffer) {
                            const chunk = response.standardOutput.toString();
                            if (chunk) {
                                this.output.append(chunk);
                            }
                        }
                    });

                    // report metdata (response headers & trailers)
                    stream.on('metadata', (md: grpc.Metadata) => {
                        callback(undefined, md, undefined);
                    });

                    // report error
                    stream.on('error', (err: Error) => {
                        callback(err as grpc.ServiceError, undefined, undefined);
                        reject(err);
                    });

                    // resolve the promise at the end of the call
                    stream.on('end', () => {
                        resolve();
                    });

                });
            });
    }


    async runTask(
        request: RunRequest,
        matchers: string[],
        callback: (err: grpc.ServiceError | undefined, md: grpc.Metadata | undefined, response: RunResponse | undefined) => void,
    ): Promise<void> {

        // const progress: vscode.Progress<{message: string}> = new class {
        //     report(message: { message: string}) {
        //         console.log(`LOG: ${message}`);
        //     }
        // }();
        // const tokenSource = new vscode.CancellationTokenSource();

        // const run = new RunCommandTask(
        //     'bazelrc', 'bzl',
        //     this.client, request, matchers,
        //     progress, tokenSource.token, callback,
        // );

        // // return new Promise<vscode.TaskExecution>((resolve, reject) => {
        // const execution = vscode.tasks.executeTask(run.newTask());
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
                        'bzl-run', 'bzl-run',
                        this.client, request, matchers,
                        progress, token, callback,
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

        // HACK: cleanup old terminals... don't understand why this should be necessary
        setTimeout(() => {
            vscode.window.terminals.forEach(terminal => {
                if (terminal.name === `Task - ${name}`) {
                    terminal.dispose();
                }
            });    
        }, 0);

        const taskDefinition: vscode.TaskDefinition = {
            type: this.taskType,
        };
        const scope = vscode.TaskScope.Workspace;
        const source = this.taskSource;
        const execution = new vscode.CustomExecution(async () => this);
        const task = new vscode.Task(taskDefinition, scope, name, source, execution, this.matchers);
        task.presentationOptions = {
            clear: true,
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
            if (i > 0 && lines[i] === lines[i-1]) {
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