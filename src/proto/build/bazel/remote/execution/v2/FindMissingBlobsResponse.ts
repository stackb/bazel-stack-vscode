// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A response message for
 * [ContentAddressableStorage.FindMissingBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.FindMissingBlobs].
 */
export interface FindMissingBlobsResponse {
  /**
   * A list of the blobs requested *not* present in the storage.
   */
  'missingBlobDigests'?: (_build_bazel_remote_execution_v2_Digest)[];
}

/**
 * A response message for
 * [ContentAddressableStorage.FindMissingBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.FindMissingBlobs].
 */
export interface FindMissingBlobsResponse__Output {
  /**
   * A list of the blobs requested *not* present in the storage.
   */
  'missingBlobDigests': (_build_bazel_remote_execution_v2_Digest__Output)[];
}
