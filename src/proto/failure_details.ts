import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  failure_details: {
    BuildProgress: MessageTypeDefinition;
    ClientEnvironment: MessageTypeDefinition;
    Crash: MessageTypeDefinition;
    ExternalRepository: MessageTypeDefinition;
    FailureDetail: MessageTypeDefinition;
    FailureDetailMetadata: MessageTypeDefinition;
    Interrupted: MessageTypeDefinition;
    PackageOptions: MessageTypeDefinition;
    RemoteExecution: MessageTypeDefinition;
    RemoteOptions: MessageTypeDefinition;
    SymlinkForest: MessageTypeDefinition;
    Throwable: MessageTypeDefinition;
  };
  google: {
    protobuf: {
      DescriptorProto: MessageTypeDefinition;
      EnumDescriptorProto: MessageTypeDefinition;
      EnumOptions: MessageTypeDefinition;
      EnumValueDescriptorProto: MessageTypeDefinition;
      EnumValueOptions: MessageTypeDefinition;
      FieldDescriptorProto: MessageTypeDefinition;
      FieldOptions: MessageTypeDefinition;
      FileDescriptorProto: MessageTypeDefinition;
      FileDescriptorSet: MessageTypeDefinition;
      FileOptions: MessageTypeDefinition;
      GeneratedCodeInfo: MessageTypeDefinition;
      MessageOptions: MessageTypeDefinition;
      MethodDescriptorProto: MessageTypeDefinition;
      MethodOptions: MessageTypeDefinition;
      OneofDescriptorProto: MessageTypeDefinition;
      OneofOptions: MessageTypeDefinition;
      ServiceDescriptorProto: MessageTypeDefinition;
      ServiceOptions: MessageTypeDefinition;
      SourceCodeInfo: MessageTypeDefinition;
      UninterpretedOption: MessageTypeDefinition;
    };
  };
}
