import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { ApplicationClient as _build_stack_bzl_v1beta1_ApplicationClient } from './build/stack/bzl/v1beta1/Application';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  build: {
    stack: {
      bzl: {
        v1beta1: {
          /**
           * The Application service provides metadata about the bzl application
           */
          Application: SubtypeConstructor<typeof grpc.Client, _build_stack_bzl_v1beta1_ApplicationClient> & { service: ServiceDefinition }
          ApplicationMetadata: MessageTypeDefinition
          GetApplicationMetadataRequest: MessageTypeDefinition
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

