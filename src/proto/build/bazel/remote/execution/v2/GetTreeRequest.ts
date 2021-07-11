// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A request message for
 * [ContentAddressableStorage.GetTree][build.bazel.remote.execution.v2.ContentAddressableStorage.GetTree].
 */
export interface GetTreeRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName'?: (string);
  /**
   * The digest of the root, which must be an encoded
   * [Directory][build.bazel.remote.execution.v2.Directory] message
   * stored in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'rootDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * A maximum page size to request. If present, the server will request no more
   * than this many items. Regardless of whether a page size is specified, the
   * server may place its own limit on the number of items to be returned and
   * require the client to retrieve more items using a subsequent request.
   */
  'pageSize'?: (number);
  /**
   * A page token, which must be a value received in a previous
   * [GetTreeResponse][build.bazel.remote.execution.v2.GetTreeResponse].
   * If present, the server will use that token as an offset, returning only
   * that page and the ones that succeed it.
   */
  'pageToken'?: (string);
}

/**
 * A request message for
 * [ContentAddressableStorage.GetTree][build.bazel.remote.execution.v2.ContentAddressableStorage.GetTree].
 */
export interface GetTreeRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName': (string);
  /**
   * The digest of the root, which must be an encoded
   * [Directory][build.bazel.remote.execution.v2.Directory] message
   * stored in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'rootDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * A maximum page size to request. If present, the server will request no more
   * than this many items. Regardless of whether a page size is specified, the
   * server may place its own limit on the number of items to be returned and
   * require the client to retrieve more items using a subsequent request.
   */
  'pageSize': (number);
  /**
   * A page token, which must be a value received in a previous
   * [GetTreeResponse][build.bazel.remote.execution.v2.GetTreeResponse].
   * If present, the server will use that token as an offset, returning only
   * that page and the ones that succeed it.
   */
  'pageToken': (string);
}
