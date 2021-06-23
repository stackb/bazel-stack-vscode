// Original file: proto/build_event_stream.proto

import type {
  File as _build_event_stream_File,
  File__Output as _build_event_stream_File__Output,
} from '../build_event_stream/File';
import type { TestStatus as _build_event_stream_TestStatus } from '../build_event_stream/TestStatus';
import type { Long } from '@grpc/proto-loader';

/**
 * Message providing optional meta data on the execution of the test action,
 * if available.
 */
export interface _build_event_stream_TestResult_ExecutionInfo {
  /**
   * Deprecated, use TargetComplete.test_timeout_seconds instead.
   */
  timeoutSeconds?: number;
  /**
   * Name of the strategy to execute this test action (e.g., "local",
   * "remote")
   */
  strategy?: string;
  /**
   * True, if the reported attempt was a cache hit in a remote cache.
   */
  cachedRemotely?: boolean;
  /**
   * The exit code of the test action.
   */
  exitCode?: number;
  /**
   * The hostname of the machine where the test action was executed (in case
   * of remote execution), if known.
   */
  hostname?: string;
  timingBreakdown?: _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown;
  resourceUsage?: _build_event_stream_TestResult_ExecutionInfo_ResourceUsage[];
}

/**
 * Message providing optional meta data on the execution of the test action,
 * if available.
 */
export interface _build_event_stream_TestResult_ExecutionInfo__Output {
  /**
   * Deprecated, use TargetComplete.test_timeout_seconds instead.
   */
  timeoutSeconds: number;
  /**
   * Name of the strategy to execute this test action (e.g., "local",
   * "remote")
   */
  strategy: string;
  /**
   * True, if the reported attempt was a cache hit in a remote cache.
   */
  cachedRemotely: boolean;
  /**
   * The exit code of the test action.
   */
  exitCode: number;
  /**
   * The hostname of the machine where the test action was executed (in case
   * of remote execution), if known.
   */
  hostname: string;
  timingBreakdown?: _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown__Output;
  resourceUsage: _build_event_stream_TestResult_ExecutionInfo_ResourceUsage__Output[];
}

export interface _build_event_stream_TestResult_ExecutionInfo_ResourceUsage {
  name?: string;
  value?: number | string | Long;
}

export interface _build_event_stream_TestResult_ExecutionInfo_ResourceUsage__Output {
  name: string;
  value: Long;
}

/**
 * Represents a hierarchical timing breakdown of an activity.
 * The top level time should be the total time of the activity.
 * Invariant: time_millis >= sum of time_millis of all direct children.
 */
export interface _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown {
  child?: _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown[];
  name?: string;
  timeMillis?: number | string | Long;
}

/**
 * Represents a hierarchical timing breakdown of an activity.
 * The top level time should be the total time of the activity.
 * Invariant: time_millis >= sum of time_millis of all direct children.
 */
export interface _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown__Output {
  child: _build_event_stream_TestResult_ExecutionInfo_TimingBreakdown__Output[];
  name: string;
  timeMillis: Long;
}

/**
 * Payload on events reporting about individual test action.
 */
export interface TestResult {
  /**
   * Files (logs, test.xml, undeclared outputs, etc) generated by that test
   * action.
   */
  testActionOutput?: _build_event_stream_File[];
  /**
   * Time the test took to run. For locally cached results, this is the time
   * the cached invocation took when it was invoked.
   */
  testAttemptDurationMillis?: number | string | Long;
  /**
   * True, if the reported attempt is taken from the tool's local cache.
   */
  cachedLocally?: boolean;
  /**
   * The status of this test.
   */
  status?: _build_event_stream_TestStatus | keyof typeof _build_event_stream_TestStatus;
  /**
   * Time in milliseconds since the epoch at which the test attempt was started.
   * Note: for cached test results, this is time can be before the start of the
   * build.
   */
  testAttemptStartMillisEpoch?: number | string | Long;
  /**
   * Warnings generated by that test action.
   */
  warning?: string[];
  executionInfo?: _build_event_stream_TestResult_ExecutionInfo;
  /**
   * Additional details about the status of the test. This is intended for
   * user display and must not be parsed.
   */
  statusDetails?: string;
}

/**
 * Payload on events reporting about individual test action.
 */
export interface TestResult__Output {
  /**
   * Files (logs, test.xml, undeclared outputs, etc) generated by that test
   * action.
   */
  testActionOutput: _build_event_stream_File__Output[];
  /**
   * Time the test took to run. For locally cached results, this is the time
   * the cached invocation took when it was invoked.
   */
  testAttemptDurationMillis: Long;
  /**
   * True, if the reported attempt is taken from the tool's local cache.
   */
  cachedLocally: boolean;
  /**
   * The status of this test.
   */
  status: _build_event_stream_TestStatus;
  /**
   * Time in milliseconds since the epoch at which the test attempt was started.
   * Note: for cached test results, this is time can be before the start of the
   * build.
   */
  testAttemptStartMillisEpoch: Long;
  /**
   * Warnings generated by that test action.
   */
  warning: string[];
  executionInfo?: _build_event_stream_TestResult_ExecutionInfo__Output;
  /**
   * Additional details about the status of the test. This is intended for
   * user display and must not be parsed.
   */
  statusDetails: string;
}
