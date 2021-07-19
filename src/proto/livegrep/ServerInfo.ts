// Original file: proto/livegrep.proto

import type {
  Metadata as _livegrep_Metadata,
  Metadata__Output as _livegrep_Metadata__Output,
} from '../livegrep/Metadata';
import type { Long } from '@grpc/proto-loader';

export interface _livegrep_ServerInfo_Tree {
  name?: string;
  version?: string;
  metadata?: _livegrep_Metadata | null;
}

export interface _livegrep_ServerInfo_Tree__Output {
  name: string;
  version: string;
  metadata: _livegrep_Metadata__Output | null;
}

export interface ServerInfo {
  name?: string;
  trees?: _livegrep_ServerInfo_Tree[];
  hasTags?: boolean;
  /**
   * unix timestamp (seconds)
   */
  indexTime?: number | string | Long;
}

export interface ServerInfo__Output {
  name: string;
  trees: _livegrep_ServerInfo_Tree__Output[];
  hasTags: boolean;
  /**
   * unix timestamp (seconds)
   */
  indexTime: Long;
}
