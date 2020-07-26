// Original file: src/proto/stardoc_output/stardoc_output.proto

import { AttributeInfo as _stardoc_output_AttributeInfo, AttributeInfo__Output as _stardoc_output_AttributeInfo__Output } from '../stardoc_output/AttributeInfo';

/**
 * Representation of a Starlark aspect definition.
 */
export interface AspectInfo {
  /**
   * The name of the aspect.
   */
  'aspect_name'?: (string);
  /**
   * The documentation string of the aspect.
   */
  'doc_string'?: (string);
  /**
   * The rule attributes along which the aspect propagates.
   */
  'aspect_attribute'?: (string)[];
  /**
   * The attributes of the aspect.
   */
  'attribute'?: (_stardoc_output_AttributeInfo)[];
}

/**
 * Representation of a Starlark aspect definition.
 */
export interface AspectInfo__Output {
  /**
   * The name of the aspect.
   */
  'aspect_name': (string);
  /**
   * The documentation string of the aspect.
   */
  'doc_string': (string);
  /**
   * The rule attributes along which the aspect propagates.
   */
  'aspect_attribute': (string)[];
  /**
   * The attributes of the aspect.
   */
  'attribute': (_stardoc_output_AttributeInfo__Output)[];
}
