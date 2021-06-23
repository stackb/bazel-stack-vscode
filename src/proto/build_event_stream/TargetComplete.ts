// Original file: proto/build_event_stream.proto

import type {
  OutputGroup as _build_event_stream_OutputGroup,
  OutputGroup__Output as _build_event_stream_OutputGroup__Output,
} from '../build_event_stream/OutputGroup';
import type {
  File as _build_event_stream_File,
  File__Output as _build_event_stream_File__Output,
} from '../build_event_stream/File';
import type { TestSize as _build_event_stream_TestSize } from '../build_event_stream/TestSize';
import type {
  FailureDetail as _failure_details_FailureDetail,
  FailureDetail__Output as _failure_details_FailureDetail__Output,
} from '../failure_details/FailureDetail';
import type { Long } from '@grpc/proto-loader';

/**
 * Payload of the event indicating the completion of a target. The target is
 * specified in the id. If the target failed the root causes are provided as
 * children events.
 */
export interface TargetComplete {
  success?: boolean;
  /**
   * The output files are arranged by their output group. If an output file
   * is part of multiple output groups, it appears once in each output
   * group.
   */
  outputGroup?: _build_event_stream_OutputGroup[];
  /**
   * List of tags associated with this configured target.
   */
  tag?: string[];
  /**
   * Temporarily, also report the important outputs directly. This is only to
   * allow existing clients help transition to the deduplicated representation;
   * new clients should not use it.
   */
  importantOutput?: _build_event_stream_File[];
  /**
   * The kind of target (e.g.,  e.g. "cc_library rule", "source file",
   * "generated file") where the completion is reported.
   * Deprecated: use the target_kind field in TargetConfigured instead.
   */
  targetKind?: string;
  /**
   * The size of the test, if the target is a test target. Unset otherwise.
   * Deprecated: use the test_size field in TargetConfigured instead.
   */
  testSize?: _build_event_stream_TestSize | keyof typeof _build_event_stream_TestSize;
  /**
   * The timeout specified for test actions under this configured target.
   */
  testTimeoutSeconds?: number | string | Long;
  /**
   * Report output artifacts (referenced transitively via output_group) which
   * emit directories instead of singleton files. These directory_output entries
   * will never include a uri.
   */
  directoryOutput?: _build_event_stream_File[];
  /**
   * Failure information about the target, only populated if success is false,
   * and sometimes not even then. Equal to one of the ActionExecuted
   * failure_detail fields for one of the root cause ActionExecuted events.
   */
  failureDetail?: _failure_details_FailureDetail;
}

/**
 * Payload of the event indicating the completion of a target. The target is
 * specified in the id. If the target failed the root causes are provided as
 * children events.
 */
export interface TargetComplete__Output {
  success: boolean;
  /**
   * The output files are arranged by their output group. If an output file
   * is part of multiple output groups, it appears once in each output
   * group.
   */
  outputGroup: _build_event_stream_OutputGroup__Output[];
  /**
   * List of tags associated with this configured target.
   */
  tag: string[];
  /**
   * Temporarily, also report the important outputs directly. This is only to
   * allow existing clients help transition to the deduplicated representation;
   * new clients should not use it.
   */
  importantOutput: _build_event_stream_File__Output[];
  /**
   * The kind of target (e.g.,  e.g. "cc_library rule", "source file",
   * "generated file") where the completion is reported.
   * Deprecated: use the target_kind field in TargetConfigured instead.
   */
  targetKind: string;
  /**
   * The size of the test, if the target is a test target. Unset otherwise.
   * Deprecated: use the test_size field in TargetConfigured instead.
   */
  testSize: _build_event_stream_TestSize;
  /**
   * The timeout specified for test actions under this configured target.
   */
  testTimeoutSeconds: Long;
  /**
   * Report output artifacts (referenced transitively via output_group) which
   * emit directories instead of singleton files. These directory_output entries
   * will never include a uri.
   */
  directoryOutput: _build_event_stream_File__Output[];
  /**
   * Failure information about the target, only populated if success is false,
   * and sometimes not even then. Equal to one of the ActionExecuted
   * failure_detail fields for one of the root cause ActionExecuted events.
   */
  failureDetail?: _failure_details_FailureDetail__Output;
}
