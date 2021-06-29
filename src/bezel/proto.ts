import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { ProtoGrpcType as AuthProtoType } from '../proto/auth';
import { AuthServiceClient } from '../proto/build/stack/auth/v1beta1/AuthService';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { PlansClient } from '../proto/build/stack/nucleate/v1beta/Plans';
import { SubscriptionsClient } from '../proto/build/stack/nucleate/v1beta/Subscriptions';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as CodesearchProtoType } from '../proto/codesearch';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import { ProtoGrpcType as NucleateProtoType } from '../proto/nucleate';

export function loadLicenseProtos(protofile: string): LicenseProtoType {
  const protoPackage = loader.loadSync(protofile, {
    keepCase: false,
    // longs: String,
    // enums: String,
    defaults: false,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(protoPackage) as unknown as LicenseProtoType;
}

export function loadAuthProtos(protofile: string): AuthProtoType {
  const protoPackage = loader.loadSync(protofile, {
    keepCase: false,
    // longs: String,
    // enums: String,
    defaults: false,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(protoPackage) as unknown as AuthProtoType;
}

export function loadNucleateProtos(protofile: string): NucleateProtoType {
  const protoPackage = loader.loadSync(protofile, {
    keepCase: false,
    // longs: String,
    // enums: String,
    defaults: false,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(protoPackage) as unknown as NucleateProtoType;
}

export function loadBzlProtos(protofile: string): BzlProtoType {
  const protoPackage = loader.loadSync(protofile, {
    keepCase: false,
    // longs: String,
    // enums: String,
    defaults: false,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(protoPackage) as unknown as BzlProtoType;
}

export function loadCodesearchProtos(protofile: string): CodesearchProtoType {
  const protoPackage = loader.loadSync(protofile, {
    keepCase: false,
    // longs: String,
    // enums: String,
    defaults: false,
    oneofs: true,
  });
  return grpc.loadPackageDefinition(protoPackage) as unknown as CodesearchProtoType;
}

function getGRPCCredentials(address: string): grpc.ChannelCredentials {
  if (address.endsWith(':443')) {
    return grpc.credentials.createSsl();
  }
  return grpc.credentials.createInsecure();
}

/**
 * Create a new client for the Auth service.
 *
 * @param address The address to connect.
 */
export function createAuthServiceClient(proto: AuthProtoType, address: string, creds = getGRPCCredentials(address)): AuthServiceClient {
  return new proto.build.stack.auth.v1beta1.AuthService(address, creds);
}

/**
 * Create a new client for the Subscriptions service.
 *
 * @param address The address to connect.
 */
export function createSubscriptionsClient(
  proto: NucleateProtoType,
  address: string
): SubscriptionsClient {
  return new proto.build.stack.nucleate.v1beta.Subscriptions(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the Plans service.
 *
 * @param address The address to connect.
 */
export function createPlansClient(proto: NucleateProtoType, address: string, creds = getGRPCCredentials(address)): PlansClient {
  return new proto.build.stack.nucleate.v1beta.Plans(address, creds);
}

/**
 * Create a new client for the Application service.
 *
 * @param address The address to connect.
 */
export function createLicensesClient(proto: LicenseProtoType, address: string, creds = getGRPCCredentials(address)): LicensesClient {
  return new proto.build.stack.license.v1beta1.Licenses(address, creds);
}
