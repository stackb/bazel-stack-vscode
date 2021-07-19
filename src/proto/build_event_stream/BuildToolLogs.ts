// Original file: proto/build_event_stream.proto

import type {
  File as _build_event_stream_File,
  File__Output as _build_event_stream_File__Output,
} from '../build_event_stream/File';

/**
 * Event providing additional statistics/logs after completion of the build.
 */
export interface BuildToolLogs {
  /**
   * Event providing additional statistics/logs after completion of the build.
   */
  log?: _build_event_stream_File[];
}

/**
 * Event providing additional statistics/logs after completion of the build.
 */
export interface BuildToolLogs__Output {
  /**
   * Event providing additional statistics/logs after completion of the build.
   */
  log: _build_event_stream_File__Output[];
}
