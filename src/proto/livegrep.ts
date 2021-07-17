import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  CodeSearchClient as _livegrep_CodeSearchClient,
  CodeSearchDefinition as _livegrep_CodeSearchDefinition,
} from './livegrep/CodeSearch';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  livegrep: {
    Bounds: MessageTypeDefinition;
    CodeSearch: SubtypeConstructor<typeof grpc.Client, _livegrep_CodeSearchClient> & {
      service: _livegrep_CodeSearchDefinition;
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
