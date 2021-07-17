// Original file: proto/nucleate.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  ListPlansRequest as _build_stack_nucleate_v1beta_ListPlansRequest,
  ListPlansRequest__Output as _build_stack_nucleate_v1beta_ListPlansRequest__Output,
} from '../../../../build/stack/nucleate/v1beta/ListPlansRequest';
import type {
  ListPlansResponse as _build_stack_nucleate_v1beta_ListPlansResponse,
  ListPlansResponse__Output as _build_stack_nucleate_v1beta_ListPlansResponse__Output,
} from '../../../../build/stack/nucleate/v1beta/ListPlansResponse';

export interface PlansClient extends grpc.Client {
  List(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  List(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  list(
    argument: _build_stack_nucleate_v1beta_ListPlansRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_nucleate_v1beta_ListPlansResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

export interface PlansHandlers extends grpc.UntypedServiceImplementation {
  List: grpc.handleUnaryCall<
    _build_stack_nucleate_v1beta_ListPlansRequest__Output,
    _build_stack_nucleate_v1beta_ListPlansResponse
  >;
}

export interface PlansDefinition extends grpc.ServiceDefinition {
  List: MethodDefinition<
    _build_stack_nucleate_v1beta_ListPlansRequest,
    _build_stack_nucleate_v1beta_ListPlansResponse,
    _build_stack_nucleate_v1beta_ListPlansRequest__Output,
    _build_stack_nucleate_v1beta_ListPlansResponse__Output
  >;
}
