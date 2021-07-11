// Original file: proto/invocation_policy.proto

import type { UseDefault as _blaze_invocation_policy_UseDefault, UseDefault__Output as _blaze_invocation_policy_UseDefault__Output } from '../../blaze/invocation_policy/UseDefault';

export interface DisallowValues {
  /**
   * It is an error for the user to use any of these values (that is, the Bazel
   * command will fail), unless new_value or use_default is set.
   * 
   * For repeatable flags, if any one of the values in the flag matches a value
   * in the list of disallowed values, an error is thrown.
   * 
   * Care must be taken for flags with complicated converters. For example,
   * it's possible for a repeated flag to be of type List<List<T>>, so that
   * "--foo=a,b --foo=c,d" results in foo=[["a","b"], ["c", "d"]]. In this case,
   * it is not possible to disallow just "b", nor will ["b", "a"] match, nor
   * will ["b", "c"] (but ["a", "b"] will still match).
   */
  'disallowedValues'?: (string)[];
  /**
   * If set and if the value of the flag is disallowed (including the default
   * value of the flag if the user doesn't specify a value), use this value as
   * the value of the flag instead of raising an error. This does not apply to
   * repeatable flags and is ignored if the flag is a repeatable flag.
   */
  'newValue'?: (string);
  /**
   * If set and if the value of the flag is disallowed, use the default value
   * of the flag instead of raising an error. Unlike new_value, this works for
   * repeatable flags, but note that the default value for repeatable flags is
   * always empty.
   * 
   * Note that it is an error to disallow the default value of the flag and
   * to set use_default, unless the flag is a repeatable flag where the
   * default value is always the empty list.
   */
  'useDefault'?: (_blaze_invocation_policy_UseDefault | null);
  'replacementValue'?: "newValue"|"useDefault";
}

export interface DisallowValues__Output {
  /**
   * It is an error for the user to use any of these values (that is, the Bazel
   * command will fail), unless new_value or use_default is set.
   * 
   * For repeatable flags, if any one of the values in the flag matches a value
   * in the list of disallowed values, an error is thrown.
   * 
   * Care must be taken for flags with complicated converters. For example,
   * it's possible for a repeated flag to be of type List<List<T>>, so that
   * "--foo=a,b --foo=c,d" results in foo=[["a","b"], ["c", "d"]]. In this case,
   * it is not possible to disallow just "b", nor will ["b", "a"] match, nor
   * will ["b", "c"] (but ["a", "b"] will still match).
   */
  'disallowedValues': (string)[];
  /**
   * If set and if the value of the flag is disallowed (including the default
   * value of the flag if the user doesn't specify a value), use this value as
   * the value of the flag instead of raising an error. This does not apply to
   * repeatable flags and is ignored if the flag is a repeatable flag.
   */
  'newValue'?: (string);
  /**
   * If set and if the value of the flag is disallowed, use the default value
   * of the flag instead of raising an error. Unlike new_value, this works for
   * repeatable flags, but note that the default value for repeatable flags is
   * always empty.
   * 
   * Note that it is an error to disallow the default value of the flag and
   * to set use_default, unless the flag is a repeatable flag where the
   * default value is always the empty list.
   */
  'useDefault'?: (_blaze_invocation_policy_UseDefault__Output | null);
  'replacementValue': "newValue"|"useDefault";
}
