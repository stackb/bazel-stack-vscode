// Original file: proto/codesearch.proto

import type { SearchStats as _livegrep_SearchStats, SearchStats__Output as _livegrep_SearchStats__Output } from '../../../../livegrep/SearchStats';
import type { MergedSearchResult as _build_stack_codesearch_v1beta1_MergedSearchResult, MergedSearchResult__Output as _build_stack_codesearch_v1beta1_MergedSearchResult__Output } from '../../../../build/stack/codesearch/v1beta1/MergedSearchResult';
import type { FileResult as _livegrep_FileResult, FileResult__Output as _livegrep_FileResult__Output } from '../../../../livegrep/FileResult';
import type { Long } from '@grpc/proto-loader';

export interface MergedCodeSearchResult {
  'stats'?: (_livegrep_SearchStats);
  'results'?: (_build_stack_codesearch_v1beta1_MergedSearchResult)[];
  'fileResults'?: (_livegrep_FileResult)[];
  /**
   * unique index identity that served this request
   */
  'indexName'?: (string);
  'indexTime'?: (number | string | Long);
  /**
   * the total number of results, before merge
   */
  'totalResults'?: (number | string | Long);
}

export interface MergedCodeSearchResult__Output {
  'stats'?: (_livegrep_SearchStats__Output);
  'results': (_build_stack_codesearch_v1beta1_MergedSearchResult__Output)[];
  'fileResults': (_livegrep_FileResult__Output)[];
  /**
   * unique index identity that served this request
   */
  'indexName': (string);
  'indexTime': (Long);
  /**
   * the total number of results, before merge
   */
  'totalResults': (Long);
}
