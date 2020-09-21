// Original file: proto/build_event_stream.proto

import { File as _build_event_stream_File, File__Output as _build_event_stream_File__Output } from '../build_event_stream/File';
import { TestStatus as _build_event_stream_TestStatus } from '../build_event_stream/TestStatus';
import { Long } from '@grpc/proto-loader';

/**
 * Payload of the event summarizing a test.
 */
export interface TestSummary {
  /**
   * Total number of runs
   */
  'totalRunCount'?: (number);
  /**
   * Path to logs of passed runs.
   */
  'passed'?: (_build_event_stream_File)[];
  /**
   * Path to logs of failed runs;
   */
  'failed'?: (_build_event_stream_File)[];
  /**
   * Wrapper around BlazeTestStatus to support importing that enum to proto3.
   * Overall status of test, accumulated over all runs, shards, and attempts.
   */
  'overallStatus'?: (_build_event_stream_TestStatus | keyof typeof _build_event_stream_TestStatus);
  /**
   * Total number of cached test actions
   */
  'totalNumCached'?: (number);
  /**
   * When the test first started running.
   */
  'firstStartTimeMillis'?: (number | string | Long);
  /**
   * When the last test action completed.
   */
  'lastStopTimeMillis'?: (number | string | Long);
  /**
   * The total runtime of the test.
   */
  'totalRunDurationMillis'?: (number | string | Long);
}

/**
 * Payload of the event summarizing a test.
 */
export interface TestSummary__Output {
  /**
   * Total number of runs
   */
  'totalRunCount': (number);
  /**
   * Path to logs of passed runs.
   */
  'passed': (_build_event_stream_File__Output)[];
  /**
   * Path to logs of failed runs;
   */
  'failed': (_build_event_stream_File__Output)[];
  /**
   * Wrapper around BlazeTestStatus to support importing that enum to proto3.
   * Overall status of test, accumulated over all runs, shards, and attempts.
   */
  'overallStatus': (_build_event_stream_TestStatus);
  /**
   * Total number of cached test actions
   */
  'totalNumCached': (number);
  /**
   * When the test first started running.
   */
  'firstStartTimeMillis': (Long);
  /**
   * When the last test action completed.
   */
  'lastStopTimeMillis': (Long);
  /**
   * The total runtime of the test.
   */
  'totalRunDurationMillis': (Long);
}
