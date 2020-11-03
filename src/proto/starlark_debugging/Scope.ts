// Original file: proto/starlark_debugging.proto

import type { Value as _starlark_debugging_Value, Value__Output as _starlark_debugging_Value__Output } from '../starlark_debugging/Value';

/**
 * A scope that contains value bindings accessible in a frame.
 */
export interface Scope {
  /**
   * A human-readable name of the scope, such as "global" or "local".
   */
  'name'?: (string);
  /**
   * The variable bindings that are defined in this scope.
   */
  'binding'?: (_starlark_debugging_Value)[];
}

/**
 * A scope that contains value bindings accessible in a frame.
 */
export interface Scope__Output {
  /**
   * A human-readable name of the scope, such as "global" or "local".
   */
  'name': (string);
  /**
   * The variable bindings that are defined in this scope.
   */
  'binding': (_starlark_debugging_Value__Output)[];
}
