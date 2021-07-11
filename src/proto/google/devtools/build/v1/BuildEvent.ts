// Original file: proto/build_events.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';
import type { Any as _google_protobuf_Any, Any__Output as _google_protobuf_Any__Output } from '../../../../google/protobuf/Any';
import type { BuildStatus as _google_devtools_build_v1_BuildStatus, BuildStatus__Output as _google_devtools_build_v1_BuildStatus__Output } from '../../../../google/devtools/build/v1/BuildStatus';
import type { ConsoleOutputStream as _google_devtools_build_v1_ConsoleOutputStream } from '../../../../google/devtools/build/v1/ConsoleOutputStream';
import type { Long } from '@grpc/proto-loader';

/**
 * Notification of the end of a build event stream published by a build
 * component other than CONTROLLER (See StreamId.BuildComponents).
 */
export interface _google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished {
  /**
   * How the event stream finished.
   */
  'type'?: (_google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished_FinishType | keyof typeof _google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished_FinishType);
}

/**
 * Notification of the end of a build event stream published by a build
 * component other than CONTROLLER (See StreamId.BuildComponents).
 */
export interface _google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished__Output {
  /**
   * How the event stream finished.
   */
  'type': (_google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished_FinishType);
}

/**
 * Notification that the build request is enqueued.
 */
export interface _google_devtools_build_v1_BuildEvent_BuildEnqueued {
  /**
   * Additional details about the Build.
   */
  'details'?: (_google_protobuf_Any | null);
}

/**
 * Notification that the build request is enqueued.
 */
export interface _google_devtools_build_v1_BuildEvent_BuildEnqueued__Output {
  /**
   * Additional details about the Build.
   */
  'details': (_google_protobuf_Any__Output | null);
}

/**
 * Notification that the build request has finished, and no further
 * invocations will occur.  Note that this applies to the entire Build.
 * Individual invocations trigger InvocationFinished when they finish.
 */
export interface _google_devtools_build_v1_BuildEvent_BuildFinished {
  /**
   * Final status of the build.
   */
  'status'?: (_google_devtools_build_v1_BuildStatus | null);
}

/**
 * Notification that the build request has finished, and no further
 * invocations will occur.  Note that this applies to the entire Build.
 * Individual invocations trigger InvocationFinished when they finish.
 */
export interface _google_devtools_build_v1_BuildEvent_BuildFinished__Output {
  /**
   * Final status of the build.
   */
  'status': (_google_devtools_build_v1_BuildStatus__Output | null);
}

/**
 * Textual output written to standard output or standard error.
 */
export interface _google_devtools_build_v1_BuildEvent_ConsoleOutput {
  /**
   * The output stream type.
   */
  'type'?: (_google_devtools_build_v1_ConsoleOutputStream | keyof typeof _google_devtools_build_v1_ConsoleOutputStream);
  /**
   * Regular UTF-8 output; normal text.
   */
  'textOutput'?: (string);
  /**
   * Used if the output is not UTF-8 text (for example, a binary proto).
   */
  'binaryOutput'?: (Buffer | Uint8Array | string);
  /**
   * The output stream content.
   */
  'output'?: "textOutput"|"binaryOutput";
}

/**
 * Textual output written to standard output or standard error.
 */
export interface _google_devtools_build_v1_BuildEvent_ConsoleOutput__Output {
  /**
   * The output stream type.
   */
  'type': (_google_devtools_build_v1_ConsoleOutputStream);
  /**
   * Regular UTF-8 output; normal text.
   */
  'textOutput'?: (string);
  /**
   * Used if the output is not UTF-8 text (for example, a binary proto).
   */
  'binaryOutput'?: (Buffer);
  /**
   * The output stream content.
   */
  'output': "textOutput"|"binaryOutput";
}

// Original file: proto/build_events.proto

/**
 * How did the event stream finish.
 */
export enum _google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished_FinishType {
  /**
   * Unknown or unspecified; callers should never set this value.
   */
  FINISH_TYPE_UNSPECIFIED = 0,
  /**
   * Set by the event publisher to indicate a build event stream is
   * finished.
   */
  FINISHED = 1,
  /**
   * Set by the WatchBuild RPC server when the publisher of a build event
   * stream stops publishing events without publishing a
   * BuildComponentStreamFinished event whose type equals FINISHED.
   */
  EXPIRED = 2,
}

/**
 * Notification that an invocation attempt has finished.
 */
export interface _google_devtools_build_v1_BuildEvent_InvocationAttemptFinished {
  /**
   * Final status of the invocation.
   */
  'invocationStatus'?: (_google_devtools_build_v1_BuildStatus | null);
}

/**
 * Notification that an invocation attempt has finished.
 */
export interface _google_devtools_build_v1_BuildEvent_InvocationAttemptFinished__Output {
  /**
   * Final status of the invocation.
   */
  'invocationStatus': (_google_devtools_build_v1_BuildStatus__Output | null);
}

/**
 * Notification that the build system has attempted to run the build tool.
 */
export interface _google_devtools_build_v1_BuildEvent_InvocationAttemptStarted {
  /**
   * The number of the invocation attempt, starting at 1 and increasing by 1
   * for each new attempt. Can be used to determine if there is a later
   * invocation attempt replacing the current one a client is processing.
   */
  'attemptNumber'?: (number | string | Long);
  /**
   * Additional details about the invocation.
   */
  'details'?: (_google_protobuf_Any | null);
}

/**
 * Notification that the build system has attempted to run the build tool.
 */
export interface _google_devtools_build_v1_BuildEvent_InvocationAttemptStarted__Output {
  /**
   * The number of the invocation attempt, starting at 1 and increasing by 1
   * for each new attempt. Can be used to determine if there is a later
   * invocation attempt replacing the current one a client is processing.
   */
  'attemptNumber': (Long);
  /**
   * Additional details about the invocation.
   */
  'details': (_google_protobuf_Any__Output | null);
}

/**
 * An event representing some state change that occurred in the build. This
 * message does not include field for uniquely identifying an event.
 */
export interface BuildEvent {
  /**
   * The timestamp of this event.
   */
  'eventTime'?: (_google_protobuf_Timestamp | null);
  /**
   * An invocation attempt has started.
   */
  'invocationAttemptStarted'?: (_google_devtools_build_v1_BuildEvent_InvocationAttemptStarted | null);
  /**
   * An invocation attempt has finished.
   */
  'invocationAttemptFinished'?: (_google_devtools_build_v1_BuildEvent_InvocationAttemptFinished | null);
  /**
   * The build is enqueued (just inserted to the build queue or put back
   * into the build queue due to a previous build failure).
   */
  'buildEnqueued'?: (_google_devtools_build_v1_BuildEvent_BuildEnqueued | null);
  /**
   * The build has finished. Set when the build is terminated.
   */
  'buildFinished'?: (_google_devtools_build_v1_BuildEvent_BuildFinished | null);
  /**
   * An event containing printed text.
   */
  'consoleOutput'?: (_google_devtools_build_v1_BuildEvent_ConsoleOutput | null);
  /**
   * Indicates the end of a build event stream (with the same StreamId) from
   * a build component executing the requested build task.
   * *** This field does not indicate the WatchBuild RPC is finished. ***
   */
  'componentStreamFinished'?: (_google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished | null);
  /**
   * Structured build event generated by Bazel about its execution progress.
   */
  'bazelEvent'?: (_google_protobuf_Any | null);
  /**
   * An event that contains supplemental tool-specific information about
   * build execution.
   */
  'buildExecutionEvent'?: (_google_protobuf_Any | null);
  /**
   * An event that contains supplemental tool-specific information about
   * source fetching.
   */
  'sourceFetchEvent'?: (_google_protobuf_Any | null);
  /**
   * Events that indicate a state change of a build request in the build
   * queue.
   */
  'event'?: "invocationAttemptStarted"|"invocationAttemptFinished"|"buildEnqueued"|"buildFinished"|"consoleOutput"|"componentStreamFinished"|"bazelEvent"|"buildExecutionEvent"|"sourceFetchEvent";
}

/**
 * An event representing some state change that occurred in the build. This
 * message does not include field for uniquely identifying an event.
 */
export interface BuildEvent__Output {
  /**
   * The timestamp of this event.
   */
  'eventTime': (_google_protobuf_Timestamp__Output | null);
  /**
   * An invocation attempt has started.
   */
  'invocationAttemptStarted'?: (_google_devtools_build_v1_BuildEvent_InvocationAttemptStarted__Output | null);
  /**
   * An invocation attempt has finished.
   */
  'invocationAttemptFinished'?: (_google_devtools_build_v1_BuildEvent_InvocationAttemptFinished__Output | null);
  /**
   * The build is enqueued (just inserted to the build queue or put back
   * into the build queue due to a previous build failure).
   */
  'buildEnqueued'?: (_google_devtools_build_v1_BuildEvent_BuildEnqueued__Output | null);
  /**
   * The build has finished. Set when the build is terminated.
   */
  'buildFinished'?: (_google_devtools_build_v1_BuildEvent_BuildFinished__Output | null);
  /**
   * An event containing printed text.
   */
  'consoleOutput'?: (_google_devtools_build_v1_BuildEvent_ConsoleOutput__Output | null);
  /**
   * Indicates the end of a build event stream (with the same StreamId) from
   * a build component executing the requested build task.
   * *** This field does not indicate the WatchBuild RPC is finished. ***
   */
  'componentStreamFinished'?: (_google_devtools_build_v1_BuildEvent_BuildComponentStreamFinished__Output | null);
  /**
   * Structured build event generated by Bazel about its execution progress.
   */
  'bazelEvent'?: (_google_protobuf_Any__Output | null);
  /**
   * An event that contains supplemental tool-specific information about
   * build execution.
   */
  'buildExecutionEvent'?: (_google_protobuf_Any__Output | null);
  /**
   * An event that contains supplemental tool-specific information about
   * source fetching.
   */
  'sourceFetchEvent'?: (_google_protobuf_Any__Output | null);
  /**
   * Events that indicate a state change of a build request in the build
   * queue.
   */
  'event': "invocationAttemptStarted"|"invocationAttemptFinished"|"buildEnqueued"|"buildFinished"|"consoleOutput"|"componentStreamFinished"|"bazelEvent"|"buildExecutionEvent"|"sourceFetchEvent";
}
