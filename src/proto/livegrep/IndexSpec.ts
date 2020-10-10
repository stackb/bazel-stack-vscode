// Original file: proto/livegrep.proto

import { PathSpec as _livegrep_PathSpec, PathSpec__Output as _livegrep_PathSpec__Output } from '../livegrep/PathSpec';
import { RepoSpec as _livegrep_RepoSpec, RepoSpec__Output as _livegrep_RepoSpec__Output } from '../livegrep/RepoSpec';

export interface IndexSpec {
  'name'?: (string);
  'paths'?: (_livegrep_PathSpec)[];
  'repos'?: (_livegrep_RepoSpec)[];
}

export interface IndexSpec__Output {
  'name': (string);
  'paths': (_livegrep_PathSpec__Output)[];
  'repos': (_livegrep_RepoSpec__Output)[];
}
