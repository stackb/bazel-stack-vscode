// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { ActionResult as _build_bazel_remote_execution_v2_ActionResult, ActionResult__Output as _build_bazel_remote_execution_v2_ActionResult__Output } from '../../../../../build/bazel/remote/execution/v2/ActionResult';
import type { ResultsCachePolicy as _build_bazel_remote_execution_v2_ResultsCachePolicy, ResultsCachePolicy__Output as _build_bazel_remote_execution_v2_ResultsCachePolicy__Output } from '../../../../../build/bazel/remote/execution/v2/ResultsCachePolicy';

/**
 * A request message for
 * [ActionCache.UpdateActionResult][build.bazel.remote.execution.v2.ActionCache.UpdateActionResult].
 */
export interface UpdateActionResultRequest {
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
   * whose result is being uploaded.
   */
  'actionDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * The [ActionResult][build.bazel.remote.execution.v2.ActionResult]
   * to store in the cache.
   */
  'actionResult'?: (_build_bazel_remote_execution_v2_ActionResult | null);
  /**
   * An optional policy for the results of this execution in the remote cache.
   * The server will have a default policy if this is not provided.
   * This may be applied to both the ActionResult and the associated blobs.
   */
  'resultsCachePolicy'?: (_build_bazel_remote_execution_v2_ResultsCachePolicy | null);
}

/**
 * A request message for
 * [ActionCache.UpdateActionResult][build.bazel.remote.execution.v2.ActionCache.UpdateActionResult].
 */
export interface UpdateActionResultRequest__Output {
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
   * whose result is being uploaded.
   */
  'actionDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * The [ActionResult][build.bazel.remote.execution.v2.ActionResult]
   * to store in the cache.
   */
  'actionResult': (_build_bazel_remote_execution_v2_ActionResult__Output | null);
  /**
   * An optional policy for the results of this execution in the remote cache.
   * The server will have a default policy if this is not provided.
   * This may be applied to both the ActionResult and the associated blobs.
   */
  'resultsCachePolicy': (_build_bazel_remote_execution_v2_ResultsCachePolicy__Output | null);
}
