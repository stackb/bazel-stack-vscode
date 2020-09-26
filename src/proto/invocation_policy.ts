import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  blaze: {
    invocation_policy: {
      AllowValues: MessageTypeDefinition
      DisallowValues: MessageTypeDefinition
      FlagPolicy: MessageTypeDefinition
      InvocationPolicy: MessageTypeDefinition
      SetValue: MessageTypeDefinition
      UseDefault: MessageTypeDefinition
    }
  }
}

