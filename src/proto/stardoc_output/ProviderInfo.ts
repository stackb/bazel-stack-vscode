// Original file: src/proto/stardoc_output/stardoc_output.proto

import { ProviderFieldInfo as _stardoc_output_ProviderFieldInfo, ProviderFieldInfo__Output as _stardoc_output_ProviderFieldInfo__Output } from '../stardoc_output/ProviderFieldInfo';

/**
 * Representation of a Starlark provider definition.
 */
export interface ProviderInfo {
  /**
   * The name of the provider.
   */
  'provider_name'?: (string);
  /**
   * The description of the provider.
   */
  'doc_string'?: (string);
  /**
   * The fields of the provider.
   */
  'field_info'?: (_stardoc_output_ProviderFieldInfo)[];
}

/**
 * Representation of a Starlark provider definition.
 */
export interface ProviderInfo__Output {
  /**
   * The name of the provider.
   */
  'provider_name': (string);
  /**
   * The description of the provider.
   */
  'doc_string': (string);
  /**
   * The fields of the provider.
   */
  'field_info': (_stardoc_output_ProviderFieldInfo__Output)[];
}
