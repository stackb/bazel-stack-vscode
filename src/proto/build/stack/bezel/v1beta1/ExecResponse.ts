// Original file: proto/bzl.proto

import type { Long } from '@grpc/proto-loader';

export interface ExecResponse {
  /**
   * The pid of the process
   */
  pid?: number | string | Long;
  standardOutput?: Buffer | Uint8Array | string;
  standardError?: Buffer | Uint8Array | string;
  /**
   * Exit code of the run process
   */
  exitCode?: number;
  /**
   * True if the command has finished, generally comes from the command_server
   * RunResponse.
   */
  finished?: boolean;
}

export interface ExecResponse__Output {
  /**
   * The pid of the process
   */
  pid: Long;
  standardOutput: Buffer;
  standardError: Buffer;
  /**
   * Exit code of the run process
   */
  exitCode: number;
  /**
   * True if the command has finished, generally comes from the command_server
   * RunResponse.
   */
  finished: boolean;
}
