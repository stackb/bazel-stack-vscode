import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { BzlClient } from '../bzl/client';
import { CancelResponse } from '../proto/build/stack/bezel/v1beta1/CancelResponse';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { MatcherName } from './constants';

export interface Resolver<T> {
    resolve: (value: T | PromiseLike<T> | undefined) => void
    reject: (reason: any) => void
}

export abstract class PseudoterminalTask implements vscode.Pseudoterminal {
    protected writeEmitter = new vscode.EventEmitter<string>();
    protected closeEmitter = new vscode.EventEmitter<void>();

    onDidWrite: vscode.Event<string> = this.writeEmitter.event;
    onDidClose: vscode.Event<void> = this.closeEmitter.event;

    async open(initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
        return this.execute();
    }

    async close(): Promise<void> {
        this.closeEmitter.fire();
    }

    protected abstract execute(): Promise<void>;
}

export class RunCommandTask<T> extends PseudoterminalTask implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private lastLine: string | undefined;
    private commandId: string | undefined;

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
            workspace: this.request.workspace,
        });
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
                if (response.finished) {
                    // clear the commandID to prevent cancel attempt after it's
                    // already finished
                    this.commandId = '';
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
        // vscode.tasks.executeTask(new ExecTask(request).newTask());
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

function disposeTerminalsByName(name: string): void {
    setTimeout(() => {
        vscode.window.terminals.forEach(terminal => {
            if (terminal.name === `Task - ${name}`) {
                terminal.dispose();
            }
        });
    }, 0);
}
