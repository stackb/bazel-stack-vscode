import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { LicensesClient as _build_stack_license_v1beta1_LicensesClient, LicensesDefinition as _build_stack_license_v1beta1_LicensesDefinition } from './build/stack/license/v1beta1/Licenses';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      license: {
        v1beta1: {
          License: MessageTypeDefinition
          Licenses: SubtypeConstructor<typeof grpc.Client, _build_stack_license_v1beta1_LicensesClient> & { service: _build_stack_license_v1beta1_LicensesDefinition }
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

