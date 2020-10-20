// Original file: proto/codesearch.proto

import * as grpc from '@grpc/grpc-js'
import { CreateScopeRequest as _build_stack_codesearch_v1beta1_CreateScopeRequest, CreateScopeRequest__Output as _build_stack_codesearch_v1beta1_CreateScopeRequest__Output } from '../../../../build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse as _build_stack_codesearch_v1beta1_CreateScopeResponse, CreateScopeResponse__Output as _build_stack_codesearch_v1beta1_CreateScopeResponse__Output } from '../../../../build/stack/codesearch/v1beta1/CreateScopeResponse';
import { GetScopeRequest as _build_stack_codesearch_v1beta1_GetScopeRequest, GetScopeRequest__Output as _build_stack_codesearch_v1beta1_GetScopeRequest__Output } from '../../../../build/stack/codesearch/v1beta1/GetScopeRequest';
import { ListScopesRequest as _build_stack_codesearch_v1beta1_ListScopesRequest, ListScopesRequest__Output as _build_stack_codesearch_v1beta1_ListScopesRequest__Output } from '../../../../build/stack/codesearch/v1beta1/ListScopesRequest';
import { ListScopesResponse as _build_stack_codesearch_v1beta1_ListScopesResponse, ListScopesResponse__Output as _build_stack_codesearch_v1beta1_ListScopesResponse__Output } from '../../../../build/stack/codesearch/v1beta1/ListScopesResponse';
import { Scope as _build_stack_codesearch_v1beta1_Scope, Scope__Output as _build_stack_codesearch_v1beta1_Scope__Output } from '../../../../build/stack/codesearch/v1beta1/Scope';

export interface ScopesClient extends grpc.Client {
  Create(argument: _build_stack_codesearch_v1beta1_CreateScopeRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_codesearch_v1beta1_CreateScopeResponse__Output>;
  Create(argument: _build_stack_codesearch_v1beta1_CreateScopeRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_codesearch_v1beta1_CreateScopeResponse__Output>;
  create(argument: _build_stack_codesearch_v1beta1_CreateScopeRequest, metadata: grpc.Metadata, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_codesearch_v1beta1_CreateScopeResponse__Output>;
  create(argument: _build_stack_codesearch_v1beta1_CreateScopeRequest, options?: grpc.CallOptions): grpc.ClientReadableStream<_build_stack_codesearch_v1beta1_CreateScopeResponse__Output>;
  
  Get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_codesearch_v1beta1_GetScopeRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_Scope__Output) => void): grpc.ClientUnaryCall;
  
  List(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  List(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  list(argument: _build_stack_codesearch_v1beta1_ListScopesRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_codesearch_v1beta1_ListScopesResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface ScopesHandlers extends grpc.UntypedServiceImplementation {
  Create(call: grpc.ServerWritableStream<_build_stack_codesearch_v1beta1_CreateScopeRequest__Output, _build_stack_codesearch_v1beta1_CreateScopeResponse>): void;
  
  Get(call: grpc.ServerUnaryCall<_build_stack_codesearch_v1beta1_GetScopeRequest__Output, _build_stack_codesearch_v1beta1_Scope>, callback: grpc.sendUnaryData<_build_stack_codesearch_v1beta1_Scope>): void;
  
  List(call: grpc.ServerUnaryCall<_build_stack_codesearch_v1beta1_ListScopesRequest__Output, _build_stack_codesearch_v1beta1_ListScopesResponse>, callback: grpc.sendUnaryData<_build_stack_codesearch_v1beta1_ListScopesResponse>): void;
  
}
