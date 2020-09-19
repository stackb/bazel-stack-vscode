import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { ApplicationServiceClient as _build_stack_bezel_v1beta1_ApplicationServiceClient } from './build/stack/bezel/v1beta1/ApplicationService';
import { CommandServiceClient as _build_stack_bezel_v1beta1_CommandServiceClient } from './build/stack/bezel/v1beta1/CommandService';
import { ExternalWorkspaceServiceClient as _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient } from './build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { HistoryClient as _build_stack_bezel_v1beta1_HistoryClient } from './build/stack/bezel/v1beta1/History';
import { PackageServiceClient as _build_stack_bezel_v1beta1_PackageServiceClient } from './build/stack/bezel/v1beta1/PackageService';
import { WorkspaceServiceClient as _build_stack_bezel_v1beta1_WorkspaceServiceClient } from './build/stack/bezel/v1beta1/WorkspaceService';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  build: {
    stack: {
      bezel: {
        v1beta1: {
          ApplicationService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_ApplicationServiceClient> & { service: ServiceDefinition }
          CancelRequest: MessageTypeDefinition
          CancelResponse: MessageTypeDefinition
          CommandHistory: MessageTypeDefinition
          CommandService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_CommandServiceClient> & { service: ServiceDefinition }
          DeleteCommandHistoryRequest: MessageTypeDefinition
          DeleteCommandHistoryResponse: MessageTypeDefinition
          EnvironmentVariable: MessageTypeDefinition
          ExecRequest: MessageTypeDefinition
          ExecResponse: MessageTypeDefinition
          ExternalListWorkspacesRequest: MessageTypeDefinition
          ExternalListWorkspacesResponse: MessageTypeDefinition
          ExternalWorkspace: MessageTypeDefinition
          ExternalWorkspaceService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient> & { service: ServiceDefinition }
          GetMetadataRequest: MessageTypeDefinition
          History: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_HistoryClient> & { service: ServiceDefinition }
          LabelKind: MessageTypeDefinition
          ListCommandHistoryRequest: MessageTypeDefinition
          ListCommandHistoryResponse: MessageTypeDefinition
          ListPackagesRequest: MessageTypeDefinition
          ListPackagesResponse: MessageTypeDefinition
          ListRulesRequest: MessageTypeDefinition
          ListRulesResponse: MessageTypeDefinition
          ListWorkspacesRequest: MessageTypeDefinition
          ListWorkspacesResponse: MessageTypeDefinition
          Metadata: MessageTypeDefinition
          Package: MessageTypeDefinition
          /**
           * PackageService defines an API for listing packages and rules.
           */
          PackageService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_PackageServiceClient> & { service: ServiceDefinition }
          RunRequest: MessageTypeDefinition
          RunResponse: MessageTypeDefinition
          Workspace: MessageTypeDefinition
          WorkspaceService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_WorkspaceServiceClient> & { service: ServiceDefinition }
        }
      }
    }
  }
  google: {
    protobuf: {
      Timestamp: MessageTypeDefinition
    }
  }
}

