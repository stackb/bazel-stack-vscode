import * as grpc from '@grpc/grpc-js';
import { MessageTypeDefinition, ServiceDefinition } from '@grpc/proto-loader';
import { ApplicationServiceClient as _build_stack_bezel_v1beta1_ApplicationServiceClient } from './build/stack/bezel/v1beta1/ApplicationService';
import { ExternalWorkspaceServiceClient as _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient } from './build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { PackageServiceClient as _build_stack_bezel_v1beta1_PackageServiceClient } from './build/stack/bezel/v1beta1/PackageService';
import { WorkspaceServiceClient as _build_stack_bezel_v1beta1_WorkspaceServiceClient } from './build/stack/bezel/v1beta1/WorkspaceService';


type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      bezel: {
        v1beta1: {
          ApplicationService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_ApplicationServiceClient> & { service: ServiceDefinition }
          ExternalListWorkspacesRequest: MessageTypeDefinition
          ExternalListWorkspacesResponse: MessageTypeDefinition
          ExternalWorkspace: MessageTypeDefinition
          ExternalWorkspaceService: SubtypeConstructor<typeof grpc.Client, _build_stack_bezel_v1beta1_ExternalWorkspaceServiceClient> & { service: ServiceDefinition }
          GetMetadataRequest: MessageTypeDefinition
          LabelKind: MessageTypeDefinition
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
          Workspace: MessageTypeDefinition
          /**
           * WorkspaceService performs operations on
           */
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

