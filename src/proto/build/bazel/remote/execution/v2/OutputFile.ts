// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { NodeProperty as _build_bazel_remote_execution_v2_NodeProperty, NodeProperty__Output as _build_bazel_remote_execution_v2_NodeProperty__Output } from '../../../../../build/bazel/remote/execution/v2/NodeProperty';

/**
 * An `OutputFile` is similar to a
 * [FileNode][build.bazel.remote.execution.v2.FileNode], but it is used as an
 * output in an `ActionResult`. It allows a full file path rather than
 * only a name.
 */
export interface OutputFile {
  /**
   * The full path of the file relative to the working directory, including the
   * filename. The path separator is a forward slash `/`. Since this is a
   * relative path, it MUST NOT begin with a leading forward slash.
   */
  'path'?: (string);
  /**
   * The digest of the file's content.
   */
  'digest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * True if file is executable, false otherwise.
   */
  'isExecutable'?: (boolean);
  /**
   * The contents of the file if inlining was requested. The server SHOULD NOT
   * inline file contents unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'contents'?: (Buffer | Uint8Array | string);
  /**
   * The supported node properties of the OutputFile, if requested by the
   * Action.
   */
  'nodeProperties'?: (_build_bazel_remote_execution_v2_NodeProperty)[];
}

/**
 * An `OutputFile` is similar to a
 * [FileNode][build.bazel.remote.execution.v2.FileNode], but it is used as an
 * output in an `ActionResult`. It allows a full file path rather than
 * only a name.
 */
export interface OutputFile__Output {
  /**
   * The full path of the file relative to the working directory, including the
   * filename. The path separator is a forward slash `/`. Since this is a
   * relative path, it MUST NOT begin with a leading forward slash.
   */
  'path': (string);
  /**
   * The digest of the file's content.
   */
  'digest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * True if file is executable, false otherwise.
   */
  'isExecutable': (boolean);
  /**
   * The contents of the file if inlining was requested. The server SHOULD NOT
   * inline file contents unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'contents': (Buffer);
  /**
   * The supported node properties of the OutputFile, if requested by the
   * Action.
   */
  'nodeProperties': (_build_bazel_remote_execution_v2_NodeProperty__Output)[];
}
