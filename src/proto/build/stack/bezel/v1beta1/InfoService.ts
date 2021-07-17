// Original file: proto/bzl.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  InfoRequest as _build_stack_bezel_v1beta1_InfoRequest,
  InfoRequest__Output as _build_stack_bezel_v1beta1_InfoRequest__Output,
} from '../../../../build/stack/bezel/v1beta1/InfoRequest';
import type {
  InfoResponse as _build_stack_bezel_v1beta1_InfoResponse,
  InfoResponse__Output as _build_stack_bezel_v1beta1_InfoResponse__Output,
} from '../../../../build/stack/bezel/v1beta1/InfoResponse';

export interface InfoServiceClient extends grpc.Client {
  Get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  get(
    argument: _build_stack_bezel_v1beta1_InfoRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_InfoResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

export interface InfoServiceHandlers extends grpc.UntypedServiceImplementation {
  Get: grpc.handleUnaryCall<
    _build_stack_bezel_v1beta1_InfoRequest__Output,
    _build_stack_bezel_v1beta1_InfoResponse
  >;
}

export interface InfoServiceDefinition extends grpc.ServiceDefinition {
  Get: MethodDefinition<
    _build_stack_bezel_v1beta1_InfoRequest,
    _build_stack_bezel_v1beta1_InfoResponse,
    _build_stack_bezel_v1beta1_InfoRequest__Output,
    _build_stack_bezel_v1beta1_InfoResponse__Output
  >;
}
