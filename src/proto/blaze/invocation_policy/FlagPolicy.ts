// Original file: proto/invocation_policy.proto

import type { SetValue as _blaze_invocation_policy_SetValue, SetValue__Output as _blaze_invocation_policy_SetValue__Output } from '../../blaze/invocation_policy/SetValue';
import type { UseDefault as _blaze_invocation_policy_UseDefault, UseDefault__Output as _blaze_invocation_policy_UseDefault__Output } from '../../blaze/invocation_policy/UseDefault';
import type { DisallowValues as _blaze_invocation_policy_DisallowValues, DisallowValues__Output as _blaze_invocation_policy_DisallowValues__Output } from '../../blaze/invocation_policy/DisallowValues';
import type { AllowValues as _blaze_invocation_policy_AllowValues, AllowValues__Output as _blaze_invocation_policy_AllowValues__Output } from '../../blaze/invocation_policy/AllowValues';

/**
 * A policy for controlling the value of a flag.
 */
export interface FlagPolicy {
  /**
   * The name of the flag to enforce this policy on.
   * 
   * Note that this should be the full name of the flag, not the abbreviated
   * name of the flag. If the user specifies the abbreviated name of a flag,
   * that flag will be matched using its full name.
   * 
   * The "no" prefix will not be parsed, so for boolean flags, use
   * the flag's full name and explicitly set it to true or false.
   */
  'flagName'?: (string);
  /**
   * If set, this flag policy is applied only if one of the given commands or a
   * command that inherits from one of the given commands is being run. For
   * instance, if "build" is one of the commands here, then this policy will
   * apply to any command that inherits from build, such as info, coverage, or
   * test. If empty, this flag policy is applied for all commands. This allows
   * the policy setter to add all policies to the proto without having to
   * determine which Bazel command the user is actually running. Additionally,
   * Bazel allows multiple flags to be defined by the same name, and the
   * specific flag definition is determined by the command.
   */
  'commands'?: (string)[];
  'setValue'?: (_blaze_invocation_policy_SetValue);
  'useDefault'?: (_blaze_invocation_policy_UseDefault);
  'disallowValues'?: (_blaze_invocation_policy_DisallowValues);
  'allowValues'?: (_blaze_invocation_policy_AllowValues);
  'operation'?: "setValue"|"useDefault"|"disallowValues"|"allowValues";
}

/**
 * A policy for controlling the value of a flag.
 */
export interface FlagPolicy__Output {
  /**
   * The name of the flag to enforce this policy on.
   * 
   * Note that this should be the full name of the flag, not the abbreviated
   * name of the flag. If the user specifies the abbreviated name of a flag,
   * that flag will be matched using its full name.
   * 
   * The "no" prefix will not be parsed, so for boolean flags, use
   * the flag's full name and explicitly set it to true or false.
   */
  'flagName': (string);
  /**
   * If set, this flag policy is applied only if one of the given commands or a
   * command that inherits from one of the given commands is being run. For
   * instance, if "build" is one of the commands here, then this policy will
   * apply to any command that inherits from build, such as info, coverage, or
   * test. If empty, this flag policy is applied for all commands. This allows
   * the policy setter to add all policies to the proto without having to
   * determine which Bazel command the user is actually running. Additionally,
   * Bazel allows multiple flags to be defined by the same name, and the
   * specific flag definition is determined by the command.
   */
  'commands': (string)[];
  'setValue'?: (_blaze_invocation_policy_SetValue__Output);
  'useDefault'?: (_blaze_invocation_policy_UseDefault__Output);
  'disallowValues'?: (_blaze_invocation_policy_DisallowValues__Output);
  'allowValues'?: (_blaze_invocation_policy_AllowValues__Output);
  'operation': "setValue"|"useDefault"|"disallowValues"|"allowValues";
}
