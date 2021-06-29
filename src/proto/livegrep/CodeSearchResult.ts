// Original file: proto/livegrep.proto

import type {
  SearchStats as _livegrep_SearchStats,
  SearchStats__Output as _livegrep_SearchStats__Output,
} from '../livegrep/SearchStats';
import type {
  SearchResult as _livegrep_SearchResult,
  SearchResult__Output as _livegrep_SearchResult__Output,
} from '../livegrep/SearchResult';
import type {
  FileResult as _livegrep_FileResult,
  FileResult__Output as _livegrep_FileResult__Output,
} from '../livegrep/FileResult';
import type { Long } from '@grpc/proto-loader';

export interface CodeSearchResult {
  stats?: _livegrep_SearchStats;
  results?: _livegrep_SearchResult[];
  fileResults?: _livegrep_FileResult[];
  /**
   * unique index identity that served this request
   */
  indexName?: string;
  indexTime?: number | string | Long;
}

export interface CodeSearchResult__Output {
  stats?: _livegrep_SearchStats__Output;
  results: _livegrep_SearchResult__Output[];
  fileResults: _livegrep_FileResult__Output[];
  /**
   * unique index identity that served this request
   */
  indexName: string;
  indexTime: Long;
}
