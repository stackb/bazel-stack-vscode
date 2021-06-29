import type * as grpc from '@grpc/grpc-js';
import type {
  ServiceDefinition,
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader';

import type { CodeSearchClient as _build_stack_codesearch_v1beta1_CodeSearchClient } from './build/stack/codesearch/v1beta1/CodeSearch';
import type { ScopesClient as _build_stack_codesearch_v1beta1_ScopesClient } from './build/stack/codesearch/v1beta1/Scopes';
import type { CodeSearchClient as _livegrep_CodeSearchClient } from './livegrep/CodeSearch';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      codesearch: {
        v1beta1: {
          BazelQuery: MessageTypeDefinition;
          CodeSearch: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_codesearch_v1beta1_CodeSearchClient
          > & { service: ServiceDefinition };
          CreateScopeRequest: MessageTypeDefinition;
          CreateScopeResponse: MessageTypeDefinition;
          GetScopeRequest: MessageTypeDefinition;
          LineBlock: MessageTypeDefinition;
          LineBounds: MessageTypeDefinition;
          ListScopesRequest: MessageTypeDefinition;
          ListScopesResponse: MessageTypeDefinition;
          MergedCodeSearchResult: MessageTypeDefinition;
          MergedSearchResult: MessageTypeDefinition;
          Scope: MessageTypeDefinition;
          ScopedQuery: MessageTypeDefinition;
          Scopes: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_codesearch_v1beta1_ScopesClient
          > & { service: ServiceDefinition };
        };
      };
    };
  };
  google: {
    protobuf: {
      Timestamp: MessageTypeDefinition;
    };
  };
  livegrep: {
    Bounds: MessageTypeDefinition;
    CodeSearch: SubtypeConstructor<typeof grpc.Client, _livegrep_CodeSearchClient> & {
      service: ServiceDefinition;
    };
    CodeSearchResult: MessageTypeDefinition;
    Empty: MessageTypeDefinition;
    FileResult: MessageTypeDefinition;
    IndexSpec: MessageTypeDefinition;
    InfoRequest: MessageTypeDefinition;
    Metadata: MessageTypeDefinition;
    PathSpec: MessageTypeDefinition;
    Query: MessageTypeDefinition;
    RepoSpec: MessageTypeDefinition;
    SearchResult: MessageTypeDefinition;
    SearchStats: MessageTypeDefinition;
    ServerInfo: MessageTypeDefinition;
  };
}
