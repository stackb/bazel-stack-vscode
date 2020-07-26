import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as path from 'path';

import { ProtoGrpcType } from '../stardoc_output';

const protoFilePath = path.normalize(path.join(__dirname, "stardoc_output.proto"));

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
export const proto = grpc.loadPackageDefinition(protoPackage) as unknown as ProtoGrpcType;
