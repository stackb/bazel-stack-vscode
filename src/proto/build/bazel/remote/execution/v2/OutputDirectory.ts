// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * An `OutputDirectory` is the output in an `ActionResult` corresponding to a
 * directory's full contents rather than a single file.
 */
export interface OutputDirectory {
  /**
   * The full path of the directory relative to the working directory. The path
   * separator is a forward slash `/`. Since this is a relative path, it MUST
   * NOT begin with a leading forward slash. The empty string value is allowed,
   * and it denotes the entire working directory.
   */
  path?: string;
  /**
   * The digest of the encoded
   * [Tree][build.bazel.remote.execution.v2.Tree] proto containing the
   * directory's contents.
   */
  treeDigest?: _build_bazel_remote_execution_v2_Digest | null;
}

/**
 * An `OutputDirectory` is the output in an `ActionResult` corresponding to a
 * directory's full contents rather than a single file.
 */
export interface OutputDirectory__Output {
  /**
   * The full path of the directory relative to the working directory. The path
   * separator is a forward slash `/`. Since this is a relative path, it MUST
   * NOT begin with a leading forward slash. The empty string value is allowed,
   * and it denotes the entire working directory.
   */
  path: string;
  /**
   * The digest of the encoded
   * [Tree][build.bazel.remote.execution.v2.Tree] proto containing the
   * directory's contents.
   */
  treeDigest: _build_bazel_remote_execution_v2_Digest__Output | null;
}
