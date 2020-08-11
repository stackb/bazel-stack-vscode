// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { ListWorkspacesRequest as _build_stack_bezel_v1beta1_ListWorkspacesRequest, ListWorkspacesRequest__Output as _build_stack_bezel_v1beta1_ListWorkspacesRequest__Output } from '../../../../build/stack/bezel/v1beta1/ListWorkspacesRequest';
import { ListWorkspacesResponse as _build_stack_bezel_v1beta1_ListWorkspacesResponse, ListWorkspacesResponse__Output as _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output } from '../../../../build/stack/bezel/v1beta1/ListWorkspacesResponse';

/**
 * WorkspaceService performs operations on
 */
export interface WorkspaceServiceClient extends grpc.Client {
  List(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * WorkspaceService performs operations on
 */
export interface WorkspaceServiceHandlers {
  List(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_ListWorkspacesRequest, _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_ListWorkspacesResponse__Output>): void;
  
}
