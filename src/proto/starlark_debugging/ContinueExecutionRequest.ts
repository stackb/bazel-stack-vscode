// Original file: proto/starlark_debugging.proto

import type { Stepping as _starlark_debugging_Stepping } from '../starlark_debugging/Stepping';
import type { Long } from '@grpc/proto-loader';

/**
 * A request to continue execution on a paused or stepping thread. (A stepping
 * thread is a thread that is running as the result of a previous
 * ContinueExecutionRequest with non-NONE stepping.)
 * 
 * A paused thread will be resumed with the given stepping, unless thread_id is
 * 0. A stepping thread will continue to run with its stepping condition
 * removed, as if it were already paused.
 */
export interface ContinueExecutionRequest {
  'threadId'?: (number | string | Long);
  /**
   * Describes the stepping behavior to use when continuing execution.
   */
  'stepping'?: (_starlark_debugging_Stepping | keyof typeof _starlark_debugging_Stepping);
}

/**
 * A request to continue execution on a paused or stepping thread. (A stepping
 * thread is a thread that is running as the result of a previous
 * ContinueExecutionRequest with non-NONE stepping.)
 * 
 * A paused thread will be resumed with the given stepping, unless thread_id is
 * 0. A stepping thread will continue to run with its stepping condition
 * removed, as if it were already paused.
 */
export interface ContinueExecutionRequest__Output {
  'threadId': (Long);
  /**
   * Describes the stepping behavior to use when continuing execution.
   */
  'stepping': (_starlark_debugging_Stepping);
}
