// Original file: proto/codesearch.proto

import { Scope as _build_stack_codesearch_v1beta1_Scope, Scope__Output as _build_stack_codesearch_v1beta1_Scope__Output } from '../../../../build/stack/codesearch/v1beta1/Scope';

export interface UpdateScopeResponse {
  'progress'?: (string)[];
  /**
   * Scope is typically nil until the last message
   */
  'scope'?: (_build_stack_codesearch_v1beta1_Scope);
}

export interface UpdateScopeResponse__Output {
  'progress': (string)[];
  /**
   * Scope is typically nil until the last message
   */
  'scope'?: (_build_stack_codesearch_v1beta1_Scope__Output);
}
