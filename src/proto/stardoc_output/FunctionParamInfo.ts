// Original file: src/proto/stardoc_output/stardoc_output.proto


/**
 * Representation of a Starlark function parameter definition.
 */
export interface FunctionParamInfo {
  /**
   * The name of the parameter.
   */
  'name'?: (string);
  /**
   * The documented description of the parameter (if specified in the function's
   * docstring).
   */
  'doc_string'?: (string);
  /**
   * If not an empty string, the default value of the parameter displayed
   * as a string.
   */
  'default_value'?: (string);
  /**
   * If true, the default value is unset and a value is needed for this
   * parameter. This might be false even if defaultValue is empty in the case of
   * special parameter such as *args and **kwargs"
   */
  'mandatory'?: (boolean);
}

/**
 * Representation of a Starlark function parameter definition.
 */
export interface FunctionParamInfo__Output {
  /**
   * The name of the parameter.
   */
  'name': (string);
  /**
   * The documented description of the parameter (if specified in the function's
   * docstring).
   */
  'doc_string': (string);
  /**
   * If not an empty string, the default value of the parameter displayed
   * as a string.
   */
  'default_value': (string);
  /**
   * If true, the default value is unset and a value is needed for this
   * parameter. This might be false even if defaultValue is empty in the case of
   * special parameter such as *args and **kwargs"
   */
  'mandatory': (boolean);
}
