// Original file: proto/remote_execution.proto

import type { _build_bazel_remote_execution_v2_DigestFunction_Value } from '../../../../../build/bazel/remote/execution/v2/DigestFunction';
import type { PriorityCapabilities as _build_bazel_remote_execution_v2_PriorityCapabilities, PriorityCapabilities__Output as _build_bazel_remote_execution_v2_PriorityCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/PriorityCapabilities';

/**
 * Capabilities of the remote execution system.
 */
export interface ExecutionCapabilities {
  /**
   * Remote execution may only support a single digest function.
   */
  'digestFunction'?: (_build_bazel_remote_execution_v2_DigestFunction_Value | keyof typeof _build_bazel_remote_execution_v2_DigestFunction_Value);
  /**
   * Whether remote execution is enabled for the particular server/instance.
   */
  'execEnabled'?: (boolean);
  /**
   * Supported execution priority range.
   */
  'executionPriorityCapabilities'?: (_build_bazel_remote_execution_v2_PriorityCapabilities | null);
  /**
   * Supported node properties.
   */
  'supportedNodeProperties'?: (string)[];
}

/**
 * Capabilities of the remote execution system.
 */
export interface ExecutionCapabilities__Output {
  /**
   * Remote execution may only support a single digest function.
   */
  'digestFunction': (_build_bazel_remote_execution_v2_DigestFunction_Value);
  /**
   * Whether remote execution is enabled for the particular server/instance.
   */
  'execEnabled': (boolean);
  /**
   * Supported execution priority range.
   */
  'executionPriorityCapabilities': (_build_bazel_remote_execution_v2_PriorityCapabilities__Output | null);
  /**
   * Supported node properties.
   */
  'supportedNodeProperties': (string)[];
}
