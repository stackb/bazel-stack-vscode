// Original file: proto/codesearch.proto

import type { BazelQuery as _build_stack_codesearch_v1beta1_BazelQuery, BazelQuery__Output as _build_stack_codesearch_v1beta1_BazelQuery__Output } from '../../../../build/stack/codesearch/v1beta1/BazelQuery';

export interface CreateScopeRequest {
  'cwd'?: (string);
  'outputBase'?: (string);
  'name'?: (string);
  'force'?: (boolean);
  /**
   * The contents of the file, if they are guaranteed to be short.
   */
  'bazelQuery'?: (_build_stack_codesearch_v1beta1_BazelQuery | null);
  /**
   * PID of the workspace bazel server, if known
   */
  'pid'?: (number);
  'expression'?: "bazelQuery";
}

export interface CreateScopeRequest__Output {
  'cwd': (string);
  'outputBase': (string);
  'name': (string);
  'force': (boolean);
  /**
   * The contents of the file, if they are guaranteed to be short.
   */
  'bazelQuery'?: (_build_stack_codesearch_v1beta1_BazelQuery__Output | null);
  /**
   * PID of the workspace bazel server, if known
   */
  'pid': (number);
  'expression': "bazelQuery";
}
