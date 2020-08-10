import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from "vscode";
import { LicensesClient } from "../proto/build/stack/license/v1beta1/Licenses";
import { ProtoGrpcType } from '../proto/license';

/**
 * Configuration for the Bzl feature.
 */
export type BzlConfiguration = {
    verbose: number,
    license: LicenseConfiguration,
};

/**
 * Configuration for the FlagInfo.
 */
export type LicenseConfiguration = {
    // filename of the license.proto file.
    protofile: string,
    // address of the license server
    server: string,
    // the value of the current license token
    token: string,
};

export async function createBzlConfiguration(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const license = {
        protofile: config.get<string>("license.proto", "./proto/license.proto"),
        server: config.get<string>("license.server", "accounts.bzl.io"),
        token: config.get<string>("license.token", ""),
    };
    if (license.protofile.startsWith("./")) {
        license.protofile = ctx.asAbsolutePath(license.protofile);
    }
    if (!license.token) {
        const homedir = os.homedir();
        const licenseFile = path.join(homedir, ".bzl", "license.key");
        if (fs.existsSync(licenseFile)) {
            const buf = fs.readFileSync(licenseFile);
            license.token = buf.toString().trim();
        }
        console.log(`Read license file license file "${licenseFile}": ${license.token}`);
    }
    const cfg = {
        verbose: config.get<number>("verbose", 0),
        license: license,
    };
    return cfg;
}

export function loadProtos(protofile: string): ProtoGrpcType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as ProtoGrpcType;
}

/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createLicensesClient(proto: ProtoGrpcType, address: string): LicensesClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.license.v1beta1.Licenses(address, creds);
}