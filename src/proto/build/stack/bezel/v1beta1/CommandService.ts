// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { CancelRequest as _build_stack_bezel_v1beta1_CancelRequest, CancelRequest__Output as _build_stack_bezel_v1beta1_CancelRequest__Output } from '../../../../build/stack/bezel/v1beta1/CancelRequest';
import { CancelResponse as _build_stack_bezel_v1beta1_CancelResponse, CancelResponse__Output as _build_stack_bezel_v1beta1_CancelResponse__Output } from '../../../../build/stack/bezel/v1beta1/CancelResponse';
import { RunRequest as _build_stack_bezel_v1beta1_RunRequest, RunRequest__Output as _build_stack_bezel_v1beta1_RunRequest__Output } from '../../../../build/stack/bezel/v1beta1/RunRequest';
import { RunResponse as _build_stack_bezel_v1beta1_RunResponse, RunResponse__Output as _build_stack_bezel_v1beta1_RunResponse__Output } from '../../../../build/stack/bezel/v1beta1/RunResponse';

export interface CommandServiceClient extends grpc.Client {
  Cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  Cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  Cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  Cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  cancel(argument: _build_stack_bezel_v1beta1_CancelRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_CancelResponse__Output) => void): grpc.ClientUnaryCall;
  
  Run(argument: _build_stack_bezel_v1beta1_RunRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_bezel_v1beta1_RunResponse__Output>;
  Run(argument: _build_stack_bezel_v1beta1_RunRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_bezel_v1beta1_RunResponse__Output>;
  run(argument: _build_stack_bezel_v1beta1_RunRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_bezel_v1beta1_RunResponse__Output>;
  run(argument: _build_stack_bezel_v1beta1_RunRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_bezel_v1beta1_RunResponse__Output>;
  
}

export interface CommandServiceHandlers {
  Cancel(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_CancelRequest, _build_stack_bezel_v1beta1_CancelResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_CancelResponse__Output>): void;
  
  Run(call: grpc.ServerWritableStream<_build_stack_bezel_v1beta1_RunRequest, _build_stack_bezel_v1beta1_RunResponse__Output>): void;
  
}
