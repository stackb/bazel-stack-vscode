// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A `DirectoryNode` represents a child of a
 * [Directory][build.bazel.remote.execution.v2.Directory] which is itself
 * a `Directory` and its associated metadata.
 */
export interface DirectoryNode {
  /**
   * The name of the directory.
   */
  name?: string;
  /**
   * The digest of the
   * [Directory][build.bazel.remote.execution.v2.Directory] object
   * represented. See [Digest][build.bazel.remote.execution.v2.Digest]
   * for information about how to take the digest of a proto message.
   */
  digest?: _build_bazel_remote_execution_v2_Digest | null;
}

/**
 * A `DirectoryNode` represents a child of a
 * [Directory][build.bazel.remote.execution.v2.Directory] which is itself
 * a `Directory` and its associated metadata.
 */
export interface DirectoryNode__Output {
  /**
   * The name of the directory.
   */
  name: string;
  /**
   * The digest of the
   * [Directory][build.bazel.remote.execution.v2.Directory] object
   * represented. See [Digest][build.bazel.remote.execution.v2.Digest]
   * for information about how to take the digest of a proto message.
   */
  digest: _build_bazel_remote_execution_v2_Digest__Output | null;
}
