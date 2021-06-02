// Copyright 2018 The Bazel Authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as fs from 'fs';
import * as path from 'path';
import { strings } from 'vscode-common';
import {
  ContinuedEvent,
  DebugSession,
  InitializedEvent,
  OutputEvent,
  Scope,
  Source,
  StackFrame,
  StoppedEvent,

  Thread,
  ThreadEvent,
  Variable
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { Breakpoint } from '../../proto/starlark_debugging/Breakpoint';
import { DebugEvent } from '../../proto/starlark_debugging/DebugEvent';
import { Frame } from '../../proto/starlark_debugging/Frame';
import { PausedThread } from '../../proto/starlark_debugging/PausedThread';
import { PauseReason } from '../../proto/starlark_debugging/PauseReason';
import { Scope as StarlarkScope } from '../../proto/starlark_debugging/Scope';
import { Stepping } from '../../proto/starlark_debugging/Stepping';
import { ThreadContinuedEvent } from '../../proto/starlark_debugging/ThreadContinuedEvent';
import { ThreadPausedEvent } from '../../proto/starlark_debugging/ThreadPausedEvent';
import { Value } from '../../proto/starlark_debugging/Value';
import { BazelDebugConnection } from './connection';
import { Handles } from './handles';
import Long = require('long');

/**
 * Returns a {@code number} equivalent to the given {@code number} or
 * {@code Long}.
 *
 * @param value If a {@code number}, the value itself is returned; if it is a
 *     {@code Long}, its equivalent is returned.
 * @returns A {@code number} equivalent to the given {@code number} or
 *     {@code Long}.
 */
function number64(value: number | Long): number {
  if (value instanceof Number) {
    return value as number;
  }
  return (value as Long).toNumber();
}

/** Arguments that the Bazel debug adapter supports for "attach" requests. */
interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {

  /**
   * The Bazel workspace outputBase.
   */
  outputBase: string;

  /** The working directory in which Bazel will be invoked. */
  cwd: string;

  /** The port number on which the Bazel debug server is running. */
  port?: number;

  /** Indicates whether verbose logging is enabled for the debugger. */
  verbose?: boolean;
}

/** Manages the state of the debugging client's session. */
export class BazelDebugSession extends DebugSession {

  /** workspace root of the bazel server */
  private workspaceCwd = '';

  /** Manages communication with the Bazel debugging server. */
  private bazelConnection: BazelDebugConnection | undefined;

  /** Currently set breakpoints, keyed by source path. */
  private sourceBreakpoints = new Map<string, DebugProtocol.SourceBreakpoint[]>();

  /** Information about paused threads, keyed by thread number. */
  private pausedThreads = new Map<number, PausedThread>();

  /** An auto-indexed mapping of stack frames. */
  private frameHandles = new Handles<Frame>();

  /**
   * An auto-indexed mapping of variables references, which may be either scopes
   * (whose values are directly members of the scope) or values with child
   * values (which need to be requested by contacting the debug server).
   */
  private variableHandles = new Handles<StarlarkScope | Value>();

  /** A mapping from frame reference numbers to thread IDs. */
  private frameThreadIds = new Map<number, number>();

  /** A mapping from scope reference numbers to thread IDs. */
  private scopeThreadIds = new Map<number, number>();

  /** A mapping from value reference numbers to thread IDs. */
  private valueThreadIds = new Map<number, number>();

  /** Initializes a new Bazel debug session. */
  public constructor(
  ) {
    super();

    // Starlark uses 1-based line and column numbers.
    this.setDebuggerLinesStartAt1(true);
    this.setDebuggerColumnsStartAt1(true);
  }

  // Life-cycle requests

  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments,
  ) {
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;
    response.body.supportsConditionalBreakpoints = true;
    response.body.supportsEvaluateForHovers = true;
    
    this.sendResponse(response);
  }

  protected async configurationDoneRequest(
    response: DebugProtocol.ConfigurationDoneResponse,
    args: DebugProtocol.ConfigurationDoneArguments,
  ) {
    // await this.bazelConnection!.sendRequest({
    //   startDebugging: {},
    // });

    this.sendResponse(response);
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: ILaunchRequestArguments,
  ) {
    const port = args.port || 7300;
    const verbose = args.verbose || false;

    this.workspaceCwd = args.cwd;

    this.bazelConnection = new BazelDebugConnection(
      'localhost',
      port,
      this.debugLog,
    );

    this.bazelConnection.on('connect', () => {
      this.sendResponse(response);
      this.sendEvent(new InitializedEvent());
    });

    this.bazelConnection.on('event', (event) => {
      this.handleBazelEvent(event);
    });
  }

  protected disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    args: DebugProtocol.DisconnectArguments,
  ) {
    // Kill the spawned Bazel process on disconnect. The Bazel server will stay
    // up, but this should terminate processing of the invoked command.
    // this.bazelProcess.kill('SIGKILL');
    // this.bazelProcess = null;
    // this.isBazelRunning = false;
    this.sendResponse(response);
    this.shutdown();
  }

  // Breakpoint requests

  protected setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments,
  ) {
    // The path we need to pass to Bazel here depends on how the .bzl file has
    // been loaded. Unfortunately this means we have to create two breakpoints,
    // one for each possible path, because the way the .bzl file is loaded is
    // chosen by the user:
    //
    // 1. If the file is loaded using an explicit repository reference (i.e.,
    //    `@foo//:bar.bzl`), then it will appear in the `external` subdirectory
    //    of Bazel's output_base.
    // 2. If the file is loaded as a same-repository path (i.e., `//:bar.bzl`),
    //    then Bazel will treat it as if it were under `execroot`, which is a
    //    symlink to the actual filesystem location of the file.
    //
    // TODO(allevato): We may be able to simplify this once
    // https://github.com/bazelbuild/bazel/issues/6848 is in a release. const
    const sourcePath = args.source!.path!;
    const breakpoints = args.breakpoints || [];
    this.sourceBreakpoints.set(sourcePath, breakpoints);

    // Convert to Bazel breakpoints.
    const bazelBreakpoints = new Array<Breakpoint>();
    for (const [sourcePath, breakpoints] of this.sourceBreakpoints) {
      for (const breakpoint of breakpoints) {
        bazelBreakpoints.push({
          expression: breakpoint.condition,
          location: {
            lineNumber: breakpoint.line,
            path: sourcePath,
          },
        });
      }
    }

    this.bazelConnection!.sendRequest({
      setBreakpoints: {
        breakpoint: bazelBreakpoints,
      },
    });
    this.sendResponse(response);
  }

  // Thread, stack frame, and variable requests

  protected async threadsRequest(response: DebugProtocol.ThreadsResponse) {
    response.body = {
      threads: Array.from(this.pausedThreads.values()).map((bazelThread) => {
        return new Thread(number64(
          Long.fromValue(bazelThread.id!)),
          bazelThread.name!);
      }),
    };
    this.sendResponse(response);
  }

  protected async stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    args: DebugProtocol.StackTraceArguments,
  ) {
    const event = await this.bazelConnection!.sendRequest({
      listFrames: {
        threadId: args.threadId,
      },
    });

    if (event.listFrames) {
      const bazelFrames = event.listFrames.frame;
      const vsFrames = new Array<StackFrame>();
      for (const bazelFrame of bazelFrames || []) {
        const frameHandle = this.frameHandles.create(bazelFrame);
        this.frameThreadIds.set(frameHandle, args.threadId);

        const location = bazelFrame.location;
        const vsFrame = new StackFrame(
          frameHandle,
          bazelFrame.functionName || '<global scope>',
        );
        if (location) {
          // Resolve the real path to the file, which will make sure that when
          // the user interacts with the stack frame, VS Code loads the file
          // from it's actual path instead of from a location inside Bazel's
          // output base.
          const sourcePath = fs.realpathSync(location.path!);
          vsFrame.source = new Source(path.basename(sourcePath), sourcePath);
          vsFrame.line = location.lineNumber!;
        }
        vsFrames.push(vsFrame);
      }
      response.body = { stackFrames: vsFrames, totalFrames: vsFrames.length };
    }

    this.sendResponse(response);
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    args: DebugProtocol.ScopesArguments,
  ) {
    const frameThreadId = this.frameThreadIds.get(args.frameId)!;
    const bazelFrame = this.frameHandles.get(args.frameId)!;

    const vsScopes = new Array<Scope>();
    for (const bazelScope of bazelFrame.scope!) {
      const scopeHandle = this.variableHandles.create(bazelScope);
      const vsScope = new Scope(bazelScope.name!, scopeHandle);
      vsScopes.push(vsScope);

      // Associate the thread ID from the frame with the scope so that it can be
      // passed through to child values as well.
      this.scopeThreadIds.set(scopeHandle, frameThreadId);
    }

    response.body = { scopes: vsScopes };
    this.sendResponse(response);
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
  ) {
    let bazelValues: Value[] | undefined;
    let threadId: number | undefined;

    const reference = args.variablesReference;
    const scopeOrParentValue = this.variableHandles.get(reference);
    if (isStarlarkScope(scopeOrParentValue)) {
      // If the reference is to a scope, then we ask for the thread ID
      // associated with the scope so that we can associate it later with the
      // top-level values in the scope.
      threadId = this.scopeThreadIds.get(reference);
      bazelValues = (scopeOrParentValue as StarlarkScope).binding;
    } else if (isStarlarkValue(scopeOrParentValue)) {
      // If the reference is to a value, we need to send a request to Bazel to
      // get its child values.
      threadId = this.valueThreadIds.get(reference)!;
      bazelValues = (await this.bazelConnection!.sendRequest({
        getChildren: {
          threadId,
          valueId: (scopeOrParentValue as Value).id,
        },
      })).getChildren!.children;
    } else {
      bazelValues = [];
      threadId = 0;
    }

    const variables = new Array<Variable>();
    for (const value of bazelValues || []) {
      let valueHandle: number;
      if (value.hasChildren && value.id) {
        // Record the value in a handle so that its children can be queried when
        // the user expands it in the UI. We also record the thread ID for the
        // value since we need it when we make that request later.
        valueHandle = this.variableHandles.create(value);
        this.valueThreadIds.set(valueHandle, threadId!);
      } else {
        valueHandle = 0;
      }
      const variable = new Variable(
        value.label!,
        value.description!,
        valueHandle,
      );
      variables.push(variable);
    }

    response.body = { variables };
    this.sendResponse(response);
  }

  protected async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
  ) {
    const threadId = this.frameThreadIds.get(args.frameId!);
    const expr = strings.trim(args.expression, '"');
    const event = (await this.bazelConnection!.sendRequest({
      evaluate: {
        statement: expr,
        threadId,
      },
    }));

    const evaluation = event.evaluate;
    
    let valueHandle: number;
    if (evaluation?.result?.hasChildren && evaluation.result.id) {
      // Record the value in a handle so that its children can be queried when
      // the user expands it in the UI. We also record the thread ID for the
      // value since we need it when we make that request later.
      valueHandle = this.variableHandles.create(evaluation.result);
      this.valueThreadIds.set(valueHandle, threadId!);
    } else {
      valueHandle = 0;
    }

    let valueDescription = evaluation?.result?.description || event.error?.message || '';

    if (event.error) {
      this.valueThreadIds.forEach((tId, handle) => {
        if (valueHandle) {
          // already found
          return;
        }
        if (tId !== threadId) {
          // not this thread
          return;
        }
        const value = this.variableHandles.get(handle);
        if (!isStarlarkValue(value)) {
          return;
        }
        if (value.label === expr) {
          valueHandle = handle;
          valueDescription = value.description!;
        }
      });
    }
    
    response.body = {
      result: valueDescription,
      variablesReference: valueHandle,
    };
    this.sendResponse(response);
  }

  // Execution/control flow requests

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    args: DebugProtocol.ContinueArguments,
  ) {
    response.body = { allThreadsContinued: false };
    this.sendControlFlowRequest(args.threadId, Stepping.NONE);
    this.sendResponse(response);
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    args: DebugProtocol.NextArguments,
  ) {
    this.sendControlFlowRequest(args.threadId, Stepping.OVER);
    this.sendResponse(response);
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    args: DebugProtocol.StepInArguments,
  ) {
    this.sendControlFlowRequest(args.threadId, Stepping.INTO);
    this.sendResponse(response);
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    args: DebugProtocol.StepOutArguments,
  ) {
    this.sendControlFlowRequest(args.threadId, Stepping.OUT);
    this.sendResponse(response);
  }

  /**
   * Sends a request to Bazel to continue the execution of the given thread,
   * with stepping behavior.
   *
   * @param threadId The identifier of the thread to continue.
   * @param stepping The stepping behavior of the request (OVER, INTO, OUT, or
   *     NONE).
   */
  private sendControlFlowRequest(
    threadId: number,
    stepping: Stepping,
  ) {
    // Clear out all the cached state when the user resumes a thread.
    this.frameHandles.clear();
    this.variableHandles.clear();
    this.frameThreadIds.clear();
    this.scopeThreadIds.clear();
    this.valueThreadIds.clear();

    this.bazelConnection!.sendRequest({
      continueExecution: {
        stepping,
        threadId,
      },
    });
  }

  /**
   * Dispatches an asynchronous Bazel debug event received from the server.
   *
   * @param event The event that was received from the server.
   */
  private handleBazelEvent(event: DebugEvent) {
    switch (event.payload) {
      case 'threadPaused':
        this.handleThreadPaused(event.threadPaused!);
        break;
      case 'threadContinued':
        this.handleThreadContinued(event.threadContinued!);
        break;
      default:
        break;
    }
  }

  private handleThreadPaused(event: ThreadPausedEvent) {
    const threadId = number64(Long.fromValue(event.thread!.id!));
    let pauseReason: string = 'a breakpoint';
    if (event.thread?.pauseReason) {
      pauseReason = PauseReason[event.thread!.pauseReason!].toString();
    }
    this.pausedThreads.set(
      threadId,
      event.thread!);
    this.sendEvent(new ThreadEvent(event.thread?.name!, threadId));
    this.sendEvent(new StoppedEvent(pauseReason, threadId));
  }

  private handleThreadContinued(
    event: ThreadContinuedEvent,
  ) {
    const threadId: number = number64(Long.fromValue(event.threadId!));
    this.sendEvent(new ContinuedEvent(threadId));
    this.pausedThreads.delete(threadId);
  }


	/**
	 * Handle custom requests.
   * @override
	 */
	protected customRequest(command: string, response: DebugProtocol.Response, args: any): void {
		switch (command) {
			case 'shutdown':
        this.stop();
        this.shutdown();
				break;
			default:
				super.customRequest(command, response, args);
				break;
		}
	}

  /**
   * Sends output events to the client to log messages and optional
   * pretty-printed objects.
   */
  private debugLog(message: string, ...objects: object[]) {
    this.sendEvent(new OutputEvent(message, 'console'));
    for (const object of objects) {
      const s = JSON.stringify(object, undefined, 2);
      if (s) {
        this.sendEvent(new OutputEvent(`\n${s}`, 'console'));
      }
    }
    this.sendEvent(new OutputEvent('\n', 'console'));
  }
}

function isStarlarkScope(scopeOrParentValue: StarlarkScope | Value | undefined): scopeOrParentValue is StarlarkScope {
  if (!scopeOrParentValue) {
    return false;
  }
  return (scopeOrParentValue as StarlarkScope).name !== undefined;
}

function isStarlarkValue(scopeOrParentValue: StarlarkScope | Value | undefined): scopeOrParentValue is Value {
  if (!scopeOrParentValue) {
    return false;
  }
  return (scopeOrParentValue as Value).id !== undefined;
}

// Start the debugging session.
DebugSession.run(BazelDebugSession);