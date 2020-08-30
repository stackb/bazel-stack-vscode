import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { LicensesClient as _build_stack_license_v1beta1_LicensesClient } from './build/stack/license/v1beta1/Licenses';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  build: {
    stack: {
      license: {
        v1beta1: {
          License: MessageTypeDefinition
          LicenseStatusRequest: MessageTypeDefinition
          LicenseStatusResponse: MessageTypeDefinition
          Licenses: SubtypeConstructor<typeof grpc.Client, _build_stack_license_v1beta1_LicensesClient> & { service: ServiceDefinition }
          RenewLicenseRequest: MessageTypeDefinition
          RenewLicenseResponse: MessageTypeDefinition
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

