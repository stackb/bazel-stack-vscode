// Original file: proto/remote_execution.proto

import type { Directory as _build_bazel_remote_execution_v2_Directory, Directory__Output as _build_bazel_remote_execution_v2_Directory__Output } from '../../../../../build/bazel/remote/execution/v2/Directory';
import type { Long } from '@grpc/proto-loader';

export interface SizedDirectory {
  'directory'?: (_build_bazel_remote_execution_v2_Directory | null);
  'sizeBytes'?: (number | string | Long);
}

export interface SizedDirectory__Output {
  'directory': (_build_bazel_remote_execution_v2_Directory__Output | null);
  'sizeBytes': (Long);
}
