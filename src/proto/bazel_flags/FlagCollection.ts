// Original file: proto/bazel_flags.proto

import type {
  FlagInfo as _bazel_flags_FlagInfo,
  FlagInfo__Output as _bazel_flags_FlagInfo__Output,
} from '../bazel_flags/FlagInfo';

export interface FlagCollection {
  flagInfos?: _bazel_flags_FlagInfo[];
}

export interface FlagCollection__Output {
  flagInfos: _bazel_flags_FlagInfo__Output[];
}
