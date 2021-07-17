// Original file: proto/remote_execution.proto

// Original file: proto/remote_execution.proto

export enum _build_bazel_remote_execution_v2_ExecutionStage_Value {
  /**
   * Invalid value.
   */
  UNKNOWN = 0,
  /**
   * Checking the result against the cache.
   */
  CACHE_CHECK = 1,
  /**
   * Currently idle, awaiting a free machine to execute.
   */
  QUEUED = 2,
  /**
   * Currently being executed by a worker.
   */
  EXECUTING = 3,
  /**
   * Finished execution.
   */
  COMPLETED = 4,
}

/**
 * The current stage of action execution.
 */
export interface ExecutionStage {}

/**
 * The current stage of action execution.
 */
export interface ExecutionStage__Output {}
