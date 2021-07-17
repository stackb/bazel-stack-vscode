// Original file: proto/remote_execution.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  ActionResult as _build_bazel_remote_execution_v2_ActionResult,
  ActionResult__Output as _build_bazel_remote_execution_v2_ActionResult__Output,
} from '../../../../../build/bazel/remote/execution/v2/ActionResult';
import type {
  GetActionResultRequest as _build_bazel_remote_execution_v2_GetActionResultRequest,
  GetActionResultRequest__Output as _build_bazel_remote_execution_v2_GetActionResultRequest__Output,
} from '../../../../../build/bazel/remote/execution/v2/GetActionResultRequest';
import type {
  UpdateActionResultRequest as _build_bazel_remote_execution_v2_UpdateActionResultRequest,
  UpdateActionResultRequest__Output as _build_bazel_remote_execution_v2_UpdateActionResultRequest__Output,
} from '../../../../../build/bazel/remote/execution/v2/UpdateActionResultRequest';

/**
 * The action cache API is used to query whether a given action has already been
 * performed and, if so, retrieve its result. Unlike the
 * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage],
 * which addresses blobs by their own content, the action cache addresses the
 * [ActionResult][build.bazel.remote.execution.v2.ActionResult] by a
 * digest of the encoded [Action][build.bazel.remote.execution.v2.Action]
 * which produced them.
 *
 * The lifetime of entries in the action cache is implementation-specific, but
 * the server SHOULD assume that more recently used entries are more likely to
 * be used again.
 *
 * As with other services in the Remote Execution API, any call may return an
 * error with a [RetryInfo][google.rpc.RetryInfo] error detail providing
 * information about when the client should retry the request; clients SHOULD
 * respect the information provided.
 */
export interface ActionCacheClient extends grpc.Client {
  /**
   * Retrieve a cached execution result.
   *
   * Implementations SHOULD ensure that any blobs referenced from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage]
   * are available at the time of returning the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] and will be
   * for some period of time afterwards. The TTLs of the referenced blobs SHOULD
   * be increased if necessary and applicable.
   *
   * Errors:
   *
   * * `NOT_FOUND`: The requested `ActionResult` is not in the cache.
   */
  GetActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  GetActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  GetActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  GetActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  /**
   * Retrieve a cached execution result.
   *
   * Implementations SHOULD ensure that any blobs referenced from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage]
   * are available at the time of returning the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] and will be
   * for some period of time afterwards. The TTLs of the referenced blobs SHOULD
   * be increased if necessary and applicable.
   *
   * Errors:
   *
   * * `NOT_FOUND`: The requested `ActionResult` is not in the cache.
   */
  getActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  getActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  getActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  getActionResult(
    argument: _build_bazel_remote_execution_v2_GetActionResultRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;

  /**
   * Upload a new execution result.
   *
   * In order to allow the server to perform access control based on the type of
   * action, and to assist with client debugging, the client MUST first upload
   * the [Action][build.bazel.remote.execution.v2.Execution] that produced the
   * result, along with its
   * [Command][build.bazel.remote.execution.v2.Command], into the
   * `ContentAddressableStorage`.
   *
   * Errors:
   *
   * * `INVALID_ARGUMENT`: One or more arguments are invalid.
   * * `FAILED_PRECONDITION`: One or more errors occurred in updating the
   * action result, such as a missing command or action.
   * * `RESOURCE_EXHAUSTED`: There is insufficient storage space to add the
   * entry to the cache.
   */
  UpdateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  UpdateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  UpdateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  UpdateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  /**
   * Upload a new execution result.
   *
   * In order to allow the server to perform access control based on the type of
   * action, and to assist with client debugging, the client MUST first upload
   * the [Action][build.bazel.remote.execution.v2.Execution] that produced the
   * result, along with its
   * [Command][build.bazel.remote.execution.v2.Command], into the
   * `ContentAddressableStorage`.
   *
   * Errors:
   *
   * * `INVALID_ARGUMENT`: One or more arguments are invalid.
   * * `FAILED_PRECONDITION`: One or more errors occurred in updating the
   * action result, such as a missing command or action.
   * * `RESOURCE_EXHAUSTED`: There is insufficient storage space to add the
   * entry to the cache.
   */
  updateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  updateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  updateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
  updateActionResult(
    argument: _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_bazel_remote_execution_v2_ActionResult__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

/**
 * The action cache API is used to query whether a given action has already been
 * performed and, if so, retrieve its result. Unlike the
 * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage],
 * which addresses blobs by their own content, the action cache addresses the
 * [ActionResult][build.bazel.remote.execution.v2.ActionResult] by a
 * digest of the encoded [Action][build.bazel.remote.execution.v2.Action]
 * which produced them.
 *
 * The lifetime of entries in the action cache is implementation-specific, but
 * the server SHOULD assume that more recently used entries are more likely to
 * be used again.
 *
 * As with other services in the Remote Execution API, any call may return an
 * error with a [RetryInfo][google.rpc.RetryInfo] error detail providing
 * information about when the client should retry the request; clients SHOULD
 * respect the information provided.
 */
export interface ActionCacheHandlers extends grpc.UntypedServiceImplementation {
  /**
   * Retrieve a cached execution result.
   *
   * Implementations SHOULD ensure that any blobs referenced from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage]
   * are available at the time of returning the
   * [ActionResult][build.bazel.remote.execution.v2.ActionResult] and will be
   * for some period of time afterwards. The TTLs of the referenced blobs SHOULD
   * be increased if necessary and applicable.
   *
   * Errors:
   *
   * * `NOT_FOUND`: The requested `ActionResult` is not in the cache.
   */
  GetActionResult: grpc.handleUnaryCall<
    _build_bazel_remote_execution_v2_GetActionResultRequest__Output,
    _build_bazel_remote_execution_v2_ActionResult
  >;

  /**
   * Upload a new execution result.
   *
   * In order to allow the server to perform access control based on the type of
   * action, and to assist with client debugging, the client MUST first upload
   * the [Action][build.bazel.remote.execution.v2.Execution] that produced the
   * result, along with its
   * [Command][build.bazel.remote.execution.v2.Command], into the
   * `ContentAddressableStorage`.
   *
   * Errors:
   *
   * * `INVALID_ARGUMENT`: One or more arguments are invalid.
   * * `FAILED_PRECONDITION`: One or more errors occurred in updating the
   * action result, such as a missing command or action.
   * * `RESOURCE_EXHAUSTED`: There is insufficient storage space to add the
   * entry to the cache.
   */
  UpdateActionResult: grpc.handleUnaryCall<
    _build_bazel_remote_execution_v2_UpdateActionResultRequest__Output,
    _build_bazel_remote_execution_v2_ActionResult
  >;
}

export interface ActionCacheDefinition extends grpc.ServiceDefinition {
  GetActionResult: MethodDefinition<
    _build_bazel_remote_execution_v2_GetActionResultRequest,
    _build_bazel_remote_execution_v2_ActionResult,
    _build_bazel_remote_execution_v2_GetActionResultRequest__Output,
    _build_bazel_remote_execution_v2_ActionResult__Output
  >;
  UpdateActionResult: MethodDefinition<
    _build_bazel_remote_execution_v2_UpdateActionResultRequest,
    _build_bazel_remote_execution_v2_ActionResult,
    _build_bazel_remote_execution_v2_UpdateActionResultRequest__Output,
    _build_bazel_remote_execution_v2_ActionResult__Output
  >;
}
