// Original file: proto/remote_execution.proto

/**
 * A request message for
 * [WaitExecution][build.bazel.remote.execution.v2.Execution.WaitExecution].
 */
export interface WaitExecutionRequest {
  /**
   * The name of the [Operation][google.longrunning.Operation]
   * returned by [Execute][build.bazel.remote.execution.v2.Execution.Execute].
   */
  name?: string;
}

/**
 * A request message for
 * [WaitExecution][build.bazel.remote.execution.v2.Execution.WaitExecution].
 */
export interface WaitExecutionRequest__Output {
  /**
   * The name of the [Operation][google.longrunning.Operation]
   * returned by [Execute][build.bazel.remote.execution.v2.Execution.Execute].
   */
  name: string;
}
