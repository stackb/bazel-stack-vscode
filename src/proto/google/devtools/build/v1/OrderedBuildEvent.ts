// Original file: proto/publish_build_event.proto

import type { StreamId as _google_devtools_build_v1_StreamId, StreamId__Output as _google_devtools_build_v1_StreamId__Output } from '../../../../google/devtools/build/v1/StreamId';
import type { BuildEvent as _google_devtools_build_v1_BuildEvent, BuildEvent__Output as _google_devtools_build_v1_BuildEvent__Output } from '../../../../google/devtools/build/v1/BuildEvent';
import type { Long } from '@grpc/proto-loader';

/**
 * Build event with contextual information about the stream it belongs to and
 * its position in that stream.
 */
export interface OrderedBuildEvent {
  /**
   * Which build event stream this event belongs to.
   */
  'streamId'?: (_google_devtools_build_v1_StreamId);
  /**
   * The position of this event in the stream. The sequence numbers for a build
   * event stream should be a sequence of consecutive natural numbers starting
   * from one. (1, 2, 3, ...)
   */
  'sequenceNumber'?: (number | string | Long);
  /**
   * The actual event.
   */
  'event'?: (_google_devtools_build_v1_BuildEvent);
}

/**
 * Build event with contextual information about the stream it belongs to and
 * its position in that stream.
 */
export interface OrderedBuildEvent__Output {
  /**
   * Which build event stream this event belongs to.
   */
  'streamId'?: (_google_devtools_build_v1_StreamId__Output);
  /**
   * The position of this event in the stream. The sequence numbers for a build
   * event stream should be a sequence of consecutive natural numbers starting
   * from one. (1, 2, 3, ...)
   */
  'sequenceNumber': (Long);
  /**
   * The actual event.
   */
  'event'?: (_google_devtools_build_v1_BuildEvent__Output);
}
