// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A request corresponding to a single blob that the client wants to upload.
 */
export interface _build_bazel_remote_execution_v2_BatchUpdateBlobsRequest_Request {
  /**
   * The digest of the blob. This MUST be the digest of `data`.
   */
  digest?: _build_bazel_remote_execution_v2_Digest | null;
  /**
   * The raw binary data.
   */
  data?: Buffer | Uint8Array | string;
}

/**
 * A request corresponding to a single blob that the client wants to upload.
 */
export interface _build_bazel_remote_execution_v2_BatchUpdateBlobsRequest_Request__Output {
  /**
   * The digest of the blob. This MUST be the digest of `data`.
   */
  digest: _build_bazel_remote_execution_v2_Digest__Output | null;
  /**
   * The raw binary data.
   */
  data: Buffer;
}

/**
 * A request message for
 * [ContentAddressableStorage.BatchUpdateBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchUpdateBlobs].
 */
export interface BatchUpdateBlobsRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  instanceName?: string;
  /**
   * The individual upload requests.
   */
  requests?: _build_bazel_remote_execution_v2_BatchUpdateBlobsRequest_Request[];
}

/**
 * A request message for
 * [ContentAddressableStorage.BatchUpdateBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchUpdateBlobs].
 */
export interface BatchUpdateBlobsRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  instanceName: string;
  /**
   * The individual upload requests.
   */
  requests: _build_bazel_remote_execution_v2_BatchUpdateBlobsRequest_Request__Output[];
}
