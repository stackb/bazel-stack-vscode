import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

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
          ListWorkspacesRequest: MessageTypeDefinition
          ListWorkspacesResponse: MessageTypeDefinition
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

