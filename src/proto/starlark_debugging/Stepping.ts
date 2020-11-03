// Original file: proto/starlark_debugging.proto

/**
 * Describes the stepping behavior that should occur when execution of a thread
 * is continued.
 */
export enum Stepping {
  /**
   * Do not step; continue execution until it completes or is paused for some
   * other reason (such as hitting another breakpoint).
   */
  NONE = 0,
  /**
   * If the thread is paused on a statement that contains a function call,
   * step into that function. Otherwise, this is the same as OVER.
   */
  INTO = 1,
  /**
   * Step over the next statement and any functions that it may call.
   */
  OVER = 2,
  /**
   * Continue execution until the current function has been exited and then
   * pause.
   */
  OUT = 3,
}
