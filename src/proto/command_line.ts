import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  command_line: {
    ChunkList: MessageTypeDefinition
    CommandLine: MessageTypeDefinition
    CommandLineSection: MessageTypeDefinition
    Option: MessageTypeDefinition
    OptionList: MessageTypeDefinition
  }
  options: {
    OptionEffectTag: EnumTypeDefinition
    OptionMetadataTag: EnumTypeDefinition
  }
}

