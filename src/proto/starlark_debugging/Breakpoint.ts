// Original file: proto/starlark_debugging.proto

import type { Location as _starlark_debugging_Location, Location__Output as _starlark_debugging_Location__Output } from '../starlark_debugging/Location';

/**
 * A location where the debug server will pause execution.
 */
export interface Breakpoint {
  /**
   * A breakpoint that is triggered when a particular line is reached.
   * Column index will be ignored for breakpoints. The debugger only supports
   * one breakpoint per line. If multiple breakpoints are supplied for a
   * single line, only the last such breakpoint is accepted.
   */
  'location'?: (_starlark_debugging_Location);
  /**
   * An optional condition for the breakpoint. When present, the breakpoint will
   * be triggered iff both the primary condition holds and this expression
   * evaluates to True. It is unspecified how many times this expression will be
   * evaluated, so it should be free of side-effects.
   */
  'expression'?: (string);
  'condition'?: "location";
}

/**
 * A location where the debug server will pause execution.
 */
export interface Breakpoint__Output {
  /**
   * A breakpoint that is triggered when a particular line is reached.
   * Column index will be ignored for breakpoints. The debugger only supports
   * one breakpoint per line. If multiple breakpoints are supplied for a
   * single line, only the last such breakpoint is accepted.
   */
  'location'?: (_starlark_debugging_Location__Output);
  /**
   * An optional condition for the breakpoint. When present, the breakpoint will
   * be triggered iff both the primary condition holds and this expression
   * evaluates to True. It is unspecified how many times this expression will be
   * evaluated, so it should be free of side-effects.
   */
  'expression': (string);
  'condition': "location";
}
