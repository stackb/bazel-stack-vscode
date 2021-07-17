// Original file: proto/bzl.proto

export interface GetWorkspaceRequest {
  /**
   * The filesystem path where the workspace exists
   */
  cwd?: string;
  /**
   * Alternatively, the output_base.  Must specify at least one of these.
   */
  outputBase?: string;
}

export interface GetWorkspaceRequest__Output {
  /**
   * The filesystem path where the workspace exists
   */
  cwd: string;
  /**
   * Alternatively, the output_base.  Must specify at least one of these.
   */
  outputBase: string;
}
