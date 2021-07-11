// Original file: proto/remote_execution.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetCapabilitiesRequest as _build_bazel_remote_execution_v2_GetCapabilitiesRequest, GetCapabilitiesRequest__Output as _build_bazel_remote_execution_v2_GetCapabilitiesRequest__Output } from '../../../../../build/bazel/remote/execution/v2/GetCapabilitiesRequest';
import type { ServerCapabilities as _build_bazel_remote_execution_v2_ServerCapabilities, ServerCapabilities__Output as _build_bazel_remote_execution_v2_ServerCapabilities__Output } from '../../../../../build/bazel/remote/execution/v2/ServerCapabilities';

/**
 * The Capabilities service may be used by remote execution clients to query
 * various server properties, in order to self-configure or return meaningful
 * error messages.
 * 
 * The query may include a particular `instance_name`, in which case the values
 * returned will pertain to that instance.
 */
export interface CapabilitiesClient extends grpc.Client {
  /**
   * GetCapabilities returns the server capabilities configuration of the
   * remote endpoint.
   * Only the capabilities of the services supported by the endpoint will
   * be returned:
   * * Execution + CAS + Action Cache endpoints should return both
   * CacheCapabilities and ExecutionCapabilities.
   * * Execution only endpoints should return ExecutionCapabilities.
   * * CAS + Action Cache only endpoints should return CacheCapabilities.
   */
  GetCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  GetCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  GetCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  GetCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  /**
   * GetCapabilities returns the server capabilities configuration of the
   * remote endpoint.
   * Only the capabilities of the services supported by the endpoint will
   * be returned:
   * * Execution + CAS + Action Cache endpoints should return both
   * CacheCapabilities and ExecutionCapabilities.
   * * Execution only endpoints should return ExecutionCapabilities.
   * * CAS + Action Cache only endpoints should return CacheCapabilities.
   */
  getCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  getCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  getCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  getCapabilities(argument: _build_bazel_remote_execution_v2_GetCapabilitiesRequest, callback: (error?: grpc.ServiceError, result?: _build_bazel_remote_execution_v2_ServerCapabilities__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * The Capabilities service may be used by remote execution clients to query
 * various server properties, in order to self-configure or return meaningful
 * error messages.
 * 
 * The query may include a particular `instance_name`, in which case the values
 * returned will pertain to that instance.
 */
export interface CapabilitiesHandlers extends grpc.UntypedServiceImplementation {
  /**
   * GetCapabilities returns the server capabilities configuration of the
   * remote endpoint.
   * Only the capabilities of the services supported by the endpoint will
   * be returned:
   * * Execution + CAS + Action Cache endpoints should return both
   * CacheCapabilities and ExecutionCapabilities.
   * * Execution only endpoints should return ExecutionCapabilities.
   * * CAS + Action Cache only endpoints should return CacheCapabilities.
   */
  GetCapabilities: grpc.handleUnaryCall<_build_bazel_remote_execution_v2_GetCapabilitiesRequest__Output, _build_bazel_remote_execution_v2_ServerCapabilities>;
  
}

export interface CapabilitiesDefinition extends grpc.ServiceDefinition {
  GetCapabilities: MethodDefinition<_build_bazel_remote_execution_v2_GetCapabilitiesRequest, _build_bazel_remote_execution_v2_ServerCapabilities, _build_bazel_remote_execution_v2_GetCapabilitiesRequest__Output, _build_bazel_remote_execution_v2_ServerCapabilities__Output>
}
