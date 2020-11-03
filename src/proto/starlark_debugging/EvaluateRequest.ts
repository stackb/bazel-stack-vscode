// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * A request to evaluate a Starlark statement in a thread's current environment.
 */
export interface EvaluateRequest {
  /**
   * The identifier of the thread in whose execution context the expression
   * should be evaluated.
   */
  'threadId'?: (number | string | Long);
  /**
   * The Starlark statement to evaluate.
   */
  'statement'?: (string);
}

/**
 * A request to evaluate a Starlark statement in a thread's current environment.
 */
export interface EvaluateRequest__Output {
  /**
   * The identifier of the thread in whose execution context the expression
   * should be evaluated.
   */
  'threadId': (Long);
  /**
   * The Starlark statement to evaluate.
   */
  'statement': (string);
}
