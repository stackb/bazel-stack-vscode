// Original file: proto/livegrep.proto

import type { Metadata as _livegrep_Metadata, Metadata__Output as _livegrep_Metadata__Output } from '../livegrep/Metadata';

export interface RepoSpec {
  'path'?: (string);
  'name'?: (string);
  'revisions'?: (string)[];
  'metadata'?: (_livegrep_Metadata | null);
  'walkSubmodules'?: (boolean);
}

export interface RepoSpec__Output {
  'path': (string);
  'name': (string);
  'revisions': (string)[];
  'metadata': (_livegrep_Metadata__Output | null);
  'walkSubmodules': (boolean);
}
