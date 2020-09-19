// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { DeleteCommandHistoryRequest as _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, DeleteCommandHistoryRequest__Output as _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest__Output } from '../../../../build/stack/bezel/v1beta1/DeleteCommandHistoryRequest';
import { DeleteCommandHistoryResponse as _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse, DeleteCommandHistoryResponse__Output as _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output } from '../../../../build/stack/bezel/v1beta1/DeleteCommandHistoryResponse';
import { ListCommandHistoryRequest as _build_stack_bezel_v1beta1_ListCommandHistoryRequest, ListCommandHistoryRequest__Output as _build_stack_bezel_v1beta1_ListCommandHistoryRequest__Output } from '../../../../build/stack/bezel/v1beta1/ListCommandHistoryRequest';
import { ListCommandHistoryResponse as _build_stack_bezel_v1beta1_ListCommandHistoryResponse, ListCommandHistoryResponse__Output as _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output } from '../../../../build/stack/bezel/v1beta1/ListCommandHistoryResponse';

export interface HistoryClient extends grpc.Client {
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  Delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  delete(argument: _build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_bezel_v1beta1_ListCommandHistoryRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface HistoryHandlers {
  Delete(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_DeleteCommandHistoryRequest, _build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_DeleteCommandHistoryResponse__Output>): void;
  
  List(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_ListCommandHistoryRequest, _build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_ListCommandHistoryResponse__Output>): void;
  
}
