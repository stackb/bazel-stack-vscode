// Original file: proto/starlark_debugging.proto

import type { Breakpoint as _starlark_debugging_Breakpoint, Breakpoint__Output as _starlark_debugging_Breakpoint__Output } from '../starlark_debugging/Breakpoint';

/**
 * A request to update the breakpoints used by the debug server.
 */
export interface SetBreakpointsRequest {
  /**
   * The breakpoints that describe where the debug server should pause
   * evaluation.
   */
  'breakpoint'?: (_starlark_debugging_Breakpoint)[];
}

/**
 * A request to update the breakpoints used by the debug server.
 */
export interface SetBreakpointsRequest__Output {
  /**
   * The breakpoints that describe where the debug server should pause
   * evaluation.
   */
  'breakpoint': (_starlark_debugging_Breakpoint__Output)[];
}
