// Original file: proto/remote_execution.proto

import type { ActionResult as _build_bazel_remote_execution_v2_ActionResult, ActionResult__Output as _build_bazel_remote_execution_v2_ActionResult__Output } from '../../../../../build/bazel/remote/execution/v2/ActionResult';
import type { Status as _google_rpc_Status, Status__Output as _google_rpc_Status__Output } from '../../../../../google/rpc/Status';
import type { LogFile as _build_bazel_remote_execution_v2_LogFile, LogFile__Output as _build_bazel_remote_execution_v2_LogFile__Output } from '../../../../../build/bazel/remote/execution/v2/LogFile';

/**
 * The response message for
 * [Execution.Execute][build.bazel.remote.execution.v2.Execution.Execute],
 * which will be contained in the [response
 * field][google.longrunning.Operation.response] of the
 * [Operation][google.longrunning.Operation].
 */
export interface ExecuteResponse {
  /**
   * The result of the action.
   */
  'result'?: (_build_bazel_remote_execution_v2_ActionResult | null);
  /**
   * True if the result was served from cache, false if it was executed.
   */
  'cachedResult'?: (boolean);
  /**
   * If the status has a code other than `OK`, it indicates that the action did
   * not finish execution. For example, if the operation times out during
   * execution, the status will have a `DEADLINE_EXCEEDED` code. Servers MUST
   * use this field for errors in execution, rather than the error field on the
   * `Operation` object.
   * 
   * If the status code is other than `OK`, then the result MUST NOT be cached.
   * For an error status, the `result` field is optional; the server may
   * populate the output-, stdout-, and stderr-related fields if it has any
   * information available, such as the stdout and stderr of a timed-out action.
   */
  'status'?: (_google_rpc_Status | null);
  /**
   * An optional list of additional log outputs the server wishes to provide. A
   * server can use this to return execution-specific logs however it wishes.
   * This is intended primarily to make it easier for users to debug issues that
   * may be outside of the actual job execution, such as by identifying the
   * worker executing the action or by providing logs from the worker's setup
   * phase. The keys SHOULD be human readable so that a client can display them
   * to a user.
   */
  'serverLogs'?: ({[key: string]: _build_bazel_remote_execution_v2_LogFile});
  /**
   * Freeform informational message with details on the execution of the action
   * that may be displayed to the user upon failure or when requested
   * explicitly.
   */
  'message'?: (string);
}

/**
 * The response message for
 * [Execution.Execute][build.bazel.remote.execution.v2.Execution.Execute],
 * which will be contained in the [response
 * field][google.longrunning.Operation.response] of the
 * [Operation][google.longrunning.Operation].
 */
export interface ExecuteResponse__Output {
  /**
   * The result of the action.
   */
  'result': (_build_bazel_remote_execution_v2_ActionResult__Output | null);
  /**
   * True if the result was served from cache, false if it was executed.
   */
  'cachedResult': (boolean);
  /**
   * If the status has a code other than `OK`, it indicates that the action did
   * not finish execution. For example, if the operation times out during
   * execution, the status will have a `DEADLINE_EXCEEDED` code. Servers MUST
   * use this field for errors in execution, rather than the error field on the
   * `Operation` object.
   * 
   * If the status code is other than `OK`, then the result MUST NOT be cached.
   * For an error status, the `result` field is optional; the server may
   * populate the output-, stdout-, and stderr-related fields if it has any
   * information available, such as the stdout and stderr of a timed-out action.
   */
  'status': (_google_rpc_Status__Output | null);
  /**
   * An optional list of additional log outputs the server wishes to provide. A
   * server can use this to return execution-specific logs however it wishes.
   * This is intended primarily to make it easier for users to debug issues that
   * may be outside of the actual job execution, such as by identifying the
   * worker executing the action or by providing logs from the worker's setup
   * phase. The keys SHOULD be human readable so that a client can display them
   * to a user.
   */
  'serverLogs': ({[key: string]: _build_bazel_remote_execution_v2_LogFile__Output});
  /**
   * Freeform informational message with details on the execution of the action
   * that may be displayed to the user upon failure or when requested
   * explicitly.
   */
  'message': (string);
}
