// Original file: proto/starlark_debugging.proto

import type { PauseReason as _starlark_debugging_PauseReason } from '../starlark_debugging/PauseReason';
import type { Location as _starlark_debugging_Location, Location__Output as _starlark_debugging_Location__Output } from '../starlark_debugging/Location';
import type { Error as _starlark_debugging_Error, Error__Output as _starlark_debugging_Error__Output } from '../starlark_debugging/Error';
import type { Long } from '@grpc/proto-loader';

/**
 * Information about a paused Starlark thread.
 */
export interface PausedThread {
  /**
   * The identifier of the thread.
   */
  'id'?: (number | string | Long);
  /**
   * A descriptive name for the thread that can be displayed in the debugger's
   * UI.
   */
  'name'?: (string);
  'pauseReason'?: (_starlark_debugging_PauseReason | keyof typeof _starlark_debugging_PauseReason);
  /**
   * The location in Starlark code of the next statement or expression that will
   * be executed.
   */
  'location'?: (_starlark_debugging_Location);
  /**
   * An error that occurred while evaluating a breakpoint condition. Present if
   * and only if pause_reason is CONDITIONAL_BREAKPOINT_ERROR.
   */
  'conditionalBreakpointError'?: (_starlark_debugging_Error);
}

/**
 * Information about a paused Starlark thread.
 */
export interface PausedThread__Output {
  /**
   * The identifier of the thread.
   */
  'id': (Long);
  /**
   * A descriptive name for the thread that can be displayed in the debugger's
   * UI.
   */
  'name': (string);
  'pauseReason': (_starlark_debugging_PauseReason);
  /**
   * The location in Starlark code of the next statement or expression that will
   * be executed.
   */
  'location'?: (_starlark_debugging_Location__Output);
  /**
   * An error that occurred while evaluating a breakpoint condition. Present if
   * and only if pause_reason is CONDITIONAL_BREAKPOINT_ERROR.
   */
  'conditionalBreakpointError'?: (_starlark_debugging_Error__Output);
}
