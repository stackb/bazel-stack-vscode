import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import * as vscode from 'vscode';
import { BazelBuildEvent, BuildEventProtocolHandler } from './bepHandler';
import { Container } from '../container';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { MatcherName } from './constants';
import { Barrier } from 'vscode-common/out/async';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';
import { EnvironmentVariable } from '../proto/build/stack/bezel/v1beta1/EnvironmentVariable';
import { Bzl } from './bzl';
import { InvocationsConfiguration } from './configuration';
import { Settings } from './settings';

export interface CommandTaskRunner {
  runTask(
    request: RunRequest,
    callback: (
      err: grpc.ServiceError | undefined,
      md: grpc.Metadata | undefined,
      response: RunResponse | undefined
    ) => void,
    additionalMatchers?: string[]
  ): Promise<void>;
}

interface RunExecution {
  request: RunRequest;
  cancellation?: vscode.CancellationTokenSource;
}

/**
 * Runs commands in a pseudoterminal.
 */
export class BEPRunner implements vscode.Disposable, vscode.Pseudoterminal {
  protected writeEmitter = new vscode.EventEmitter<string>();
  protected closeEmitter = new vscode.EventEmitter<void>();

  public readonly onDidRunRequest = new vscode.EventEmitter<RunRequest>();
  public readonly onDidReceiveBazelBuildEvent = new vscode.EventEmitter<BazelBuildEvent>();

  private lastLine: string | undefined;
  private disposables: vscode.Disposable[] = [];
  private buildEventType: Promise<protobuf.Type>;
  private currentExecution: RunExecution | undefined;
  private terminal: vscode.Terminal | undefined;
  private terminalIsOpen: Barrier | undefined;

  constructor(protected bzl: Bzl, private invocationSettings: Settings<InvocationsConfiguration>) {
    this.disposables.push(this.writeEmitter);
    this.disposables.push(this.closeEmitter);
    this.disposables.push(this.onDidReceiveBazelBuildEvent);

    this.buildEventType = new Promise((resolve, reject) => {
      const root = protobuf
        .load(Container.protofile('build_event_stream.proto').fsPath)
        .then(root => {
          resolve(root.lookupType('build_event_stream.BuildEvent'));
        }, reject);
    });
  }

  private getTerminal(): vscode.Terminal {
    if (!this.terminal) {
      this.terminalIsOpen = new Barrier();
      this.terminal = vscode.window.createTerminal({
        name: 'Bazel',
        pty: this,
      });
      this.disposables.push(this.terminal);
    }
    return this.terminal;
  }

  async newBuildEventProtocolHandler(
    token: vscode.CancellationToken
  ): Promise<BuildEventProtocolHandler> {
    return new BuildEventProtocolHandler(
      await this.buildEventType,
      this.onDidReceiveBazelBuildEvent,
      token
    );
  }

  async run(request: RunRequest): Promise<void> {
    if (this.currentExecution) {
      vscode.window.setStatusBarMessage('task already running, skipping', 1500);
      throw new Error('task running, skipping invocation');
    }

    const client = this.bzl.client;
    if (!client) {
      throw new Error('run: Bzl Command Server not available');
    }

    const invocation = await this.invocationSettings.get();
    request.actionEvents = invocation.buildEventPublishAllActions;

    const exec = (this.currentExecution = {
      request: request,
      cancellation: new vscode.CancellationTokenSource(),
    });

    this.onDidRunRequest.fire(request);

    const bepHandler = await this.newBuildEventProtocolHandler(exec.cancellation.token);
    let commandId = '';

    const terminal = this.getTerminal();
    this.writeEmitter.fire('\x1bc\x1b[0J\x1b[1J\x1b[2J\x1b[3J\x1b[0;0H');
    terminal.show();
    this.writeEmitter.fire(
      `bazel ${request.arg?.join(' ')}\r\n (to cancel, kill the terminal).\r\n\n`
    );
    await this.terminalIsOpen!.wait();

    const clearExecution = () => {
      this.currentExecution = undefined;
      // this.closeEmitter.fire();
    };

    return new Promise<void>(async (resolve, reject) => {
      const stream = client.commands.run(request, new grpc.Metadata());

      stream.on('end', resolve);
      stream.on('error', (err: Error) => reject(err.message));
      stream.on('data', (response: RunResponse) => {
        bepHandler.handleOrderedBuildEvents(response.orderedBuildEvent);

        if (response.commandId) {
          commandId = response.commandId;
        }
        if (response.finished) {
          // clear the commandID to prevent cancel attempt after it's
          // already finished
          commandId = '';
        }

        if (response.standardError instanceof Buffer) {
          this.writeLines(response.standardError.toString());
        }
        if (response.standardOutput instanceof Buffer) {
          this.writeLines(response.standardOutput.toString());
        }
        if (response.execRequest) {
          vscode.tasks.executeTask(new ExecTask(response.execRequest).newTask());
        }
      });

      exec.cancellation.token.onCancellationRequested(() => {
        stream.cancel();
        reject('cancelled');

        if (commandId) {
          client
            .cancelCommand({
              commandId,
              workspace: request.workspace,
            })
            .then(
              () => vscode.window.showInformationMessage(`Cancelled command ${commandId}`),
              err =>
                vscode.window.showWarningMessage(
                  `Unable to cancel command ${commandId}: ${err.message}`
                )
            );
        }
      });
    }).then(clearExecution, clearExecution);
  }

  private writeLines(chunk: string, reportFirstLine = false): void {
    if (!chunk) {
      return;
    }
    const lines = chunk.split('\n');

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

  // -[ vscode.Pseudoterminal ] -------------------------

  onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  onDidClose: vscode.Event<void> = this.closeEmitter.event;

  async open(initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
    this.terminalIsOpen?.open();
  }

  async close(): Promise<void> {
    if (this.currentExecution) {
      this.currentExecution.cancellation?.cancel();
    }
    this.terminal?.dispose();
    this.terminal = undefined;
  }

  // -[ vscode.Disposable] -------------------------

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
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

type Env = { [key: string]: string };

function makeEnv(vars: EnvironmentVariable[]): Env {
  const env: Env = {};
  for (const v of vars) {
    env[v.Name!] = v.value!;
  }
  return env;
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
