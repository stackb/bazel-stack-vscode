// Original file: proto/remote_execution.proto

import type { _build_bazel_remote_execution_v2_ExecutionStage_Value } from '../../../../../build/bazel/remote/execution/v2/ExecutionStage';
import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * Metadata about an ongoing
 * [execution][build.bazel.remote.execution.v2.Execution.Execute], which
 * will be contained in the [metadata
 * field][google.longrunning.Operation.response] of the
 * [Operation][google.longrunning.Operation].
 */
export interface ExecuteOperationMetadata {
  /**
   * The current stage of execution.
   */
  stage?:
    | _build_bazel_remote_execution_v2_ExecutionStage_Value
    | keyof typeof _build_bazel_remote_execution_v2_ExecutionStage_Value;
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action]
   * being executed.
   */
  actionDigest?: _build_bazel_remote_execution_v2_Digest | null;
  /**
   * If set, the client can use this name with
   * [ByteStream.Read][google.bytestream.ByteStream.Read] to stream the
   * standard output.
   */
  stdoutStreamName?: string;
  /**
   * If set, the client can use this name with
   * [ByteStream.Read][google.bytestream.ByteStream.Read] to stream the
   * standard error.
   */
  stderrStreamName?: string;
}

/**
 * Metadata about an ongoing
 * [execution][build.bazel.remote.execution.v2.Execution.Execute], which
 * will be contained in the [metadata
 * field][google.longrunning.Operation.response] of the
 * [Operation][google.longrunning.Operation].
 */
export interface ExecuteOperationMetadata__Output {
  /**
   * The current stage of execution.
   */
  stage: _build_bazel_remote_execution_v2_ExecutionStage_Value;
  /**
   * The digest of the [Action][build.bazel.remote.execution.v2.Action]
   * being executed.
   */
  actionDigest: _build_bazel_remote_execution_v2_Digest__Output | null;
  /**
   * If set, the client can use this name with
   * [ByteStream.Read][google.bytestream.ByteStream.Read] to stream the
   * standard output.
   */
  stdoutStreamName: string;
  /**
   * If set, the client can use this name with
   * [ByteStream.Read][google.bytestream.ByteStream.Read] to stream the
   * standard error.
   */
  stderrStreamName: string;
}
