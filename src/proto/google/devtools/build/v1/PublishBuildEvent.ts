// Original file: proto/publish_build_event.proto

import * as grpc from '@grpc/grpc-js'
import { Empty as _google_protobuf_Empty, Empty__Output as _google_protobuf_Empty__Output } from '../../../../google/protobuf/Empty';
import { PublishBuildToolEventStreamRequest as _google_devtools_build_v1_PublishBuildToolEventStreamRequest, PublishBuildToolEventStreamRequest__Output as _google_devtools_build_v1_PublishBuildToolEventStreamRequest__Output } from '../../../../google/devtools/build/v1/PublishBuildToolEventStreamRequest';
import { PublishBuildToolEventStreamResponse as _google_devtools_build_v1_PublishBuildToolEventStreamResponse, PublishBuildToolEventStreamResponse__Output as _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output } from '../../../../google/devtools/build/v1/PublishBuildToolEventStreamResponse';
import { PublishLifecycleEventRequest as _google_devtools_build_v1_PublishLifecycleEventRequest, PublishLifecycleEventRequest__Output as _google_devtools_build_v1_PublishLifecycleEventRequest__Output } from '../../../../google/devtools/build/v1/PublishLifecycleEventRequest';

/**
 * A service for publishing BuildEvents. BuildEvents are generated by Build
 * Systems to record actions taken during a Build. Events occur in streams,
 * are identified by a StreamId, and ordered by sequence number in a stream.
 * 
 * A Build may contain several streams of BuildEvents, depending on the systems
 * that are involved in the Build. Some BuildEvents are used to declare the
 * beginning and end of major portions of a Build; these are called
 * LifecycleEvents, and are used (for example) to indicate the beginning or end
 * of a Build, and the beginning or end of an Invocation attempt (there can be
 * more than 1 Invocation in a Build if, for example, a failure occurs somewhere
 * and it needs to be retried).
 * 
 * Other, build-tool events represent actions taken by the Build tool, such as
 * target objects produced via compilation, tests run, et cetera. There could be
 * more than one build tool stream for an invocation attempt of a build.
 */
export interface PublishBuildEventClient extends grpc.Client {
  /**
   * Publish build tool events belonging to the same stream to a backend job
   * using bidirectional streaming.
   */
  PublishBuildToolEventStream(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_google_devtools_build_v1_PublishBuildToolEventStreamRequest, _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output>;
  PublishBuildToolEventStream(options?: grpc.CallOptions): grpc.ClientDuplexStream<_google_devtools_build_v1_PublishBuildToolEventStreamRequest, _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output>;
  /**
   * Publish build tool events belonging to the same stream to a backend job
   * using bidirectional streaming.
   */
  publishBuildToolEventStream(metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientDuplexStream<_google_devtools_build_v1_PublishBuildToolEventStreamRequest, _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output>;
  publishBuildToolEventStream(options?: grpc.CallOptions): grpc.ClientDuplexStream<_google_devtools_build_v1_PublishBuildToolEventStreamRequest, _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output>;
  
  /**
   * Publish a build event stating the new state of a build (typically from the
   * build queue). The BuildEnqueued event must be publishd before all other
   * events for the same build ID.
   * 
   * The backend will persist the event and deliver it to registered frontend
   * jobs immediately without batching.
   * 
   * The commit status of the request is reported by the RPC's util_status()
   * function. The error code is the canoncial error code defined in
   * //util/task/codes.proto.
   */
  PublishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  PublishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  PublishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  PublishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  /**
   * Publish a build event stating the new state of a build (typically from the
   * build queue). The BuildEnqueued event must be publishd before all other
   * events for the same build ID.
   * 
   * The backend will persist the event and deliver it to registered frontend
   * jobs immediately without batching.
   * 
   * The commit status of the request is reported by the RPC's util_status()
   * function. The error code is the canoncial error code defined in
   * //util/task/codes.proto.
   */
  publishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  publishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  publishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  publishLifecycleEvent(argument: _google_devtools_build_v1_PublishLifecycleEventRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _google_protobuf_Empty__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * A service for publishing BuildEvents. BuildEvents are generated by Build
 * Systems to record actions taken during a Build. Events occur in streams,
 * are identified by a StreamId, and ordered by sequence number in a stream.
 * 
 * A Build may contain several streams of BuildEvents, depending on the systems
 * that are involved in the Build. Some BuildEvents are used to declare the
 * beginning and end of major portions of a Build; these are called
 * LifecycleEvents, and are used (for example) to indicate the beginning or end
 * of a Build, and the beginning or end of an Invocation attempt (there can be
 * more than 1 Invocation in a Build if, for example, a failure occurs somewhere
 * and it needs to be retried).
 * 
 * Other, build-tool events represent actions taken by the Build tool, such as
 * target objects produced via compilation, tests run, et cetera. There could be
 * more than one build tool stream for an invocation attempt of a build.
 */
export interface PublishBuildEventHandlers {
  /**
   * Publish build tool events belonging to the same stream to a backend job
   * using bidirectional streaming.
   */
  PublishBuildToolEventStream(call: grpc.ServerDuplexStream<_google_devtools_build_v1_PublishBuildToolEventStreamRequest, _google_devtools_build_v1_PublishBuildToolEventStreamResponse__Output>): void;
  
  /**
   * Publish a build event stating the new state of a build (typically from the
   * build queue). The BuildEnqueued event must be publishd before all other
   * events for the same build ID.
   * 
   * The backend will persist the event and deliver it to registered frontend
   * jobs immediately without batching.
   * 
   * The commit status of the request is reported by the RPC's util_status()
   * function. The error code is the canoncial error code defined in
   * //util/task/codes.proto.
   */
  PublishLifecycleEvent(call: grpc.ServerUnaryCall<_google_devtools_build_v1_PublishLifecycleEventRequest, _google_protobuf_Empty__Output>, callback: grpc.sendUnaryData<_google_protobuf_Empty__Output>): void;
  
}
