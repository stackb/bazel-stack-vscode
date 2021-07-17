// Original file: proto/publish_build_event.proto

import type {
  StreamId as _google_devtools_build_v1_StreamId,
  StreamId__Output as _google_devtools_build_v1_StreamId__Output,
} from '../../../../google/devtools/build/v1/StreamId';
import type { Long } from '@grpc/proto-loader';

/**
 * States which event has been committed. Any failure to commit will cause
 * RPC errors, hence not recorded by this proto.
 */
export interface PublishBuildToolEventStreamResponse {
  /**
   * The stream that contains this event.
   */
  streamId?: _google_devtools_build_v1_StreamId | null;
  /**
   * The sequence number of this event that has been committed.
   */
  sequenceNumber?: number | string | Long;
}

/**
 * States which event has been committed. Any failure to commit will cause
 * RPC errors, hence not recorded by this proto.
 */
export interface PublishBuildToolEventStreamResponse__Output {
  /**
   * The stream that contains this event.
   */
  streamId: _google_devtools_build_v1_StreamId__Output | null;
  /**
   * The sequence number of this event that has been committed.
   */
  sequenceNumber: Long;
}
