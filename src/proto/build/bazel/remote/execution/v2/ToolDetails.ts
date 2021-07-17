// Original file: proto/remote_execution.proto

/**
 * Details for the tool used to call the API.
 */
export interface ToolDetails {
  /**
   * Name of the tool, e.g. bazel.
   */
  toolName?: string;
  /**
   * Version of the tool used for the request, e.g. 5.0.3.
   */
  toolVersion?: string;
}

/**
 * Details for the tool used to call the API.
 */
export interface ToolDetails__Output {
  /**
   * Name of the tool, e.g. bazel.
   */
  toolName: string;
  /**
   * Version of the tool used for the request, e.g. 5.0.3.
   */
  toolVersion: string;
}
