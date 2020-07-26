// Original file: src/proto/stardoc_output/stardoc_output.proto

import { FunctionParamInfo as _stardoc_output_FunctionParamInfo, FunctionParamInfo__Output as _stardoc_output_FunctionParamInfo__Output } from '../stardoc_output/FunctionParamInfo';

/**
 * Representation of Starlark function definition.
 */
export interface StarlarkFunctionInfo {
  /**
   * The name of the function.
   */
  'function_name'?: (string);
  /**
   * The parameters for the function.
   */
  'parameter'?: (_stardoc_output_FunctionParamInfo)[];
  /**
   * The documented description of the function (if specified in the function's
   * docstring).
   */
  'doc_string'?: (string);
}

/**
 * Representation of Starlark function definition.
 */
export interface StarlarkFunctionInfo__Output {
  /**
   * The name of the function.
   */
  'function_name': (string);
  /**
   * The parameters for the function.
   */
  'parameter': (_stardoc_output_FunctionParamInfo__Output)[];
  /**
   * The documented description of the function (if specified in the function's
   * docstring).
   */
  'doc_string': (string);
}
