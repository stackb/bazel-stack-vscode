// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * An event indicating that a thread has continued execution after being paused.
 */
export interface ThreadContinuedEvent {
  /**
   * The identifier of the thread that continued executing.
   */
  'threadId'?: (number | string | Long);
}

/**
 * An event indicating that a thread has continued execution after being paused.
 */
export interface ThreadContinuedEvent__Output {
  /**
   * The identifier of the thread that continued executing.
   */
  'threadId': (Long);
}
