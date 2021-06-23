// Original file: proto/codesearch.proto

import type * as grpc from '@grpc/grpc-js';
import type {
  CodeSearchResult as _livegrep_CodeSearchResult,
  CodeSearchResult__Output as _livegrep_CodeSearchResult__Output,
} from '../../../../livegrep/CodeSearchResult';
import type {
  ScopedQuery as _build_stack_codesearch_v1beta1_ScopedQuery,
  ScopedQuery__Output as _build_stack_codesearch_v1beta1_ScopedQuery__Output,
} from '../../../../build/stack/codesearch/v1beta1/ScopedQuery';

export interface CodeSearchClient extends grpc.Client {
  Search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  Search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    metadata: grpc.Metadata,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  Search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    options: grpc.CallOptions,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  Search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    metadata: grpc.Metadata,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    options: grpc.CallOptions,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
  search(
    argument: _build_stack_codesearch_v1beta1_ScopedQuery,
    callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void
  ): grpc.ClientUnaryCall;
}

export interface CodeSearchHandlers extends grpc.UntypedServiceImplementation {
  Search: grpc.handleUnaryCall<
    _build_stack_codesearch_v1beta1_ScopedQuery__Output,
    _livegrep_CodeSearchResult
  >;
}
