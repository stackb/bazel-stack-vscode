// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';
import type {
  ExecutionPolicy as _build_bazel_remote_execution_v2_ExecutionPolicy,
  ExecutionPolicy__Output as _build_bazel_remote_execution_v2_ExecutionPolicy__Output,
} from '../../../../../build/bazel/remote/execution/v2/ExecutionPolicy';
import type {
  ResultsCachePolicy as _build_bazel_remote_execution_v2_ResultsCachePolicy,
  ResultsCachePolicy__Output as _build_bazel_remote_execution_v2_ResultsCachePolicy__Output,
} from '../../../../../build/bazel/remote/execution/v2/ResultsCachePolicy';

/**
 * A request message for
 * [Execution.Execute][build.bazel.remote.execution.v2.Execution.Execute].
 */
export interface ExecuteRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  instanceName?: string;
  /**
   * If true, the action will be executed even if its result is already
   * present in the [ActionCache][build.bazel.remote.execution.v2.ActionCache].
   * The execution is still allowed to be merged with other in-flight executions
   * of the same action, however - semantically, the service MUST only guarantee
   * that the results of an execution with this field set were not visible
   * before the corresponding execution request was sent.
   * Note that actions from execution requests setting this field set are still
   * eligible to be entered into the action cache upon completion, and services
   * SHOULD overwrite any existing entries that may exist. This allows
   * skip_cache_lookup requests to be used as a mechanism for replacing action
   * cache entries that reference outputs no longer available or that are
   * poisoned in any way.
   * If false, the result may be served from the action cache.
   */
  skipCacheLookup?: boolean;
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action] to
   * execute.
   */
  actionDigest?: _build_bazel_remote_execution_v2_Digest | null;
  /**
   * An optional policy for execution of the action.
   * The server will have a default policy if this is not provided.
   */
  executionPolicy?: _build_bazel_remote_execution_v2_ExecutionPolicy | null;
  /**
   * An optional policy for the results of this execution in the remote cache.
   * The server will have a default policy if this is not provided.
   * This may be applied to both the ActionResult and the associated blobs.
   */
  resultsCachePolicy?: _build_bazel_remote_execution_v2_ResultsCachePolicy | null;
}

/**
 * A request message for
 * [Execution.Execute][build.bazel.remote.execution.v2.Execution.Execute].
 */
export interface ExecuteRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  instanceName: string;
  /**
   * If true, the action will be executed even if its result is already
   * present in the [ActionCache][build.bazel.remote.execution.v2.ActionCache].
   * The execution is still allowed to be merged with other in-flight executions
   * of the same action, however - semantically, the service MUST only guarantee
   * that the results of an execution with this field set were not visible
   * before the corresponding execution request was sent.
   * Note that actions from execution requests setting this field set are still
   * eligible to be entered into the action cache upon completion, and services
   * SHOULD overwrite any existing entries that may exist. This allows
   * skip_cache_lookup requests to be used as a mechanism for replacing action
   * cache entries that reference outputs no longer available or that are
   * poisoned in any way.
   * If false, the result may be served from the action cache.
   */
  skipCacheLookup: boolean;
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action] to
   * execute.
   */
  actionDigest: _build_bazel_remote_execution_v2_Digest__Output | null;
  /**
   * An optional policy for execution of the action.
   * The server will have a default policy if this is not provided.
   */
  executionPolicy: _build_bazel_remote_execution_v2_ExecutionPolicy__Output | null;
  /**
   * An optional policy for the results of this execution in the remote cache.
   * The server will have a default policy if this is not provided.
   * This may be applied to both the ActionResult and the associated blobs.
   */
  resultsCachePolicy: _build_bazel_remote_execution_v2_ResultsCachePolicy__Output | null;
}
