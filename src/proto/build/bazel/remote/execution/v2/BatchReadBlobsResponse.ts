// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';
import type {
  Status as _google_rpc_Status,
  Status__Output as _google_rpc_Status__Output,
} from '../../../../../google/rpc/Status';

/**
 * A response corresponding to a single blob that the client tried to
 * download.
 */
export interface _build_bazel_remote_execution_v2_BatchReadBlobsResponse_Response {
  /**
   * The digest to which this response corresponds.
   */
  digest?: _build_bazel_remote_execution_v2_Digest | null;
  /**
   * The raw binary data.
   */
  data?: Buffer | Uint8Array | string;
  /**
   * The result of attempting to download that blob.
   */
  status?: _google_rpc_Status | null;
}

/**
 * A response corresponding to a single blob that the client tried to
 * download.
 */
export interface _build_bazel_remote_execution_v2_BatchReadBlobsResponse_Response__Output {
  /**
   * The digest to which this response corresponds.
   */
  digest: _build_bazel_remote_execution_v2_Digest__Output | null;
  /**
   * The raw binary data.
   */
  data: Buffer;
  /**
   * The result of attempting to download that blob.
   */
  status: _google_rpc_Status__Output | null;
}

/**
 * A response message for
 * [ContentAddressableStorage.BatchReadBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchReadBlobs].
 */
export interface BatchReadBlobsResponse {
  /**
   * The responses to the requests.
   */
  responses?: _build_bazel_remote_execution_v2_BatchReadBlobsResponse_Response[];
}

/**
 * A response message for
 * [ContentAddressableStorage.BatchReadBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchReadBlobs].
 */
export interface BatchReadBlobsResponse__Output {
  /**
   * The responses to the requests.
   */
  responses: _build_bazel_remote_execution_v2_BatchReadBlobsResponse_Response__Output[];
}
