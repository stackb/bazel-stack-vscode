import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  stardoc_output: {
    AspectInfo: MessageTypeDefinition
    AttributeInfo: MessageTypeDefinition
    AttributeType: EnumTypeDefinition
    FunctionParamInfo: MessageTypeDefinition
    ModuleInfo: MessageTypeDefinition
    ProviderFieldInfo: MessageTypeDefinition
    ProviderInfo: MessageTypeDefinition
    ProviderNameGroup: MessageTypeDefinition
    RuleInfo: MessageTypeDefinition
    StarlarkFunctionInfo: MessageTypeDefinition
  }
}

