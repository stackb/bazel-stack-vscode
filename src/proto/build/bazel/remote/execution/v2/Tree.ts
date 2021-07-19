// Original file: proto/remote_execution.proto

import type {
  Directory as _build_bazel_remote_execution_v2_Directory,
  Directory__Output as _build_bazel_remote_execution_v2_Directory__Output,
} from '../../../../../build/bazel/remote/execution/v2/Directory';

/**
 * A `Tree` contains all the
 * [Directory][build.bazel.remote.execution.v2.Directory] protos in a
 * single directory Merkle tree, compressed into one message.
 */
export interface Tree {
  /**
   * The root directory in the tree.
   */
  root?: _build_bazel_remote_execution_v2_Directory | null;
  /**
   * All the child directories: the directories referred to by the root and,
   * recursively, all its children. In order to reconstruct the directory tree,
   * the client must take the digests of each of the child directories and then
   * build up a tree starting from the `root`.
   */
  children?: _build_bazel_remote_execution_v2_Directory[];
}

/**
 * A `Tree` contains all the
 * [Directory][build.bazel.remote.execution.v2.Directory] protos in a
 * single directory Merkle tree, compressed into one message.
 */
export interface Tree__Output {
  /**
   * The root directory in the tree.
   */
  root: _build_bazel_remote_execution_v2_Directory__Output | null;
  /**
   * All the child directories: the directories referred to by the root and,
   * recursively, all its children. In order to reconstruct the directory tree,
   * the client must take the digests of each of the child directories and then
   * build up a tree starting from the `root`.
   */
  children: _build_bazel_remote_execution_v2_Directory__Output[];
}
