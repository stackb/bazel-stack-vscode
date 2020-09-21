import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

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

