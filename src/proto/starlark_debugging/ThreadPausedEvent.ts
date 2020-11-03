// Original file: proto/starlark_debugging.proto

import type { PausedThread as _starlark_debugging_PausedThread, PausedThread__Output as _starlark_debugging_PausedThread__Output } from '../starlark_debugging/PausedThread';

/**
 * An event indicating that a thread was paused during execution.
 */
export interface ThreadPausedEvent {
  /**
   * The thread that was paused.
   */
  'thread'?: (_starlark_debugging_PausedThread);
}

/**
 * An event indicating that a thread was paused during execution.
 */
export interface ThreadPausedEvent__Output {
  /**
   * The thread that was paused.
   */
  'thread'?: (_starlark_debugging_PausedThread__Output);
}
