// Original file: proto/remote_execution.proto

import type { CacheCapabilities as _build_bazel_remote_execution_v2_CacheCapabilities, CacheCapabilities__Output as _build_bazel_remote_execution_v2_CacheCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/CacheCapabilities';
import type { ExecutionCapabilities as _build_bazel_remote_execution_v2_ExecutionCapabilities, ExecutionCapabilities__Output as _build_bazel_remote_execution_v2_ExecutionCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/ExecutionCapabilities';
import type { SemVer as _build_bazel_semver_SemVer, SemVer__Output as _build_bazel_semver_SemVer__Output } from '../../../../../build/bazel/semver/SemVer';

/**
 * A response message for
 * [Capabilities.GetCapabilities][build.bazel.remote.execution.v2.Capabilities.GetCapabilities].
 */
export interface ServerCapabilities {
  /**
   * Capabilities of the remote cache system.
   */
  'cacheCapabilities'?: (_build_bazel_remote_execution_v2_CacheCapabilities | null);
  /**
   * Capabilities of the remote execution system.
   */
  'executionCapabilities'?: (_build_bazel_remote_execution_v2_ExecutionCapabilities | null);
  /**
   * Earliest RE API version supported, including deprecated versions.
   */
  'deprecatedApiVersion'?: (_build_bazel_semver_SemVer | null);
  /**
   * Earliest non-deprecated RE API version supported.
   */
  'lowApiVersion'?: (_build_bazel_semver_SemVer | null);
  /**
   * Latest RE API version supported.
   */
  'highApiVersion'?: (_build_bazel_semver_SemVer | null);
}

/**
 * A response message for
 * [Capabilities.GetCapabilities][build.bazel.remote.execution.v2.Capabilities.GetCapabilities].
 */
export interface ServerCapabilities__Output {
  /**
   * Capabilities of the remote cache system.
   */
  'cacheCapabilities': (_build_bazel_remote_execution_v2_CacheCapabilities__Output | null);
  /**
   * Capabilities of the remote execution system.
   */
  'executionCapabilities': (_build_bazel_remote_execution_v2_ExecutionCapabilities__Output | null);
  /**
   * Earliest RE API version supported, including deprecated versions.
   */
  'deprecatedApiVersion': (_build_bazel_semver_SemVer__Output | null);
  /**
   * Earliest non-deprecated RE API version supported.
   */
  'lowApiVersion': (_build_bazel_semver_SemVer__Output | null);
  /**
   * Latest RE API version supported.
   */
  'highApiVersion': (_build_bazel_semver_SemVer__Output | null);
}
