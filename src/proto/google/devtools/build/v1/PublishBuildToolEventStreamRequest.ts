// Original file: proto/publish_build_event.proto

import type {
  OrderedBuildEvent as _google_devtools_build_v1_OrderedBuildEvent,
  OrderedBuildEvent__Output as _google_devtools_build_v1_OrderedBuildEvent__Output,
} from '../../../../google/devtools/build/v1/OrderedBuildEvent';

/**
 * Streaming request message for PublishBuildToolEventStream.
 */
export interface PublishBuildToolEventStreamRequest {
  /**
   * The build event with position info.
   * New publishing clients should use this field rather than the 3 above.
   */
  orderedBuildEvent?: _google_devtools_build_v1_OrderedBuildEvent | null;
  /**
   * The keywords to be attached to the notification which notifies the start
   * of a new build event stream. BES only reads this field when sequence_number
   * or ordered_build_event.sequence_number is 1 in this message. If this field
   * is empty, BES will not publish notification messages for this stream.
   */
  notificationKeywords?: string[];
  /**
   * The project this build is associated with.
   * This should match the project used for the initial call to
   * PublishLifecycleEvent (containing a BuildEnqueued message).
   */
  projectId?: string;
}

/**
 * Streaming request message for PublishBuildToolEventStream.
 */
export interface PublishBuildToolEventStreamRequest__Output {
  /**
   * The build event with position info.
   * New publishing clients should use this field rather than the 3 above.
   */
  orderedBuildEvent: _google_devtools_build_v1_OrderedBuildEvent__Output | null;
  /**
   * The keywords to be attached to the notification which notifies the start
   * of a new build event stream. BES only reads this field when sequence_number
   * or ordered_build_event.sequence_number is 1 in this message. If this field
   * is empty, BES will not publish notification messages for this stream.
   */
  notificationKeywords: string[];
  /**
   * The project this build is associated with.
   * This should match the project used for the initial call to
   * PublishLifecycleEvent (containing a BuildEnqueued message).
   */
  projectId: string;
}
