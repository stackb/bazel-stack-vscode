// Original file: proto/remote_execution.proto

import type {
  ToolDetails as _build_bazel_remote_execution_v2_ToolDetails,
  ToolDetails__Output as _build_bazel_remote_execution_v2_ToolDetails__Output,
} from '../../../../../build/bazel/remote/execution/v2/ToolDetails';

/**
 * An optional Metadata to attach to any RPC request to tell the server about an
 * external context of the request. The server may use this for logging or other
 * purposes. To use it, the client attaches the header to the call using the
 * canonical proto serialization:
 *
 * * name: `build.bazel.remote.execution.v2.requestmetadata-bin`
 * * contents: the base64 encoded binary `RequestMetadata` message.
 * Note: the gRPC library serializes binary headers encoded in base 64 by
 * default
 * (https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md#requests).
 * Therefore, if the gRPC library is used to pass/retrieve this
 * metadata, the user may ignore the base64 encoding and assume it is simply
 * serialized as a binary message.
 */
export interface RequestMetadata {
  /**
   * The details for the tool invoking the requests.
   */
  toolDetails?: _build_bazel_remote_execution_v2_ToolDetails | null;
  /**
   * An identifier that ties multiple requests to the same action.
   * For example, multiple requests to the CAS, Action Cache, and Execution
   * API are used in order to compile foo.cc.
   */
  actionId?: string;
  /**
   * An identifier that ties multiple actions together to a final result.
   * For example, multiple actions are required to build and run foo_test.
   */
  toolInvocationId?: string;
  /**
   * An identifier to tie multiple tool invocations together. For example,
   * runs of foo_test, bar_test and baz_test on a post-submit of a given patch.
   */
  correlatedInvocationsId?: string;
}

/**
 * An optional Metadata to attach to any RPC request to tell the server about an
 * external context of the request. The server may use this for logging or other
 * purposes. To use it, the client attaches the header to the call using the
 * canonical proto serialization:
 *
 * * name: `build.bazel.remote.execution.v2.requestmetadata-bin`
 * * contents: the base64 encoded binary `RequestMetadata` message.
 * Note: the gRPC library serializes binary headers encoded in base 64 by
 * default
 * (https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md#requests).
 * Therefore, if the gRPC library is used to pass/retrieve this
 * metadata, the user may ignore the base64 encoding and assume it is simply
 * serialized as a binary message.
 */
export interface RequestMetadata__Output {
  /**
   * The details for the tool invoking the requests.
   */
  toolDetails: _build_bazel_remote_execution_v2_ToolDetails__Output | null;
  /**
   * An identifier that ties multiple requests to the same action.
   * For example, multiple requests to the CAS, Action Cache, and Execution
   * API are used in order to compile foo.cc.
   */
  actionId: string;
  /**
   * An identifier that ties multiple actions together to a final result.
   * For example, multiple actions are required to build and run foo_test.
   */
  toolInvocationId: string;
  /**
   * An identifier to tie multiple tool invocations together. For example,
   * runs of foo_test, bar_test and baz_test on a post-submit of a given patch.
   */
  correlatedInvocationsId: string;
}
