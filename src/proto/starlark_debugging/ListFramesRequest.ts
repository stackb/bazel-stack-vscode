// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * A request to list the stack frames of a thread.
 */
export interface ListFramesRequest {
  /**
   * The identifier of the thread whose stack frames should be listed.
   */
  'threadId'?: (number | string | Long);
}

/**
 * A request to list the stack frames of a thread.
 */
export interface ListFramesRequest__Output {
  /**
   * The identifier of the thread whose stack frames should be listed.
   */
  'threadId': (Long);
}
