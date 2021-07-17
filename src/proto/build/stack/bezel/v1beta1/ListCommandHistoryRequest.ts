// Original file: proto/bzl.proto

export interface ListCommandHistoryRequest {
  /**
   * Optionally filter by workspace directory
   */
  cwd?: string;
}

export interface ListCommandHistoryRequest__Output {
  /**
   * Optionally filter by workspace directory
   */
  cwd: string;
}
