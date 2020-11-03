// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * A request to pause execution of a thread, or all threads.
 */
export interface PauseThreadRequest {
  /**
   * The identifier of the thread to be paused.
   * 
   * If not set (i.e. zero), all current Starlark threads will be paused, and
   * until a ContinueExecutionRequest is sent, any future Starlark threads will
   * also start off paused.
   */
  'threadId'?: (number | string | Long);
}

/**
 * A request to pause execution of a thread, or all threads.
 */
export interface PauseThreadRequest__Output {
  /**
   * The identifier of the thread to be paused.
   * 
   * If not set (i.e. zero), all current Starlark threads will be paused, and
   * until a ContinueExecutionRequest is sent, any future Starlark threads will
   * also start off paused.
   */
  'threadId': (Long);
}
