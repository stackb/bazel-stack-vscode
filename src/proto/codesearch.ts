import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { CodeSearchClient as _build_stack_codesearch_v1beta1_CodeSearchClient, CodeSearchDefinition as _build_stack_codesearch_v1beta1_CodeSearchDefinition } from './build/stack/codesearch/v1beta1/CodeSearch';
import type { ScopesClient as _build_stack_codesearch_v1beta1_ScopesClient, ScopesDefinition as _build_stack_codesearch_v1beta1_ScopesDefinition } from './build/stack/codesearch/v1beta1/Scopes';
import type { CodeSearchClient as _livegrep_CodeSearchClient, CodeSearchDefinition as _livegrep_CodeSearchDefinition } from './livegrep/CodeSearch';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      codesearch: {
        v1beta1: {
          BazelQuery: MessageTypeDefinition
          CodeSearch: SubtypeConstructor<typeof grpc.Client, _build_stack_codesearch_v1beta1_CodeSearchClient> & { service: _build_stack_codesearch_v1beta1_CodeSearchDefinition }
          CreateScopeRequest: MessageTypeDefinition
          CreateScopeResponse: MessageTypeDefinition
          GetScopeRequest: MessageTypeDefinition
          LineBlock: MessageTypeDefinition
          LineBounds: MessageTypeDefinition
          ListScopesRequest: MessageTypeDefinition
          ListScopesResponse: MessageTypeDefinition
          MergedCodeSearchResult: MessageTypeDefinition
          MergedSearchResult: MessageTypeDefinition
          Scope: MessageTypeDefinition
          ScopedQuery: MessageTypeDefinition
          Scopes: SubtypeConstructor<typeof grpc.Client, _build_stack_codesearch_v1beta1_ScopesClient> & { service: _build_stack_codesearch_v1beta1_ScopesDefinition }
        }
      }
    }
  }
  google: {
    protobuf: {
      Timestamp: MessageTypeDefinition
    }
  }
  livegrep: {
    Bounds: MessageTypeDefinition
    CodeSearch: SubtypeConstructor<typeof grpc.Client, _livegrep_CodeSearchClient> & { service: _livegrep_CodeSearchDefinition }
    CodeSearchResult: MessageTypeDefinition
    Empty: MessageTypeDefinition
    FileResult: MessageTypeDefinition
    IndexSpec: MessageTypeDefinition
    InfoRequest: MessageTypeDefinition
    Metadata: MessageTypeDefinition
    PathSpec: MessageTypeDefinition
    Query: MessageTypeDefinition
    RepoSpec: MessageTypeDefinition
    SearchResult: MessageTypeDefinition
    SearchStats: MessageTypeDefinition
    ServerInfo: MessageTypeDefinition
  }
}

