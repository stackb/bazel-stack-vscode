// Original file: proto/starlark_debugging.proto

import type { Value as _starlark_debugging_Value, Value__Output as _starlark_debugging_Value__Output } from '../starlark_debugging/Value';

/**
 * The response to a GetChildrenRequest.
 */
export interface GetChildrenResponse {
  'children'?: (_starlark_debugging_Value)[];
}

/**
 * The response to a GetChildrenRequest.
 */
export interface GetChildrenResponse__Output {
  'children': (_starlark_debugging_Value__Output)[];
}
