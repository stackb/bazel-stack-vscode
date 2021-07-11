// Original file: proto/build_event_stream.proto

import type { Long } from '@grpc/proto-loader';

/**
 * Things that happened during the build that could be of interest.
 */
export interface _build_event_stream_BuildFinished_AnomalyReport {
  /**
   * Was the build suspended at any time during the build.
   * Examples of suspensions are SIGSTOP, or the hardware being put to sleep.
   * If was_suspended is true, then most of the timings for this build are
   * suspect.
   */
  'wasSuspended'?: (boolean);
}

/**
 * Things that happened during the build that could be of interest.
 */
export interface _build_event_stream_BuildFinished_AnomalyReport__Output {
  /**
   * Was the build suspended at any time during the build.
   * Examples of suspensions are SIGSTOP, or the hardware being put to sleep.
   * If was_suspended is true, then most of the timings for this build are
   * suspect.
   */
  'wasSuspended': (boolean);
}

/**
 * Exit code of a build. The possible values correspond to the predefined
 * codes in bazel's lib.ExitCode class, as well as any custom exit code a
 * module might define. The predefined exit codes are subject to change (but
 * rarely do) and are not part of the public API.
 * 
 * A build was successful iff ExitCode.code equals 0.
 */
export interface _build_event_stream_BuildFinished_ExitCode {
  /**
   * The name of the exit code.
   */
  'name'?: (string);
  /**
   * The exit code.
   */
  'code'?: (number);
}

/**
 * Exit code of a build. The possible values correspond to the predefined
 * codes in bazel's lib.ExitCode class, as well as any custom exit code a
 * module might define. The predefined exit codes are subject to change (but
 * rarely do) and are not part of the public API.
 * 
 * A build was successful iff ExitCode.code equals 0.
 */
export interface _build_event_stream_BuildFinished_ExitCode__Output {
  /**
   * The name of the exit code.
   */
  'name': (string);
  /**
   * The exit code.
   */
  'code': (number);
}

/**
 * Event indicating the end of a build.
 */
export interface BuildFinished {
  /**
   * If the build succeeded or failed.
   */
  'overallSuccess'?: (boolean);
  /**
   * Time in milliseconds since the epoch.
   * TODO(buchgr): Use google.protobuf.Timestamp once bazel's protoc supports
   * it.
   */
  'finishTimeMillis'?: (number | string | Long);
  /**
   * The overall status of the build. A build was successful iff
   * ExitCode.code equals 0.
   */
  'exitCode'?: (_build_event_stream_BuildFinished_ExitCode | null);
  'anomalyReport'?: (_build_event_stream_BuildFinished_AnomalyReport | null);
}

/**
 * Event indicating the end of a build.
 */
export interface BuildFinished__Output {
  /**
   * If the build succeeded or failed.
   */
  'overallSuccess': (boolean);
  /**
   * Time in milliseconds since the epoch.
   * TODO(buchgr): Use google.protobuf.Timestamp once bazel's protoc supports
   * it.
   */
  'finishTimeMillis': (Long);
  /**
   * The overall status of the build. A build was successful iff
   * ExitCode.code equals 0.
   */
  'exitCode': (_build_event_stream_BuildFinished_ExitCode__Output | null);
  'anomalyReport': (_build_event_stream_BuildFinished_AnomalyReport__Output | null);
}
