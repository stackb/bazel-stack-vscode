// Original file: src/proto/stardoc_output/stardoc_output.proto


/**
 * Representation of a set of providers that a rule attribute may be required to
 * have.
 */
export interface ProviderNameGroup {
  /**
   * The names of the providers that must be given by any dependency appearing
   * in this attribute. The name will be "Unknown Provider" if the name is
   * unidentifiable, for example, if the provider is part of a namespace.
   * TODO(kendalllane): Fix documentation of providers from namespaces.
   */
  'provider_name'?: (string)[];
}

/**
 * Representation of a set of providers that a rule attribute may be required to
 * have.
 */
export interface ProviderNameGroup__Output {
  /**
   * The names of the providers that must be given by any dependency appearing
   * in this attribute. The name will be "Unknown Provider" if the name is
   * unidentifiable, for example, if the provider is part of a namespace.
   * TODO(kendalllane): Fix documentation of providers from namespaces.
   */
  'provider_name': (string)[];
}
