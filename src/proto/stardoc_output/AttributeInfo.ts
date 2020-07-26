// Original file: src/proto/stardoc_output/stardoc_output.proto

import { AttributeType as _stardoc_output_AttributeType } from '../stardoc_output/AttributeType';
import { ProviderNameGroup as _stardoc_output_ProviderNameGroup, ProviderNameGroup__Output as _stardoc_output_ProviderNameGroup__Output } from '../stardoc_output/ProviderNameGroup';

/**
 * Representation of a Starlark rule attribute definition, comprised of an
 * attribute name, and a schema defined by a call to one of the 'attr' module
 * methods enumerated at
 * https://docs.bazel.build/versions/master/skylark/lib/attr.html
 */
export interface AttributeInfo {
  /**
   * The name of the attribute.
   */
  'name'?: (string);
  /**
   * The documentation string of the attribute, supplied via the 'doc'
   * parameter to the schema-creation call.
   */
  'doc_string'?: (string);
  /**
   * The type of the attribute, defined generally by which function is invoked
   * in the attr module.
   */
  'type'?: (_stardoc_output_AttributeType | keyof typeof _stardoc_output_AttributeType);
  /**
   * If true, all targets of the rule must specify a value for this attribute.
   */
  'mandatory'?: (boolean);
  /**
   * The target(s) in this attribute must define all the providers of at least
   * one of the ProviderNameGroups in this list. If the Attribute Type is not a
   * label, a label list, or a label-keyed string dictionary, the field will be
   * left empty.
   */
  'provider_name_group'?: (_stardoc_output_ProviderNameGroup)[];
  /**
   * The string representation of the default value of this attribute.
   */
  'default_value'?: (string);
}

/**
 * Representation of a Starlark rule attribute definition, comprised of an
 * attribute name, and a schema defined by a call to one of the 'attr' module
 * methods enumerated at
 * https://docs.bazel.build/versions/master/skylark/lib/attr.html
 */
export interface AttributeInfo__Output {
  /**
   * The name of the attribute.
   */
  'name': (string);
  /**
   * The documentation string of the attribute, supplied via the 'doc'
   * parameter to the schema-creation call.
   */
  'doc_string': (string);
  /**
   * The type of the attribute, defined generally by which function is invoked
   * in the attr module.
   */
  'type': (keyof typeof _stardoc_output_AttributeType);
  /**
   * If true, all targets of the rule must specify a value for this attribute.
   */
  'mandatory': (boolean);
  /**
   * The target(s) in this attribute must define all the providers of at least
   * one of the ProviderNameGroups in this list. If the Attribute Type is not a
   * label, a label list, or a label-keyed string dictionary, the field will be
   * left empty.
   */
  'provider_name_group': (_stardoc_output_ProviderNameGroup__Output)[];
  /**
   * The string representation of the default value of this attribute.
   */
  'default_value': (string);
}
