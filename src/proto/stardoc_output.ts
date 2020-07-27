import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { ModulesClient as _stardoc_output_ModulesClient } from './stardoc_output/Modules';

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
    GetModuleInfoRequest: MessageTypeDefinition
    ModuleInfo: MessageTypeDefinition
    /**
     * Modules service implementation provides modules from module requests.
     */
    Modules: SubtypeConstructor<typeof grpc.Client, _stardoc_output_ModulesClient> & { service: ServiceDefinition }
    ProviderFieldInfo: MessageTypeDefinition
    ProviderInfo: MessageTypeDefinition
    ProviderNameGroup: MessageTypeDefinition
    RuleInfo: MessageTypeDefinition
    StarlarkFunctionInfo: MessageTypeDefinition
  }
}

