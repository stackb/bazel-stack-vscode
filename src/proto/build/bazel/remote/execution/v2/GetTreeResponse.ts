// Original file: proto/remote_execution.proto

import type { Directory as _build_bazel_remote_execution_v2_Directory, Directory__Output as _build_bazel_remote_execution_v2_Directory__Output } from '../../../../../build/bazel/remote/execution/v2/Directory';

/**
 * A response message for
 * [ContentAddressableStorage.GetTree][build.bazel.remote.execution.v2.ContentAddressableStorage.GetTree].
 */
export interface GetTreeResponse {
  /**
   * The directories descended from the requested root.
   */
  'directories'?: (_build_bazel_remote_execution_v2_Directory)[];
  /**
   * If present, signifies that there are more results which the client can
   * retrieve by passing this as the page_token in a subsequent
   * [request][build.bazel.remote.execution.v2.GetTreeRequest].
   * If empty, signifies that this is the last page of results.
   */
  'nextPageToken'?: (string);
}

/**
 * A response message for
 * [ContentAddressableStorage.GetTree][build.bazel.remote.execution.v2.ContentAddressableStorage.GetTree].
 */
export interface GetTreeResponse__Output {
  /**
   * The directories descended from the requested root.
   */
  'directories': (_build_bazel_remote_execution_v2_Directory__Output)[];
  /**
   * If present, signifies that there are more results which the client can
   * retrieve by passing this as the page_token in a subsequent
   * [request][build.bazel.remote.execution.v2.GetTreeRequest].
   * If empty, signifies that this is the last page of results.
   */
  'nextPageToken': (string);
}
