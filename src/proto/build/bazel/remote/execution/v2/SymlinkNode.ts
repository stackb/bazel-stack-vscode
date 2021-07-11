// Original file: proto/remote_execution.proto

import type { NodeProperty as _build_bazel_remote_execution_v2_NodeProperty, NodeProperty__Output as _build_bazel_remote_execution_v2_NodeProperty__Output } from '../../../../../build/bazel/remote/execution/v2/NodeProperty';

/**
 * A `SymlinkNode` represents a symbolic link.
 */
export interface SymlinkNode {
  /**
   * The name of the symlink.
   */
  'name'?: (string);
  /**
   * The target path of the symlink. The path separator is a forward slash `/`.
   * The target path can be relative to the parent directory of the symlink or
   * it can be an absolute path starting with `/`. Support for absolute paths
   * can be checked using the
   * [Capabilities][build.bazel.remote.execution.v2.Capabilities] API. The
   * canonical form forbids the substrings `/./` and `//` in the target path.
   * `..` components are allowed anywhere in the target path.
   */
  'target'?: (string);
  /**
   * The node properties of the SymlinkNode.
   */
  'nodeProperties'?: (_build_bazel_remote_execution_v2_NodeProperty)[];
}

/**
 * A `SymlinkNode` represents a symbolic link.
 */
export interface SymlinkNode__Output {
  /**
   * The name of the symlink.
   */
  'name': (string);
  /**
   * The target path of the symlink. The path separator is a forward slash `/`.
   * The target path can be relative to the parent directory of the symlink or
   * it can be an absolute path starting with `/`. Support for absolute paths
   * can be checked using the
   * [Capabilities][build.bazel.remote.execution.v2.Capabilities] API. The
   * canonical form forbids the substrings `/./` and `//` in the target path.
   * `..` components are allowed anywhere in the target path.
   */
  'target': (string);
  /**
   * The node properties of the SymlinkNode.
   */
  'nodeProperties': (_build_bazel_remote_execution_v2_NodeProperty__Output)[];
}
