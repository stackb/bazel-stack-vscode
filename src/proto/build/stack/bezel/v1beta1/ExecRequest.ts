// Original file: proto/bzl.proto

import type {
  EnvironmentVariable as _build_stack_bezel_v1beta1_EnvironmentVariable,
  EnvironmentVariable__Output as _build_stack_bezel_v1beta1_EnvironmentVariable__Output,
} from '../../../../build/stack/bezel/v1beta1/EnvironmentVariable';

/**
 * Mirrors the command_server ExecRequest but uses strings instead of bytes.
 * Hopefully that's not too big a deal.
 */
export interface ExecRequest {
  workingDirectory?: string;
  argv?: string[];
  environmentVariable?: _build_stack_bezel_v1beta1_EnvironmentVariable[];
}

/**
 * Mirrors the command_server ExecRequest but uses strings instead of bytes.
 * Hopefully that's not too big a deal.
 */
export interface ExecRequest__Output {
  workingDirectory: string;
  argv: string[];
  environmentVariable: _build_stack_bezel_v1beta1_EnvironmentVariable__Output[];
}
