// Original file: proto/build_event_stream.proto

import { File as _build_event_stream_File, File__Output as _build_event_stream_File__Output } from '../build_event_stream/File';
import { _build_event_stream_BuildEventId_NamedSetOfFilesId, _build_event_stream_BuildEventId_NamedSetOfFilesId__Output } from '../build_event_stream/BuildEventId';

/**
 * Payload of a message to describe a set of files, usually build artifacts, to
 * be referred to later by their name. In this way, files that occur identically
 * as outputs of several targets have to be named only once.
 */
export interface NamedSetOfFiles {
  /**
   * Files that belong to this named set of files.
   */
  'files'?: (_build_event_stream_File)[];
  /**
   * Other named sets whose members also belong to this set.
   */
  'fileSets'?: (_build_event_stream_BuildEventId_NamedSetOfFilesId)[];
}

/**
 * Payload of a message to describe a set of files, usually build artifacts, to
 * be referred to later by their name. In this way, files that occur identically
 * as outputs of several targets have to be named only once.
 */
export interface NamedSetOfFiles__Output {
  /**
   * Files that belong to this named set of files.
   */
  'files': (_build_event_stream_File__Output)[];
  /**
   * Other named sets whose members also belong to this set.
   */
  'fileSets': (_build_event_stream_BuildEventId_NamedSetOfFilesId__Output)[];
}
