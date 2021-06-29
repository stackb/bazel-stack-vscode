import type * as grpc from '@grpc/grpc-js';
import type {
  ServiceDefinition,
  EnumTypeDefinition,
  MessageTypeDefinition,
} from '@grpc/proto-loader';

import type { AuthServiceClient as _build_stack_auth_v1beta1_AuthServiceClient } from './build/stack/auth/v1beta1/AuthService';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      auth: {
        v1beta1: {
          AuthService: SubtypeConstructor<
            typeof grpc.Client,
            _build_stack_auth_v1beta1_AuthServiceClient
          > & { service: ServiceDefinition };
          LoginRequest: MessageTypeDefinition;
          LoginResponse: MessageTypeDefinition;
          PasswordResetRequest: MessageTypeDefinition;
          PasswordResetResponse: MessageTypeDefinition;
          RegisterRequest: MessageTypeDefinition;
          User: MessageTypeDefinition;
        };
      };
    };
  };
}
