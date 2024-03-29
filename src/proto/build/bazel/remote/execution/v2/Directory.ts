// Original file: proto/remote_execution.proto

import type {
  FileNode as _build_bazel_remote_execution_v2_FileNode,
  FileNode__Output as _build_bazel_remote_execution_v2_FileNode__Output,
} from '../../../../../build/bazel/remote/execution/v2/FileNode';
import type {
  DirectoryNode as _build_bazel_remote_execution_v2_DirectoryNode,
  DirectoryNode__Output as _build_bazel_remote_execution_v2_DirectoryNode__Output,
} from '../../../../../build/bazel/remote/execution/v2/DirectoryNode';
import type {
  SymlinkNode as _build_bazel_remote_execution_v2_SymlinkNode,
  SymlinkNode__Output as _build_bazel_remote_execution_v2_SymlinkNode__Output,
} from '../../../../../build/bazel/remote/execution/v2/SymlinkNode';
import type {
  NodeProperty as _build_bazel_remote_execution_v2_NodeProperty,
  NodeProperty__Output as _build_bazel_remote_execution_v2_NodeProperty__Output,
} from '../../../../../build/bazel/remote/execution/v2/NodeProperty';

/**
 * A `Directory` represents a directory node in a file tree, containing zero or
 * more children [FileNodes][build.bazel.remote.execution.v2.FileNode],
 * [DirectoryNodes][build.bazel.remote.execution.v2.DirectoryNode] and
 * [SymlinkNodes][build.bazel.remote.execution.v2.SymlinkNode].
 * Each `Node` contains its name in the directory, either the digest of its
 * content (either a file blob or a `Directory` proto) or a symlink target, as
 * well as possibly some metadata about the file or directory.
 *
 * In order to ensure that two equivalent directory trees hash to the same
 * value, the following restrictions MUST be obeyed when constructing a
 * a `Directory`:
 *
 * * Every child in the directory must have a path of exactly one segment.
 * Multiple levels of directory hierarchy may not be collapsed.
 * * Each child in the directory must have a unique path segment (file name).
 * Note that while the API itself is case-sensitive, the environment where
 * the Action is executed may or may not be case-sensitive. That is, it is
 * legal to call the API with a Directory that has both "Foo" and "foo" as
 * children, but the Action may be rejected by the remote system upon
 * execution.
 * * The files, directories and symlinks in the directory must each be sorted
 * in lexicographical order by path. The path strings must be sorted by code
 * point, equivalently, by UTF-8 bytes.
 * * The [NodeProperties][build.bazel.remote.execution.v2.NodeProperty] of
 * files,
 * directories, and symlinks must be sorted in lexicographical order by
 * property name.
 *
 * A `Directory` that obeys the restrictions is said to be in canonical form.
 *
 * As an example, the following could be used for a file named `bar` and a
 * directory named `foo` with an executable file named `baz` (hashes shortened
 * for readability):
 *
 * ```json
 * // (Directory proto)
 * {
 * files: [
 * {
 * name: "bar",
 * digest: {
 * hash: "4a73bc9d03...",
 * size: 65534
 * },
 * node_properties: [
 * {
 * "name": "MTime",
 * "value": "2017-01-15T01:30:15.01Z"
 * }
 * ]
 * }
 * ],
 * directories: [
 * {
 * name: "foo",
 * digest: {
 * hash: "4cf2eda940...",
 * size: 43
 * }
 * }
 * ]
 * }
 *
 * // (Directory proto with hash "4cf2eda940..." and size 43)
 * {
 * files: [
 * {
 * name: "baz",
 * digest: {
 * hash: "b2c941073e...",
 * size: 1294,
 * },
 * is_executable: true
 * }
 * ]
 * }
 * ```
 */
export interface Directory {
  /**
   * The files in the directory.
   */
  files?: _build_bazel_remote_execution_v2_FileNode[];
  /**
   * The subdirectories in the directory.
   */
  directories?: _build_bazel_remote_execution_v2_DirectoryNode[];
  /**
   * The symlinks in the directory.
   */
  symlinks?: _build_bazel_remote_execution_v2_SymlinkNode[];
  /**
   * The node properties of the Directory.
   */
  nodeProperties?: _build_bazel_remote_execution_v2_NodeProperty[];
}

/**
 * A `Directory` represents a directory node in a file tree, containing zero or
 * more children [FileNodes][build.bazel.remote.execution.v2.FileNode],
 * [DirectoryNodes][build.bazel.remote.execution.v2.DirectoryNode] and
 * [SymlinkNodes][build.bazel.remote.execution.v2.SymlinkNode].
 * Each `Node` contains its name in the directory, either the digest of its
 * content (either a file blob or a `Directory` proto) or a symlink target, as
 * well as possibly some metadata about the file or directory.
 *
 * In order to ensure that two equivalent directory trees hash to the same
 * value, the following restrictions MUST be obeyed when constructing a
 * a `Directory`:
 *
 * * Every child in the directory must have a path of exactly one segment.
 * Multiple levels of directory hierarchy may not be collapsed.
 * * Each child in the directory must have a unique path segment (file name).
 * Note that while the API itself is case-sensitive, the environment where
 * the Action is executed may or may not be case-sensitive. That is, it is
 * legal to call the API with a Directory that has both "Foo" and "foo" as
 * children, but the Action may be rejected by the remote system upon
 * execution.
 * * The files, directories and symlinks in the directory must each be sorted
 * in lexicographical order by path. The path strings must be sorted by code
 * point, equivalently, by UTF-8 bytes.
 * * The [NodeProperties][build.bazel.remote.execution.v2.NodeProperty] of
 * files,
 * directories, and symlinks must be sorted in lexicographical order by
 * property name.
 *
 * A `Directory` that obeys the restrictions is said to be in canonical form.
 *
 * As an example, the following could be used for a file named `bar` and a
 * directory named `foo` with an executable file named `baz` (hashes shortened
 * for readability):
 *
 * ```json
 * // (Directory proto)
 * {
 * files: [
 * {
 * name: "bar",
 * digest: {
 * hash: "4a73bc9d03...",
 * size: 65534
 * },
 * node_properties: [
 * {
 * "name": "MTime",
 * "value": "2017-01-15T01:30:15.01Z"
 * }
 * ]
 * }
 * ],
 * directories: [
 * {
 * name: "foo",
 * digest: {
 * hash: "4cf2eda940...",
 * size: 43
 * }
 * }
 * ]
 * }
 *
 * // (Directory proto with hash "4cf2eda940..." and size 43)
 * {
 * files: [
 * {
 * name: "baz",
 * digest: {
 * hash: "b2c941073e...",
 * size: 1294,
 * },
 * is_executable: true
 * }
 * ]
 * }
 * ```
 */
export interface Directory__Output {
  /**
   * The files in the directory.
   */
  files: _build_bazel_remote_execution_v2_FileNode__Output[];
  /**
   * The subdirectories in the directory.
   */
  directories: _build_bazel_remote_execution_v2_DirectoryNode__Output[];
  /**
   * The symlinks in the directory.
   */
  symlinks: _build_bazel_remote_execution_v2_SymlinkNode__Output[];
  /**
   * The node properties of the Directory.
   */
  nodeProperties: _build_bazel_remote_execution_v2_NodeProperty__Output[];
}
