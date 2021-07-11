// Original file: proto/remote_execution.proto

import type { _build_bazel_remote_execution_v2_DigestFunction_Value } from '../../../../../build/bazel/remote/execution/v2/DigestFunction';
import type { ActionCacheUpdateCapabilities as _build_bazel_remote_execution_v2_ActionCacheUpdateCapabilities, ActionCacheUpdateCapabilities__Output as _build_bazel_remote_execution_v2_ActionCacheUpdateCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/ActionCacheUpdateCapabilities';
import type { PriorityCapabilities as _build_bazel_remote_execution_v2_PriorityCapabilities, PriorityCapabilities__Output as _build_bazel_remote_execution_v2_PriorityCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/PriorityCapabilities';
import type { _build_bazel_remote_execution_v2_SymlinkAbsolutePathStrategy_Value } from '../../../../../build/bazel/remote/execution/v2/SymlinkAbsolutePathStrategy';
import type { Long } from '@grpc/proto-loader';

/**
 * Capabilities of the remote cache system.
 */
export interface CacheCapabilities {
  /**
   * All the digest functions supported by the remote cache.
   * Remote cache may support multiple digest functions simultaneously.
   */
  'digestFunction'?: (_build_bazel_remote_execution_v2_DigestFunction_Value | keyof typeof _build_bazel_remote_execution_v2_DigestFunction_Value)[];
  /**
   * Capabilities for updating the action cache.
   */
  'actionCacheUpdateCapabilities'?: (_build_bazel_remote_execution_v2_ActionCacheUpdateCapabilities | null);
  /**
   * Supported cache priority range for both CAS and ActionCache.
   */
  'cachePriorityCapabilities'?: (_build_bazel_remote_execution_v2_PriorityCapabilities | null);
  /**
   * Maximum total size of blobs to be uploaded/downloaded using
   * batch methods. A value of 0 means no limit is set, although
   * in practice there will always be a message size limitation
   * of the protocol in use, e.g. GRPC.
   */
  'maxBatchTotalSizeBytes'?: (number | string | Long);
  /**
   * Whether absolute symlink targets are supported.
   */
  'symlinkAbsolutePathStrategy'?: (_build_bazel_remote_execution_v2_SymlinkAbsolutePathStrategy_Value | keyof typeof _build_bazel_remote_execution_v2_SymlinkAbsolutePathStrategy_Value);
}

/**
 * Capabilities of the remote cache system.
 */
export interface CacheCapabilities__Output {
  /**
   * All the digest functions supported by the remote cache.
   * Remote cache may support multiple digest functions simultaneously.
   */
  'digestFunction': (_build_bazel_remote_execution_v2_DigestFunction_Value)[];
  /**
   * Capabilities for updating the action cache.
   */
  'actionCacheUpdateCapabilities': (_build_bazel_remote_execution_v2_ActionCacheUpdateCapabilities__Output | null);
  /**
   * Supported cache priority range for both CAS and ActionCache.
   */
  'cachePriorityCapabilities': (_build_bazel_remote_execution_v2_PriorityCapabilities__Output | null);
  /**
   * Maximum total size of blobs to be uploaded/downloaded using
   * batch methods. A value of 0 means no limit is set, although
   * in practice there will always be a message size limitation
   * of the protocol in use, e.g. GRPC.
   */
  'maxBatchTotalSizeBytes': (Long);
  /**
   * Whether absolute symlink targets are supported.
   */
  'symlinkAbsolutePathStrategy': (_build_bazel_remote_execution_v2_SymlinkAbsolutePathStrategy_Value);
}
