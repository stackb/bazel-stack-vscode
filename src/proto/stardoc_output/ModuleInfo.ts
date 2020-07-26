// Original file: src/proto/stardoc_output/stardoc_output.proto

import { RuleInfo as _stardoc_output_RuleInfo, RuleInfo__Output as _stardoc_output_RuleInfo__Output } from '../stardoc_output/RuleInfo';
import { ProviderInfo as _stardoc_output_ProviderInfo, ProviderInfo__Output as _stardoc_output_ProviderInfo__Output } from '../stardoc_output/ProviderInfo';
import { StarlarkFunctionInfo as _stardoc_output_StarlarkFunctionInfo, StarlarkFunctionInfo__Output as _stardoc_output_StarlarkFunctionInfo__Output } from '../stardoc_output/StarlarkFunctionInfo';
import { AspectInfo as _stardoc_output_AspectInfo, AspectInfo__Output as _stardoc_output_AspectInfo__Output } from '../stardoc_output/AspectInfo';

/**
 * The root output proto of Stardoc. A single invocation of Stardoc will output
 * exactly one instance of this proto, representing all documentation for
 * the input Starlark file.
 */
export interface ModuleInfo {
  'rule_info'?: (_stardoc_output_RuleInfo)[];
  'provider_info'?: (_stardoc_output_ProviderInfo)[];
  'func_info'?: (_stardoc_output_StarlarkFunctionInfo)[];
  'aspect_info'?: (_stardoc_output_AspectInfo)[];
  /**
   * The docstring present at the top of the input Starlark file.
   */
  'module_docstring'?: (string);
}

/**
 * The root output proto of Stardoc. A single invocation of Stardoc will output
 * exactly one instance of this proto, representing all documentation for
 * the input Starlark file.
 */
export interface ModuleInfo__Output {
  'rule_info': (_stardoc_output_RuleInfo__Output)[];
  'provider_info': (_stardoc_output_ProviderInfo__Output)[];
  'func_info': (_stardoc_output_StarlarkFunctionInfo__Output)[];
  'aspect_info': (_stardoc_output_AspectInfo__Output)[];
  /**
   * The docstring present at the top of the input Starlark file.
   */
  'module_docstring': (string);
}
