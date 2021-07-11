// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A request message for
 * [ActionCache.GetActionResult][build.bazel.remote.execution.v2.ActionCache.GetActionResult].
 */
export interface GetActionResultRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName'?: (string);
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action]
   * whose result is requested.
   */
  'actionDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * A hint to the server to request inlining stdout in the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] message.
   */
  'inlineStdout'?: (boolean);
  /**
   * A hint to the server to request inlining stderr in the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] message.
   */
  'inlineStderr'?: (boolean);
  /**
   * A hint to the server to inline the contents of the listed output files.
   * Each path needs to exactly match one path in `output_files` in the
   * [Command][build.bazel.remote.execution.v2.Command] message.
   */
  'inlineOutputFiles'?: (string)[];
}

/**
 * A request message for
 * [ActionCache.GetActionResult][build.bazel.remote.execution.v2.ActionCache.GetActionResult].
 */
export interface GetActionResultRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName': (string);
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action]
   * whose result is requested.
   */
  'actionDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * A hint to the server to request inlining stdout in the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] message.
   */
  'inlineStdout': (boolean);
  /**
   * A hint to the server to request inlining stderr in the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] message.
   */
  'inlineStderr': (boolean);
  /**
   * A hint to the server to inline the contents of the listed output files.
   * Each path needs to exactly match one path in `output_files` in the
   * [Command][build.bazel.remote.execution.v2.Command] message.
   */
  'inlineOutputFiles': (string)[];
}
