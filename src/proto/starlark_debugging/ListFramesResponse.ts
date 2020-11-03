// Original file: proto/starlark_debugging.proto

import type { Frame as _starlark_debugging_Frame, Frame__Output as _starlark_debugging_Frame__Output } from '../starlark_debugging/Frame';

/**
 * The response to a ListFramesRequest.
 */
export interface ListFramesResponse {
  /**
   * The list of stack frames. The first element in the list represents the
   * topmost frame (that is, the current innermost function).
   */
  'frame'?: (_starlark_debugging_Frame)[];
}

/**
 * The response to a ListFramesRequest.
 */
export interface ListFramesResponse__Output {
  /**
   * The list of stack frames. The first element in the list represents the
   * topmost frame (that is, the current innermost function).
   */
  'frame': (_starlark_debugging_Frame__Output)[];
}
