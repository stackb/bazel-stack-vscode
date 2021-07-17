// Original file: proto/publish_build_event.proto

import type {
  OrderedBuildEvent as _google_devtools_build_v1_OrderedBuildEvent,
  OrderedBuildEvent__Output as _google_devtools_build_v1_OrderedBuildEvent__Output,
} from '../../../../google/devtools/build/v1/OrderedBuildEvent';
import type {
  Duration as _google_protobuf_Duration,
  Duration__Output as _google_protobuf_Duration__Output,
} from '../../../../google/protobuf/Duration';

// Original file: proto/publish_build_event.proto

/**
 * The service level of the build request. Backends only uses this value when
 * the BuildEnqueued event is published to determine what level of service
 * this build should receive.
 */
export enum _google_devtools_build_v1_PublishLifecycleEventRequest_ServiceLevel {
  /**
   * Non-interactive builds can tolerate longer event latencies. This is the
   * default ServiceLevel if callers do not specify one.
   */
  NONINTERACTIVE = 0,
  /**
   * The events of an interactive build should be delivered with low latency.
   */
  INTERACTIVE = 1,
}

/**
 * Publishes 'lifecycle events' that update the high-level state of a build:
 * - BuildEnqueued: When a build is scheduled.
 * - InvocationAttemptStarted: When work for a build starts; there can be
 * multiple invocations for a build (e.g. retries).
 * - InvocationAttemptCompleted: When work for a build finishes.
 * - BuildFinished: When a build is finished.
 */
export interface PublishLifecycleEventRequest {
  /**
   * The interactivity of this build.
   */
  serviceLevel?:
    | _google_devtools_build_v1_PublishLifecycleEventRequest_ServiceLevel
    | keyof typeof _google_devtools_build_v1_PublishLifecycleEventRequest_ServiceLevel;
  /**
   * The lifecycle build event. If this is a build tool event, the RPC will fail
   * with INVALID_REQUEST.
   */
  buildEvent?: _google_devtools_build_v1_OrderedBuildEvent | null;
  /**
   * If the next event for this build or invocation (depending on the event
   * type) hasn't been published after this duration from when {build_event}
   * is written to BES, consider this stream expired. If this field is not set,
   * BES backend will use its own default value.
   */
  streamTimeout?: _google_protobuf_Duration | null;
  /**
   * Additional information about a build request. These are define by the event
   * publishers, and the Build Event Service does not validate or interpret
   * them. They are used while notifying internal systems of new builds and
   * invocations if the OrderedBuildEvent.event type is
   * BuildEnqueued/InvocationAttemptStarted.
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
 * Publishes 'lifecycle events' that update the high-level state of a build:
 * - BuildEnqueued: When a build is scheduled.
 * - InvocationAttemptStarted: When work for a build starts; there can be
 * multiple invocations for a build (e.g. retries).
 * - InvocationAttemptCompleted: When work for a build finishes.
 * - BuildFinished: When a build is finished.
 */
export interface PublishLifecycleEventRequest__Output {
  /**
   * The interactivity of this build.
   */
  serviceLevel: _google_devtools_build_v1_PublishLifecycleEventRequest_ServiceLevel;
  /**
   * The lifecycle build event. If this is a build tool event, the RPC will fail
   * with INVALID_REQUEST.
   */
  buildEvent: _google_devtools_build_v1_OrderedBuildEvent__Output | null;
  /**
   * If the next event for this build or invocation (depending on the event
   * type) hasn't been published after this duration from when {build_event}
   * is written to BES, consider this stream expired. If this field is not set,
   * BES backend will use its own default value.
   */
  streamTimeout: _google_protobuf_Duration__Output | null;
  /**
   * Additional information about a build request. These are define by the event
   * publishers, and the Build Event Service does not validate or interpret
   * them. They are used while notifying internal systems of new builds and
   * invocations if the OrderedBuildEvent.event type is
   * BuildEnqueued/InvocationAttemptStarted.
   */
  notificationKeywords: string[];
  /**
   * The project this build is associated with.
   * This should match the project used for the initial call to
   * PublishLifecycleEvent (containing a BuildEnqueued message).
   */
  projectId: string;
}
