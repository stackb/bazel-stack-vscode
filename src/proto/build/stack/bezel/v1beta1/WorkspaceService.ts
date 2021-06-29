// Original file: proto/bzl.proto

import type * as grpc from '@grpc/grpc-js';
import type {
  GetWorkspaceRequest as _build_stack_bezel_v1beta1_GetWorkspaceRequest,
  GetWorkspaceRequest__Output as _build_stack_bezel_v1beta1_GetWorkspaceRequest__Output,
} from '../../../../build/stack/bezel/v1beta1/GetWorkspaceRequest';
import type {
  ListWorkspacesRequest as _build_stack_bezel_v1beta1_ListWorkspacesRequest,
  ListWorkspacesRequest__Output as _build_stack_bezel_v1beta1_ListWorkspacesRequest__Output,
} from '../../../../build/stack/bezel/v1beta1/ListWorkspacesRequest';
import type {
  ListWorkspacesResponse as _build_stack_bezel_v1beta1_ListWorkspacesResponse,
  ListWorkspacesResponse__Output as _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output,
} from '../../../../build/stack/bezel/v1beta1/ListWorkspacesResponse';
import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';

export interface WorkspaceServiceClient extends grpc.Client {
  Get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_GetWorkspaceRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_Workspace__Output
    ) => void
  ): grpc.ClientUnaryCall;

  List(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_bezel_v1beta1_ListWorkspacesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListWorkspacesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

export interface WorkspaceServiceHandlers extends grpc.UntypedServiceImplementation {
  Get: grpc.handleUnaryCall<
    _build_stack_bezel_v1beta1_GetWorkspaceRequest__Output,
    _build_stack_bezel_v1beta1_Workspace
  >;

  List: grpc.handleUnaryCall<
    _build_stack_bezel_v1beta1_ListWorkspacesRequest__Output,
    _build_stack_bezel_v1beta1_ListWorkspacesResponse
  >;
}
