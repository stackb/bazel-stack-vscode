// import * as vscode from 'vscode';
// vscode.window.showInformationMessage(`__dirname: ${__dirname}`);

import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as path from 'path';

// import { ProtoGrpcType } from '../../proto/application';
import { ApplicationClient } from '../../proto/build/stack/bzl/v1beta1/Application';
// import { Application } from '../../build/stack/bzl/v1beta1/application_pb';

let pkg: any = loader.loadSync(path.normalize(`${__dirname}/../../../src/bezel/client/application.proto`), {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true
});

const proto: any =  grpc.loadPackageDefinition(pkg);

// // const v1beta1 = types.build.stack.bzl.v1beta1;

console.log(`pkg`, Object.keys(pkg));
console.log(`proto`, proto);
// // console.log(`v1beta1`, v1beta1);

/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function newApplicationClient(address: string): ApplicationClient | undefined {
    // return undefined;
    const creds = grpc.credentials.createInsecure();
    return new pkg['build.stack.bzl.v1beta1.Application'](address, creds);
    // return new build_proto.Application(address, grpc.credentials.createInsecure());
}