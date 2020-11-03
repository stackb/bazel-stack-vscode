// Original file: proto/starlark_debugging.proto

import type { Scope as _starlark_debugging_Scope, Scope__Output as _starlark_debugging_Scope__Output } from '../starlark_debugging/Scope';
import type { Location as _starlark_debugging_Location, Location__Output as _starlark_debugging_Location__Output } from '../starlark_debugging/Location';

/**
 * A single frame in a thread's stack trace.
 */
export interface Frame {
  /**
   * The name of the function that this frame represents.
   */
  'functionName'?: (string);
  /**
   * The scopes that contain value bindings accessible in this frame.
   */
  'scope'?: (_starlark_debugging_Scope)[];
  /**
   * The source location where the frame is currently paused. May not be set in
   * some situations.
   */
  'location'?: (_starlark_debugging_Location);
}

/**
 * A single frame in a thread's stack trace.
 */
export interface Frame__Output {
  /**
   * The name of the function that this frame represents.
   */
  'functionName': (string);
  /**
   * The scopes that contain value bindings accessible in this frame.
   */
  'scope': (_starlark_debugging_Scope__Output)[];
  /**
   * The source location where the frame is currently paused. May not be set in
   * some situations.
   */
  'location'?: (_starlark_debugging_Location__Output);
}
