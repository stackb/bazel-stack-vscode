import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { AuthServiceClient as _build_stack_auth_v1beta1_AuthServiceClient } from './build/stack/auth/v1beta1/AuthService';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  build: {
    stack: {
      auth: {
        v1beta1: {
          AuthService: SubtypeConstructor<typeof grpc.Client, _build_stack_auth_v1beta1_AuthServiceClient> & { service: ServiceDefinition }
          LoginRequest: MessageTypeDefinition
          LoginResponse: MessageTypeDefinition
          PasswordResetRequest: MessageTypeDefinition
          PasswordResetResponse: MessageTypeDefinition
          RegisterRequest: MessageTypeDefinition
          User: MessageTypeDefinition
        }
      }
    }
  }
}

