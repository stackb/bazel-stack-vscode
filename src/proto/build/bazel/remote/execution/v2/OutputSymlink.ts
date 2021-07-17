// Original file: proto/remote_execution.proto

import type {
  NodeProperty as _build_bazel_remote_execution_v2_NodeProperty,
  NodeProperty__Output as _build_bazel_remote_execution_v2_NodeProperty__Output,
} from '../../../../../build/bazel/remote/execution/v2/NodeProperty';

/**
 * An `OutputSymlink` is similar to a
 * [Symlink][build.bazel.remote.execution.v2.SymlinkNode], but it is used as an
 * output in an `ActionResult`.
 *
 * `OutputSymlink` is binary-compatible with `SymlinkNode`.
 */
export interface OutputSymlink {
  /**
   * The full path of the symlink relative to the working directory, including
   * the filename. The path separator is a forward slash `/`. Since this is a
   * relative path, it MUST NOT begin with a leading forward slash.
   */
  path?: string;
  /**
   * The target path of the symlink. The path separator is a forward slash `/`.
   * The target path can be relative to the parent directory of the symlink or
   * it can be an absolute path starting with `/`. Support for absolute paths
   * can be checked using the
   * [Capabilities][build.bazel.remote.execution.v2.Capabilities] API. The
   * canonical form forbids the substrings `/./` and `//` in the target path.
   * `..` components are allowed anywhere in the target path.
   */
  target?: string;
  /**
   * The supported node properties of the OutputSymlink, if requested by the
   * Action.
   */
  nodeProperties?: _build_bazel_remote_execution_v2_NodeProperty[];
}

/**
 * An `OutputSymlink` is similar to a
 * [Symlink][build.bazel.remote.execution.v2.SymlinkNode], but it is used as an
 * output in an `ActionResult`.
 *
 * `OutputSymlink` is binary-compatible with `SymlinkNode`.
 */
export interface OutputSymlink__Output {
  /**
   * The full path of the symlink relative to the working directory, including
   * the filename. The path separator is a forward slash `/`. Since this is a
   * relative path, it MUST NOT begin with a leading forward slash.
   */
  path: string;
  /**
   * The target path of the symlink. The path separator is a forward slash `/`.
   * The target path can be relative to the parent directory of the symlink or
   * it can be an absolute path starting with `/`. Support for absolute paths
   * can be checked using the
   * [Capabilities][build.bazel.remote.execution.v2.Capabilities] API. The
   * canonical form forbids the substrings `/./` and `//` in the target path.
   * `..` components are allowed anywhere in the target path.
   */
  target: string;
  /**
   * The supported node properties of the OutputSymlink, if requested by the
   * Action.
   */
  nodeProperties: _build_bazel_remote_execution_v2_NodeProperty__Output[];
}
