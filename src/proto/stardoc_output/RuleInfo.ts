// Original file: src/proto/stardoc_output/stardoc_output.proto

import { AttributeInfo as _stardoc_output_AttributeInfo, AttributeInfo__Output as _stardoc_output_AttributeInfo__Output } from '../stardoc_output/AttributeInfo';

/**
 * Representation of a Starlark rule definition.
 */
export interface RuleInfo {
  /**
   * The name of the rule.
   */
  'rule_name'?: (string);
  /**
   * The documentation string of the rule.
   */
  'doc_string'?: (string);
  /**
   * The attributes of the rule.
   */
  'attribute'?: (_stardoc_output_AttributeInfo)[];
}

/**
 * Representation of a Starlark rule definition.
 */
export interface RuleInfo__Output {
  /**
   * The name of the rule.
   */
  'rule_name': (string);
  /**
   * The documentation string of the rule.
   */
  'doc_string': (string);
  /**
   * The attributes of the rule.
   */
  'attribute': (_stardoc_output_AttributeInfo__Output)[];
}
