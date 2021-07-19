// Original file: proto/livegrep.proto

import type {
  Metadata as _livegrep_Metadata,
  Metadata__Output as _livegrep_Metadata__Output,
} from '../livegrep/Metadata';

export interface PathSpec {
  path?: string;
  name?: string;
  orderedContents?: string;
  metadata?: _livegrep_Metadata | null;
}

export interface PathSpec__Output {
  path: string;
  name: string;
  orderedContents: string;
  metadata: _livegrep_Metadata__Output | null;
}
