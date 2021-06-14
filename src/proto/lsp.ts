import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      lsp: {
        v1beta1: {
          BazelInfoRequest: MessageTypeDefinition
          BazelInfoResponse: MessageTypeDefinition
        }
      }
    }
  }
}

