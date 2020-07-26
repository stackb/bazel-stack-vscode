// Original file: src/proto/stardoc_output/stardoc_output.proto


/**
 * Representation of a Starlark provider field definition, comprised of
 * the field name and provider description.
 */
export interface ProviderFieldInfo {
  /**
   * The name of the field.
   */
  'name'?: (string);
  /**
   * The description of the provider.
   */
  'doc_string'?: (string);
}

/**
 * Representation of a Starlark provider field definition, comprised of
 * the field name and provider description.
 */
export interface ProviderFieldInfo__Output {
  /**
   * The name of the field.
   */
  'name': (string);
  /**
   * The description of the provider.
   */
  'doc_string': (string);
}
