// Original file: proto/codesearch.proto

import type { Query as _livegrep_Query, Query__Output as _livegrep_Query__Output } from '../../../../livegrep/Query';

export interface ScopedQuery {
  /**
   * the name of the scope to search within
   */
  'scopeName'?: (string);
  /**
   * the search query
   */
  'query'?: (_livegrep_Query);
}

export interface ScopedQuery__Output {
  /**
   * the name of the scope to search within
   */
  'scopeName': (string);
  /**
   * the search query
   */
  'query'?: (_livegrep_Query__Output);
}
