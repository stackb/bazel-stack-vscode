// Original file: proto/bzl.proto

import type * as grpc from '@grpc/grpc-js'
import type { DeleteCommandHistoryRequest as _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, DeleteCommandHistoryRequest__Output as _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest__Output } from '../../../../build/stack/bezel/v1beta1/DeleteCommandHistoryRequest';
import type { DeleteCommandHistoryResponse as _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse, DeleteCommandHistoryResponse__Output as _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output } from '../../../../build/stack/bezel/v1beta1/DeleteCommandHistoryResponse';
import type { ListCommandHistoryRequest as _build_stack_bezel_v1beta1_ListCommandHistoryRequest, ListCommandHistoryRequest__Output as _build_stack_bezel_v1beta1_ListCommandHistoryRequest__Output } from '../../../../build/stack/bezel/v1beta1/ListCommandHistoryRequest';
import type { ListCommandHistoryResponse as _build_stack_bezel_v1beta1_ListCommandHistoryResponse, ListCommandHistoryResponse__Output as _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output } from '../../../../build/stack/bezel/v1beta1/ListCommandHistoryResponse';

export interface HistoryClient extends grpc.Client {
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface HistoryHandlers extends grpc.UntypedServiceImplementation {
  Delete: grpc.handleUnaryCall<_build_stack_bezel_v1beta1_DeleteCommandHistoryRequest__Output, _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse>;
  
  List: grpc.handleUnaryCall<_build_stack_bezel_v1beta1_ListCommandHistoryRequest__Output, _build_stack_bezel_v1beta1_ListCommandHistoryResponse>;
  
}
