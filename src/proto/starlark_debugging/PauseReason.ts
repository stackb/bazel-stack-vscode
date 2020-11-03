// Original file: proto/starlark_debugging.proto

/**
 * The reason why a thread was paused.
 */
export enum PauseReason {
  /**
   * The debug server hasn't set any reason.
   */
  UNSET = 0,
  /**
   * The stepping condition in a ContinueExecutionRequest was hit.
   */
  STEPPING = 1,
  /**
   * A PauseThreadRequest was sent with thread_id=0.
   */
  ALL_THREADS_PAUSED = 2,
  /**
   * A PauseThreadRequest was sent with thread_id matching this thread.
   */
  PAUSE_THREAD_REQUEST = 3,
  /**
   * A breakpoint was hit.
   */
  HIT_BREAKPOINT = 4,
  /**
   * An error occurred while evaluating a breakpoint condition.
   */
  CONDITIONAL_BREAKPOINT_ERROR = 5,
  /**
   * Debugging just started, and a StartDebuggingRequest has not yet been
   * received and processed.
   */
  INITIALIZING = 6,
}
