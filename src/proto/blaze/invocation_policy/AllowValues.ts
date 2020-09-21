// Original file: proto/invocation_policy.proto

import { UseDefault as _blaze_invocation_policy_UseDefault, UseDefault__Output as _blaze_invocation_policy_UseDefault__Output } from '../../blaze/invocation_policy/UseDefault';

export interface AllowValues {
  /**
   * It is an error for the user to use any value not in this list, unless
   * new_value or use_default is set.
   */
  'allowedValues'?: (string)[];
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
  'useDefault'?: (_blaze_invocation_policy_UseDefault);
  'replacementValue'?: "newValue"|"useDefault";
}

export interface AllowValues__Output {
  /**
   * It is an error for the user to use any value not in this list, unless
   * new_value or use_default is set.
   */
  'allowedValues': (string)[];
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
  'useDefault'?: (_blaze_invocation_policy_UseDefault__Output);
  'replacementValue': "newValue"|"useDefault";
}
