import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  failure_details: {
    BuildProgress: MessageTypeDefinition
    ClientEnvironment: MessageTypeDefinition
    Crash: MessageTypeDefinition
    ExternalRepository: MessageTypeDefinition
    FailureDetail: MessageTypeDefinition
    FailureDetailMetadata: MessageTypeDefinition
    Interrupted: MessageTypeDefinition
    PackageOptions: MessageTypeDefinition
    RemoteExecution: MessageTypeDefinition
    RemoteOptions: MessageTypeDefinition
    SymlinkForest: MessageTypeDefinition
    Throwable: MessageTypeDefinition
  }
  google: {
    protobuf: {
      DescriptorProto: MessageTypeDefinition
      EnumDescriptorProto: MessageTypeDefinition
      EnumOptions: MessageTypeDefinition
      EnumValueDescriptorProto: MessageTypeDefinition
      EnumValueOptions: MessageTypeDefinition
      FieldDescriptorProto: MessageTypeDefinition
      FieldOptions: MessageTypeDefinition
      FileDescriptorProto: MessageTypeDefinition
      FileDescriptorSet: MessageTypeDefinition
      FileOptions: MessageTypeDefinition
      GeneratedCodeInfo: MessageTypeDefinition
      MessageOptions: MessageTypeDefinition
      MethodDescriptorProto: MessageTypeDefinition
      MethodOptions: MessageTypeDefinition
      OneofDescriptorProto: MessageTypeDefinition
      OneofOptions: MessageTypeDefinition
      ServiceDescriptorProto: MessageTypeDefinition
      ServiceOptions: MessageTypeDefinition
      SourceCodeInfo: MessageTypeDefinition
      UninterpretedOption: MessageTypeDefinition
    }
  }
}

