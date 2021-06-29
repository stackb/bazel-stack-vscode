// Original file: proto/invocation_policy.proto


export interface SetValue {
  /**
   * Use this value for the specified flag, overriding any default or user-set
   * value (unless append is set to true for repeatable flags).
   * 
   * This field is repeated for repeatable flags. It is an error to set
   * multiple values for a flag that is not actually a repeatable flag.
   * This requires at least 1 value, if even the empty string.
   * 
   * If the flag allows multiple values, all of its values are replaced with the
   * value or values from the policy (i.e., no diffing or merging is performed),
   * unless the append field (see below) is set to true.
   * 
   * Note that some flags are tricky. For example, some flags look like boolean
   * flags, but are actually Void expansion flags that expand into other flags.
   * The Bazel flag parser will accept "--void_flag=false", but because
   * the flag is Void, the "=false" is ignored. It can get even trickier, like
   * "--novoid_flag" which is also an expansion flag with the type Void whose
   * name is explicitly "novoid_flag" and which expands into other flags that
   * are the opposite of "--void_flag". For expansion flags, it's best to
   * explicitly override the flags they expand into.
   * 
   * Other flags may be differently tricky: A flag could have a converter that
   * converts some string to a list of values, but that flag may not itself have
   * allowMultiple set to true.
   * 
   * An example is "--test_tag_filters": this flag sets its converter to
   * CommaSeparatedOptionListConverter, but does not set allowMultiple to true.
   * So "--test_tag_filters=foo,bar" results in ["foo", "bar"], however
   * "--test_tag_filters=foo --test_tag_filters=bar" results in just ["bar"]
   * since the 2nd value overrides the 1st.
   * 
   * Similarly, "--test_tag_filters=foo,bar --test_tag_filters=baz,qux" results
   * in ["baz", "qux"]. For flags like these, the policy should specify
   * "foo,bar" instead of separately specifying "foo" and "bar" so that the
   * converter is appropriately invoked.
   * 
   * Note that the opposite is not necessarily
   * true: for a flag that specifies allowMultiple=true, "--flag=foo,bar"
   * may fail to parse or result in an unexpected value.
   */
  'flagValue'?: (string)[];
  /**
   * Whether to allow this policy to be overridden by user-specified values.
   * When set, if the user specified a value for this flag, use the value
   * from the user, otherwise use the value specified in this policy.
   */
  'overridable'?: (boolean);
  /**
   * If true, and if the flag named in the policy is a repeatable flag, then
   * the values listed in flag_value do not replace all the user-set or default
   * values of the flag, but instead append to them. If the flag is not
   * repeatable, then this has no effect.
   */
  'append'?: (boolean);
}

export interface SetValue__Output {
  /**
   * Use this value for the specified flag, overriding any default or user-set
   * value (unless append is set to true for repeatable flags).
   * 
   * This field is repeated for repeatable flags. It is an error to set
   * multiple values for a flag that is not actually a repeatable flag.
   * This requires at least 1 value, if even the empty string.
   * 
   * If the flag allows multiple values, all of its values are replaced with the
   * value or values from the policy (i.e., no diffing or merging is performed),
   * unless the append field (see below) is set to true.
   * 
   * Note that some flags are tricky. For example, some flags look like boolean
   * flags, but are actually Void expansion flags that expand into other flags.
   * The Bazel flag parser will accept "--void_flag=false", but because
   * the flag is Void, the "=false" is ignored. It can get even trickier, like
   * "--novoid_flag" which is also an expansion flag with the type Void whose
   * name is explicitly "novoid_flag" and which expands into other flags that
   * are the opposite of "--void_flag". For expansion flags, it's best to
   * explicitly override the flags they expand into.
   * 
   * Other flags may be differently tricky: A flag could have a converter that
   * converts some string to a list of values, but that flag may not itself have
   * allowMultiple set to true.
   * 
   * An example is "--test_tag_filters": this flag sets its converter to
   * CommaSeparatedOptionListConverter, but does not set allowMultiple to true.
   * So "--test_tag_filters=foo,bar" results in ["foo", "bar"], however
   * "--test_tag_filters=foo --test_tag_filters=bar" results in just ["bar"]
   * since the 2nd value overrides the 1st.
   * 
   * Similarly, "--test_tag_filters=foo,bar --test_tag_filters=baz,qux" results
   * in ["baz", "qux"]. For flags like these, the policy should specify
   * "foo,bar" instead of separately specifying "foo" and "bar" so that the
   * converter is appropriately invoked.
   * 
   * Note that the opposite is not necessarily
   * true: for a flag that specifies allowMultiple=true, "--flag=foo,bar"
   * may fail to parse or result in an unexpected value.
   */
  'flagValue': (string)[];
  /**
   * Whether to allow this policy to be overridden by user-specified values.
   * When set, if the user specified a value for this flag, use the value
   * from the user, otherwise use the value specified in this policy.
   */
  'overridable': (boolean);
  /**
   * If true, and if the flag named in the policy is a repeatable flag, then
   * the values listed in flag_value do not replace all the user-set or default
   * values of the flag, but instead append to them. If the flag is not
   * repeatable, then this has no effect.
   */
  'append': (boolean);
}
