import * as fs from 'fs';
import * as protobuf from 'protobufjs';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as path from 'path';

import { ProtoGrpcType } from '../stardoc_output';
import { ModulesClient } from './Modules';
import { ModuleInfo } from './ModuleInfo';

const protoFilePath = path.normalize(path.normalize(path.join(__dirname, "..", "..", "..", "src", "proto", "stardoc_output", "stardoc_output.proto")));

let protoPackage = loader.loadSync(protoFilePath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true
});

/**
 * @see https://github.com/murgatroid99/proposal/blob/a872c74877b7a388320210ea6412c017e29b76eb/L70-node-proto-loader-type-generator.md#proposal
 */
export const proto = grpc.loadPackageDefinition(protoPackage) as unknown as ProtoGrpcType;

// export function deserializeModuleInfoFromFile(filename: string): ModuleInfo {
//     const ModuleInfo = protoPackage.loa
// }

export const stardoc_output = proto.stardoc_output;

/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createModulesClient(address: string): ModulesClient {
    const creds = grpc.credentials.createInsecure();
    return new stardoc_output.Modules(address, creds);
}

/**
 * Create a new server for the modules service.
 * 
 * @param address The address to start on.
 */
export function createModulesServer(address: string, handlers: grpc.UntypedServiceImplementation): grpc.Server {
    const server = new grpc.Server();
    server.addService(proto.stardoc_output.Modules.service, handlers);
    server.bind(address, grpc.ServerCredentials.createInsecure());
    return server;
}

/**
 * Load a ModuleInfo object from a binary file.
 * 
 * @param filename The protobuf binary file
 */
export function decodeStardocModuleFromFile(filename: string): ModuleInfo {
    const root = protobuf.loadSync('./stardoc_output.proto');
    const moduleInfoType = root.lookupType('stardoc_output.ModuleInfo');
    const bytes = fs.readFileSync(filename);
    const data = new Uint8Array(bytes);
    return moduleInfoType.decode(data) as ModuleInfo;
}
