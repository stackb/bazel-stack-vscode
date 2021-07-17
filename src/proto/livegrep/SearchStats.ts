// Original file: proto/livegrep.proto

import type { Long } from '@grpc/proto-loader';

// Original file: proto/livegrep.proto

export enum _livegrep_SearchStats_ExitReason {
  NONE = 0,
  TIMEOUT = 1,
  MATCH_LIMIT = 2,
}

export interface SearchStats {
  re2Time?: number | string | Long;
  gitTime?: number | string | Long;
  sortTime?: number | string | Long;
  indexTime?: number | string | Long;
  analyzeTime?: number | string | Long;
  exitReason?: _livegrep_SearchStats_ExitReason | keyof typeof _livegrep_SearchStats_ExitReason;
  totalTime?: number | string | Long;
}

export interface SearchStats__Output {
  re2Time: Long;
  gitTime: Long;
  sortTime: Long;
  indexTime: Long;
  analyzeTime: Long;
  exitReason: _livegrep_SearchStats_ExitReason;
  totalTime: Long;
}
