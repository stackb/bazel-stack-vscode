import * as grpc from '@grpc/grpc-js';
import * as protobuf from 'protobufjs';
import * as vscode from 'vscode';
import { BazelBuildEvent, BuildEventProtocolHandler } from './bepHandler';
import { Container } from '../container';
import { RunCommandTask } from './bepInvoker';
import { RunRequest } from '../proto/build/stack/bezel/v1beta1/RunRequest';
import { RunResponse } from '../proto/build/stack/bezel/v1beta1/RunResponse';
import { Telemetry } from '../constants';
import { BzlClient } from './bzl';

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

/**
 * Runs a command and pipes the output to a channel.
 */
export class BEPRunner implements vscode.Disposable, CommandTaskRunner {
  public onDidRunCommand = new vscode.EventEmitter<RunRequest>();
  public onDidReceiveBazelBuildEvent = new vscode.EventEmitter<BazelBuildEvent>();

  private disposables: vscode.Disposable[] = [];
  private output: vscode.OutputChannel;
  private buildEventType: Promise<protobuf.Type>;
  private bzlClient: BzlClient | undefined;
  private isRunning: boolean = false;

  constructor(protected onDidChangeBzlClient: vscode.Event<BzlClient>) {
    this.output = vscode.window.createOutputChannel('Bazel Output');
    this.disposables.push(this.output);
    this.disposables.push(this.onDidReceiveBazelBuildEvent);
    this.buildEventType = new Promise((resolve, reject) => {
      const root = protobuf
        .load(Container.protofile('build_event_stream.proto').fsPath)
        .then(root => {
          resolve(root.lookupType('build_event_stream.BuildEvent'));
        }, reject);
    });
    onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
  }

  handleBzlClientChange(bzlClient: BzlClient) {
    this.bzlClient = bzlClient;
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

  async runTask(
    request: RunRequest,
    callback: (
      err: grpc.ServiceError | undefined,
      md: grpc.Metadata | undefined,
      response: RunResponse | undefined
    ) => void
  ): Promise<void> {
    const client = this.bzlClient;
    if (!client) {
      return Promise.reject('bzl client not available');
    }

    if (this.isRunning) {
      vscode.window.setStatusBarMessage('task already running, skipping', 1500);
      return Promise.reject('task running, skipping invocation');
    }

    this.isRunning = true;
    Container.telemetry.sendTelemetryEvent(Telemetry.BzlRunTask);

    return vscode.window
      .withProgress<void>(
        {
          location: vscode.ProgressLocation.Notification,
          title: `${request.arg?.join(' ')}`,
          cancellable: true,
        },
        async (
          progress: vscode.Progress<{ message: string | undefined }>,
          token: vscode.CancellationToken
        ): Promise<void> => {
          request.actionEvents = true;

          const bepHandler = await this.newBuildEventProtocolHandler(token);

          const proxyCallback = (
            err: grpc.ServiceError | undefined,
            md: grpc.Metadata | undefined,
            response: RunResponse | undefined
          ) => {
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
              proxyCallback
            );

            return vscode.tasks.executeTask(run.newTask());
          }).finally(() => {
            this.onDidRunCommand.fire(request);
            if (run) {
              run.dispose();
            }
          });
        }
      )
      .then(
        () => {
          this.isRunning = false;
        },
        () => {
          this.isRunning = false;
        }
      );
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}
