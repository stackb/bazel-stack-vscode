// Original file: proto/starlark_debugging.proto

import type { Value as _starlark_debugging_Value, Value__Output as _starlark_debugging_Value__Output } from '../starlark_debugging/Value';

/**
 * The response to an EvaluateRequest.
 */
export interface EvaluateResponse {
  /**
   * The result of evaluating a statement.
   */
  'result'?: (_starlark_debugging_Value);
}

/**
 * The response to an EvaluateRequest.
 */
export interface EvaluateResponse__Output {
  /**
   * The result of evaluating a statement.
   */
  'result'?: (_starlark_debugging_Value__Output);
}
