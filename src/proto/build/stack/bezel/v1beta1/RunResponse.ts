// Original file: proto/bzl.proto

import { ExecRequest as _build_stack_bezel_v1beta1_ExecRequest, ExecRequest__Output as _build_stack_bezel_v1beta1_ExecRequest__Output } from '../../../../build/stack/bezel/v1beta1/ExecRequest';

export interface RunResponse {
  /**
   * The id of the command, assigned internally by bazel command_server
   */
  'commandId'?: (string);
  'standardOutput'?: (Buffer | Uint8Array | string);
  'standardError'?: (Buffer | Uint8Array | string);
  /**
   * Exit code of the run process
   */
  'exitCode'?: (number);
  /**
   * True if the command has finished, generally comes from the command_server
   * RunResponse.
   */
  'finished'?: (boolean);
  /**
   * A grpc error code
   */
  'code'?: (number);
  /**
   * Run requested, with details about how to run the execution
   */
  'execRequest'?: (_build_stack_bezel_v1beta1_ExecRequest);
}

export interface RunResponse__Output {
  /**
   * The id of the command, assigned internally by bazel command_server
   */
  'commandId': (string);
  'standardOutput': (Buffer);
  'standardError': (Buffer);
  /**
   * Exit code of the run process
   */
  'exitCode': (number);
  /**
   * True if the command has finished, generally comes from the command_server
   * RunResponse.
   */
  'finished': (boolean);
  /**
   * A grpc error code
   */
  'code': (number);
  /**
   * Run requested, with details about how to run the execution
   */
  'execRequest'?: (_build_stack_bezel_v1beta1_ExecRequest__Output);
}
