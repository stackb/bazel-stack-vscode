// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A request message for
 * [ContentAddressableStorage.FindMissingBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.FindMissingBlobs].
 */
export interface FindMissingBlobsRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName'?: (string);
  /**
   * A list of the blobs to check.
   */
  'blobDigests'?: (_build_bazel_remote_execution_v2_Digest)[];
}

/**
 * A request message for
 * [ContentAddressableStorage.FindMissingBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.FindMissingBlobs].
 */
export interface FindMissingBlobsRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName': (string);
  /**
   * A list of the blobs to check.
   */
  'blobDigests': (_build_bazel_remote_execution_v2_Digest__Output)[];
}
