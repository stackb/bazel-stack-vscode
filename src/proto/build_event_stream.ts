import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
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
  build_event_stream: {
    Aborted: MessageTypeDefinition
    ActionExecuted: MessageTypeDefinition
    BuildEvent: MessageTypeDefinition
    BuildEventId: MessageTypeDefinition
    BuildFinished: MessageTypeDefinition
    BuildMetadata: MessageTypeDefinition
    BuildMetrics: MessageTypeDefinition
    BuildStarted: MessageTypeDefinition
    BuildToolLogs: MessageTypeDefinition
    Configuration: MessageTypeDefinition
    ConvenienceSymlink: MessageTypeDefinition
    ConvenienceSymlinksIdentified: MessageTypeDefinition
    Fetch: MessageTypeDefinition
    File: MessageTypeDefinition
    NamedSetOfFiles: MessageTypeDefinition
    OptionsParsed: MessageTypeDefinition
    OutputGroup: MessageTypeDefinition
    PatternExpanded: MessageTypeDefinition
    Progress: MessageTypeDefinition
    TargetComplete: MessageTypeDefinition
    TargetConfigured: MessageTypeDefinition
    TestResult: MessageTypeDefinition
    TestSize: EnumTypeDefinition
    TestStatus: EnumTypeDefinition
    TestSummary: MessageTypeDefinition
    UnstructuredCommandLine: MessageTypeDefinition
    WorkspaceConfig: MessageTypeDefinition
    WorkspaceStatus: MessageTypeDefinition
  }
  command_line: {
    ChunkList: MessageTypeDefinition
    CommandLine: MessageTypeDefinition
    CommandLineSection: MessageTypeDefinition
    Option: MessageTypeDefinition
    OptionList: MessageTypeDefinition
  }
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
  options: {
    OptionEffectTag: EnumTypeDefinition
    OptionMetadataTag: EnumTypeDefinition
  }
}

