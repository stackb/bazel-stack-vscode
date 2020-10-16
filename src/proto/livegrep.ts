import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { CodeSearchClient as _livegrep_CodeSearchClient } from './livegrep/CodeSearch';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  livegrep: {
    Bounds: MessageTypeDefinition
    CodeSearch: SubtypeConstructor<typeof grpc.Client, _livegrep_CodeSearchClient> & { service: ServiceDefinition }
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

