// Original file: proto/remote_execution.proto

/**
 * Supported range of priorities, including boundaries.
 */
export interface _build_bazel_remote_execution_v2_PriorityCapabilities_PriorityRange {
  minPriority?: number;
  maxPriority?: number;
}

/**
 * Supported range of priorities, including boundaries.
 */
export interface _build_bazel_remote_execution_v2_PriorityCapabilities_PriorityRange__Output {
  minPriority: number;
  maxPriority: number;
}

/**
 * Allowed values for priority in
 * [ResultsCachePolicy][google.devtools.remoteexecution.v2.ResultsCachePolicy]
 * Used for querying both cache and execution valid priority ranges.
 */
export interface PriorityCapabilities {
  priorities?: _build_bazel_remote_execution_v2_PriorityCapabilities_PriorityRange[];
}

/**
 * Allowed values for priority in
 * [ResultsCachePolicy][google.devtools.remoteexecution.v2.ResultsCachePolicy]
 * Used for querying both cache and execution valid priority ranges.
 */
export interface PriorityCapabilities__Output {
  priorities: _build_bazel_remote_execution_v2_PriorityCapabilities_PriorityRange__Output[];
}
