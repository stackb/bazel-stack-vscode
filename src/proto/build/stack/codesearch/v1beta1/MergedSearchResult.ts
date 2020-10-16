// Original file: proto/codesearch.proto

import { LineBlock as _build_stack_codesearch_v1beta1_LineBlock, LineBlock__Output as _build_stack_codesearch_v1beta1_LineBlock__Output } from '../../../../build/stack/codesearch/v1beta1/LineBlock';

/**
 * MergedSearchResult is the union of multiple SearchResult items for the same
 * file path.  The set of lines to be displayed is captured by the lines map,
 * whereas the line matches are represented by the bounds.
 */
export interface MergedSearchResult {
  'tree'?: (string);
  'version'?: (string);
  'path'?: (string);
  'block'?: (_build_stack_codesearch_v1beta1_LineBlock)[];
  /**
   * string for the external link
   */
  'externalUrl'?: (string);
}

/**
 * MergedSearchResult is the union of multiple SearchResult items for the same
 * file path.  The set of lines to be displayed is captured by the lines map,
 * whereas the line matches are represented by the bounds.
 */
export interface MergedSearchResult__Output {
  'tree': (string);
  'version': (string);
  'path': (string);
  'block': (_build_stack_codesearch_v1beta1_LineBlock__Output)[];
  /**
   * string for the external link
   */
  'externalUrl': (string);
}
