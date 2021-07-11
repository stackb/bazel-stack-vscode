// Original file: proto/bzl.proto

import type { OrderedBuildEvent as _google_devtools_build_v1_OrderedBuildEvent, OrderedBuildEvent__Output as _google_devtools_build_v1_OrderedBuildEvent__Output } from '../../../../google/devtools/build/v1/OrderedBuildEvent';
import type { ExecRequest as _build_stack_bezel_v1beta1_ExecRequest, ExecRequest__Output as _build_stack_bezel_v1beta1_ExecRequest__Output } from '../../../../build/stack/bezel/v1beta1/ExecRequest';

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
   * Additional build events that have been reported on the response stream.
   */
  'orderedBuildEvent'?: (_google_devtools_build_v1_OrderedBuildEvent)[];
  /**
   * Run requested, with details about how to run the execution
   */
  'execRequest'?: (_build_stack_bezel_v1beta1_ExecRequest | null);
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
   * Additional build events that have been reported on the response stream.
   */
  'orderedBuildEvent': (_google_devtools_build_v1_OrderedBuildEvent__Output)[];
  /**
   * Run requested, with details about how to run the execution
   */
  'execRequest': (_build_stack_bezel_v1beta1_ExecRequest__Output | null);
}
