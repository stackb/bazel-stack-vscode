// Original file: proto/remote_execution.proto

import type {
  SizedDirectory as _build_bazel_remote_execution_v2_SizedDirectory,
  SizedDirectory__Output as _build_bazel_remote_execution_v2_SizedDirectory__Output,
} from '../../../../../build/bazel/remote/execution/v2/SizedDirectory';

export interface TreeToken {
  sizedDirectories?: _build_bazel_remote_execution_v2_SizedDirectory[];
}

export interface TreeToken__Output {
  sizedDirectories: _build_bazel_remote_execution_v2_SizedDirectory__Output[];
}
