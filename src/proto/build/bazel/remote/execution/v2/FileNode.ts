// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { NodeProperty as _build_bazel_remote_execution_v2_NodeProperty, NodeProperty__Output as _build_bazel_remote_execution_v2_NodeProperty__Output } from '../../../../../build/bazel/remote/execution/v2/NodeProperty';

/**
 * A `FileNode` represents a single file and associated metadata.
 */
export interface FileNode {
  /**
   * The name of the file.
   */
  'name'?: (string);
  /**
   * The digest of the file's content.
   */
  'digest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * True if file is executable, false otherwise.
   */
  'isExecutable'?: (boolean);
  /**
   * The node properties of the FileNode.
   */
  'nodeProperties'?: (_build_bazel_remote_execution_v2_NodeProperty)[];
}

/**
 * A `FileNode` represents a single file and associated metadata.
 */
export interface FileNode__Output {
  /**
   * The name of the file.
   */
  'name': (string);
  /**
   * The digest of the file's content.
   */
  'digest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * True if file is executable, false otherwise.
   */
  'isExecutable': (boolean);
  /**
   * The node properties of the FileNode.
   */
  'nodeProperties': (_build_bazel_remote_execution_v2_NodeProperty__Output)[];
}
