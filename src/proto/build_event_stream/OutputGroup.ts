// Original file: proto/build_event_stream.proto

import type {
  _build_event_stream_BuildEventId_NamedSetOfFilesId,
  _build_event_stream_BuildEventId_NamedSetOfFilesId__Output,
} from '../build_event_stream/BuildEventId';

/**
 * Collection of all output files belonging to that output group.
 */
export interface OutputGroup {
  /**
   * Name of the output group
   */
  name?: string;
  /**
   * List of file sets that belong to this output group as well.
   */
  fileSets?: _build_event_stream_BuildEventId_NamedSetOfFilesId[];
}

/**
 * Collection of all output files belonging to that output group.
 */
export interface OutputGroup__Output {
  /**
   * Name of the output group
   */
  name: string;
  /**
   * List of file sets that belong to this output group as well.
   */
  fileSets: _build_event_stream_BuildEventId_NamedSetOfFilesId__Output[];
}
