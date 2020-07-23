import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as path from 'path';

import { ProtoGrpcType } from '../../proto/application';
import { ApplicationClient } from '../../proto/build/stack/bzl/v1beta1/Application';

const protoFilePath = path.normalize(`${__dirname}/../../../src/bezel/client/application.proto`);

let protoPackage: any = loader.loadSync(protoFilePath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true
});

/**
 * @see https://github.com/murgatroid99/proposal/blob/a872c74877b7a388320210ea6412c017e29b76eb/L70-node-proto-loader-type-generator.md#proposal
 */
const proto = grpc.loadPackageDefinition(protoPackage) as unknown as ProtoGrpcType;

/**
 * Exported type+implementations of the v1beta1 package.
 */
export const v1beta1 = proto.build.stack.bzl.v1beta1;

/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function newApplicationClient(address: string): ApplicationClient {
    const creds = grpc.credentials.createInsecure();
    return new v1beta1.Application(address, creds);
}