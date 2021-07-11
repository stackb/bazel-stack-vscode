// Original file: proto/bzl.proto

import type * as grpc from '@grpc/grpc-js'
import type { MethodDefinition } from '@grpc/proto-loader'
import type { GetMetadataRequest as _build_stack_bezel_v1beta1_GetMetadataRequest, GetMetadataRequest__Output as _build_stack_bezel_v1beta1_GetMetadataRequest__Output } from '../../../../build/stack/bezel/v1beta1/GetMetadataRequest';
import type { Metadata as _build_stack_bezel_v1beta1_Metadata, Metadata__Output as _build_stack_bezel_v1beta1_Metadata__Output } from '../../../../build/stack/bezel/v1beta1/Metadata';
import type { ShutdownRequest as _build_stack_bezel_v1beta1_ShutdownRequest, ShutdownRequest__Output as _build_stack_bezel_v1beta1_ShutdownRequest__Output } from '../../../../build/stack/bezel/v1beta1/ShutdownRequest';
import type { ShutdownResponse as _build_stack_bezel_v1beta1_ShutdownResponse, ShutdownResponse__Output as _build_stack_bezel_v1beta1_ShutdownResponse__Output } from '../../../../build/stack/bezel/v1beta1/ShutdownResponse';

export interface ApplicationServiceClient extends grpc.Client {
  GetMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  GetMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  GetMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  GetMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  getMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  getMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  getMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  getMetadata(argument: _build_stack_bezel_v1beta1_GetMetadataRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_Metadata__Output) => void): grpc.ClientUnaryCall;
  
  Shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  Shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  Shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  Shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  shutdown(argument: _build_stack_bezel_v1beta1_ShutdownRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ShutdownResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface ApplicationServiceHandlers extends grpc.UntypedServiceImplementation {
  GetMetadata: grpc.handleUnaryCall<_build_stack_bezel_v1beta1_GetMetadataRequest__Output, _build_stack_bezel_v1beta1_Metadata>;
  
  Shutdown: grpc.handleUnaryCall<_build_stack_bezel_v1beta1_ShutdownRequest__Output, _build_stack_bezel_v1beta1_ShutdownResponse>;
  
}

export interface ApplicationServiceDefinition extends grpc.ServiceDefinition {
  GetMetadata: MethodDefinition<_build_stack_bezel_v1beta1_GetMetadataRequest, _build_stack_bezel_v1beta1_Metadata, _build_stack_bezel_v1beta1_GetMetadataRequest__Output, _build_stack_bezel_v1beta1_Metadata__Output>
  Shutdown: MethodDefinition<_build_stack_bezel_v1beta1_ShutdownRequest, _build_stack_bezel_v1beta1_ShutdownResponse, _build_stack_bezel_v1beta1_ShutdownRequest__Output, _build_stack_bezel_v1beta1_ShutdownResponse__Output>
}
