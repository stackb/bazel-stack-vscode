// Original file: proto/invocation_policy.proto

import { FlagPolicy as _blaze_invocation_policy_FlagPolicy, FlagPolicy__Output as _blaze_invocation_policy_FlagPolicy__Output } from '../../blaze/invocation_policy/FlagPolicy';

/**
 * The --invocation_policy flag takes a base64-encoded binary-serialized or text
 * formatted InvocationPolicy message.
 */
export interface InvocationPolicy {
  /**
   * Order matters.
   * After expanding policies on expansion flags or flags with implicit
   * requirements, only the final policy on a specific flag will be enforced
   * onto the user's command line.
   */
  'flagPolicies'?: (_blaze_invocation_policy_FlagPolicy)[];
}

/**
 * The --invocation_policy flag takes a base64-encoded binary-serialized or text
 * formatted InvocationPolicy message.
 */
export interface InvocationPolicy__Output {
  /**
   * Order matters.
   * After expanding policies on expansion flags or flags with implicit
   * requirements, only the final policy on a specific flag will be enforced
   * onto the user's command line.
   */
  'flagPolicies': (_blaze_invocation_policy_FlagPolicy__Output)[];
}
