// Original file: proto/remote_execution.proto

import type { ExecuteRequest as _build_bazel_remote_execution_v2_ExecuteRequest, ExecuteRequest__Output as _build_bazel_remote_execution_v2_ExecuteRequest__Output } from '../../../../../build/bazel/remote/execution/v2/ExecuteRequest';
import type { Action as _build_bazel_remote_execution_v2_Action, Action__Output as _build_bazel_remote_execution_v2_Action__Output } from '../../../../../build/bazel/remote/execution/v2/Action';
import type { Command as _build_bazel_remote_execution_v2_Command, Command__Output as _build_bazel_remote_execution_v2_Command__Output } from '../../../../../build/bazel/remote/execution/v2/Command';
import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../../google/protobuf/Timestamp';

/**
 * Next tag: 8
 */
export interface ExecutionTask {
  'executeRequest'?: (_build_bazel_remote_execution_v2_ExecuteRequest | null);
  'jwt'?: (string);
  'invocationId'?: (string);
  'action'?: (_build_bazel_remote_execution_v2_Action | null);
  'command'?: (_build_bazel_remote_execution_v2_Command | null);
  'executionId'?: (string);
  'queuedTimestamp'?: (_google_protobuf_Timestamp | null);
}

/**
 * Next tag: 8
 */
export interface ExecutionTask__Output {
  'executeRequest': (_build_bazel_remote_execution_v2_ExecuteRequest__Output | null);
  'jwt': (string);
  'invocationId': (string);
  'action': (_build_bazel_remote_execution_v2_Action__Output | null);
  'command': (_build_bazel_remote_execution_v2_Command__Output | null);
  'executionId': (string);
  'queuedTimestamp': (_google_protobuf_Timestamp__Output | null);
}
