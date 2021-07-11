// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { Status as _google_rpc_Status, Status__Output as _google_rpc_Status__Output } from '../../../../../google/rpc/Status';

/**
 * A response corresponding to a single blob that the client tried to upload.
 */
export interface _build_bazel_remote_execution_v2_BatchUpdateBlobsResponse_Response {
  /**
   * The blob digest to which this response corresponds.
   */
  'digest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * The result of attempting to upload that blob.
   */
  'status'?: (_google_rpc_Status | null);
}

/**
 * A response corresponding to a single blob that the client tried to upload.
 */
export interface _build_bazel_remote_execution_v2_BatchUpdateBlobsResponse_Response__Output {
  /**
   * The blob digest to which this response corresponds.
   */
  'digest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * The result of attempting to upload that blob.
   */
  'status': (_google_rpc_Status__Output | null);
}

/**
 * A response message for
 * [ContentAddressableStorage.BatchUpdateBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchUpdateBlobs].
 */
export interface BatchUpdateBlobsResponse {
  /**
   * The responses to the requests.
   */
  'responses'?: (_build_bazel_remote_execution_v2_BatchUpdateBlobsResponse_Response)[];
}

/**
 * A response message for
 * [ContentAddressableStorage.BatchUpdateBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchUpdateBlobs].
 */
export interface BatchUpdateBlobsResponse__Output {
  /**
   * The responses to the requests.
   */
  'responses': (_build_bazel_remote_execution_v2_BatchUpdateBlobsResponse_Response__Output)[];
}
