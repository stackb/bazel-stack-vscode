// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { ExternalListWorkspacesRequest as _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, ExternalListWorkspacesRequest__Output as _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest__Output } from '../../../../build/stack/bezel/v1beta1/ExternalListWorkspacesRequest';
import { ExternalListWorkspacesResponse as _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse, ExternalListWorkspacesResponse__Output as _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output } from '../../../../build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';

export interface ExternalWorkspaceServiceClient extends grpc.Client {
  ListExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  ListExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  ListExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  ListExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  listExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  listExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  listExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  listExternal(argument: _build_stack_bezel_v1beta1_ExternalListWorkspacesRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface ExternalWorkspaceServiceHandlers extends grpc.UntypedServiceImplementation {
  ListExternal(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_ExternalListWorkspacesRequest__Output, _build_stack_bezel_v1beta1_ExternalListWorkspacesResponse>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_ExternalListWorkspacesResponse>): void;
  
}
