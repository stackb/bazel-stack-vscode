import type * as grpc from '@grpc/grpc-js';
import type { EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  ApplicationServiceClient as _build_stack_bezel_v1beta1_ApplicationServiceClient,
  ApplicationServiceDefinition as _build_stack_bezel_v1beta1_ApplicationServiceDefinition,
} from './build/stack/bezel/v1beta1/ApplicationService';
import type {
  CommandServiceClient as _build_stack_bezel_v1beta1_CommandServiceClient,
  CommandServiceDefinition as _build_stack_bezel_v1beta1_CommandServiceDefinition,
} from './build/stack/bezel/v1beta1/CommandService';
import type {
  ExternalWorkspaceServiceClient as _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient,
  ExternalWorkspaceServiceDefinition as _build_stack_bezel_v1beta1_ExternalWorkspaceServiceDefinition,
} from './build/stack/bezel/v1beta1/ExternalWorkspaceService';
import type {
  FileServiceClient as _build_stack_bezel_v1beta1_FileServiceClient,
  FileServiceDefinition as _build_stack_bezel_v1beta1_FileServiceDefinition,
} from './build/stack/bezel/v1beta1/FileService';
import type {
  HistoryClient as _build_stack_bezel_v1beta1_HistoryClient,
  HistoryDefinition as _build_stack_bezel_v1beta1_HistoryDefinition,
} from './build/stack/bezel/v1beta1/History';
import type {
  InfoServiceClient as _build_stack_bezel_v1beta1_InfoServiceClient,
  InfoServiceDefinition as _build_stack_bezel_v1beta1_InfoServiceDefinition,
} from './build/stack/bezel/v1beta1/InfoService';
import type {
  PackageServiceClient as _build_stack_bezel_v1beta1_PackageServiceClient,
  PackageServiceDefinition as _build_stack_bezel_v1beta1_PackageServiceDefinition,
} from './build/stack/bezel/v1beta1/PackageService';
import type {
  WorkspaceServiceClient as _build_stack_bezel_v1beta1_WorkspaceServiceClient,
  WorkspaceServiceDefinition as _build_stack_bezel_v1beta1_WorkspaceServiceDefinition,
} from './build/stack/bezel/v1beta1/WorkspaceService';
import type {
  PublishBuildEventClient as _google_devtools_build_v1_PublishBuildEventClient,
  PublishBuildEventDefinition as _google_devtools_build_v1_PublishBuildEventDefinition,
} from './google/devtools/build/v1/PublishBuildEvent';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      bezel: {
        v1beta1: {
          ApplicationService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_ApplicationServiceClient
          > & { service: _build_stack_bezel_v1beta1_ApplicationServiceDefinition };
          CancelRequest: MessageTypeDefinition;
          CancelResponse: MessageTypeDefinition;
          CommandHistory: MessageTypeDefinition;
          CommandService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_CommandServiceClient
          > & { service: _build_stack_bezel_v1beta1_CommandServiceDefinition };
          DeleteCommandHistoryRequest: MessageTypeDefinition;
          DeleteCommandHistoryResponse: MessageTypeDefinition;
          EnvironmentVariable: MessageTypeDefinition;
          ExecRequest: MessageTypeDefinition;
          ExecResponse: MessageTypeDefinition;
          ExternalListWorkspacesRequest: MessageTypeDefinition;
          ExternalListWorkspacesResponse: MessageTypeDefinition;
          ExternalWorkspace: MessageTypeDefinition;
          ExternalWorkspaceService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient
          > & { service: _build_stack_bezel_v1beta1_ExternalWorkspaceServiceDefinition };
          FileDownloadRequest: MessageTypeDefinition;
          FileDownloadResponse: MessageTypeDefinition;
          FileKind: EnumTypeDefinition;
          FileService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_FileServiceClient
          > & { service: _build_stack_bezel_v1beta1_FileServiceDefinition };
          GetMetadataRequest: MessageTypeDefinition;
          GetWorkspaceRequest: MessageTypeDefinition;
          History: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_HistoryClient
          > & { service: _build_stack_bezel_v1beta1_HistoryDefinition };
          Info: MessageTypeDefinition;
          InfoRequest: MessageTypeDefinition;
          InfoResponse: MessageTypeDefinition;
          InfoService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_InfoServiceClient
          > & { service: _build_stack_bezel_v1beta1_InfoServiceDefinition };
          LabelKind: MessageTypeDefinition;
          ListCommandHistoryRequest: MessageTypeDefinition;
          ListCommandHistoryResponse: MessageTypeDefinition;
          ListPackagesRequest: MessageTypeDefinition;
          ListPackagesResponse: MessageTypeDefinition;
          ListRulesRequest: MessageTypeDefinition;
          ListRulesResponse: MessageTypeDefinition;
          ListWorkspacesRequest: MessageTypeDefinition;
          ListWorkspacesResponse: MessageTypeDefinition;
          Metadata: MessageTypeDefinition;
          Package: MessageTypeDefinition;
          /**
           * PackageService defines an API for listing packages and rules.
           */
          PackageService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_PackageServiceClient
          > & { service: _build_stack_bezel_v1beta1_PackageServiceDefinition };
          RunRequest: MessageTypeDefinition;
          RunResponse: MessageTypeDefinition;
          ShutdownRequest: MessageTypeDefinition;
          ShutdownResponse: MessageTypeDefinition;
          Workspace: MessageTypeDefinition;
          WorkspaceService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_bezel_v1beta1_WorkspaceServiceClient
          > & { service: _build_stack_bezel_v1beta1_WorkspaceServiceDefinition };
        };
      };
    };
  };
  google: {
    api: {
      CustomHttpPattern: MessageTypeDefinition;
      Http: MessageTypeDefinition;
      HttpRule: MessageTypeDefinition;
    };
    devtools: {
      build: {
        v1: {
          BuildEvent: MessageTypeDefinition;
          BuildStatus: MessageTypeDefinition;
          ConsoleOutputStream: EnumTypeDefinition;
          OrderedBuildEvent: MessageTypeDefinition;
          /**
           * A service for publishing BuildEvents. BuildEvents are generated by Build
           * Systems to record actions taken during a Build. Events occur in streams,
           * are identified by a StreamId, and ordered by sequence number in a stream.
           *
           * A Build may contain several streams of BuildEvents, depending on the systems
           * that are involved in the Build. Some BuildEvents are used to declare the
           * beginning and end of major portions of a Build; these are called
           * LifecycleEvents, and are used (for example) to indicate the beginning or end
           * of a Build, and the beginning or end of an Invocation attempt (there can be
           * more than 1 Invocation in a Build if, for example, a failure occurs somewhere
           * and it needs to be retried).
           *
           * Other, build-tool events represent actions taken by the Build tool, such as
           * target objects produced via compilation, tests run, et cetera. There could be
           * more than one build tool stream for an invocation attempt of a build.
           */
          PublishBuildEvent: SubtypeConstructor<
            typeof grpc.Client,
            _google_devtools_build_v1_PublishBuildEventClient
          > & { service: _google_devtools_build_v1_PublishBuildEventDefinition };
          PublishBuildToolEventStreamRequest: MessageTypeDefinition;
          PublishBuildToolEventStreamResponse: MessageTypeDefinition;
          PublishLifecycleEventRequest: MessageTypeDefinition;
          StreamId: MessageTypeDefinition;
        };
      };
    };
    protobuf: {
      Any: MessageTypeDefinition;
      DescriptorProto: MessageTypeDefinition;
      Duration: MessageTypeDefinition;
      Empty: MessageTypeDefinition;
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
      Timestamp: MessageTypeDefinition;
      UninterpretedOption: MessageTypeDefinition;
    };
  };
}
