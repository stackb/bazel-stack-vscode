import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from "vscode";
import { WorkspaceServiceClient } from "../proto/build/stack/bezel/v1beta1/WorkspaceService";
import { LicensesClient } from "../proto/build/stack/license/v1beta1/Licenses";
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';

/**
 * Configuration for the Bzl feature.
 */
export type BzlConfiguration = {
    verbose: number,
    license: LicenseServerConfiguration,
    server: BzlServerConfiguration,
};

/**
 * Configuration for the license server integration.
 */
export type LicenseServerConfiguration = {
    // filename of the license.proto file.
    protofile: string,
    // address of the license server
    address: string,
    // the value of the current license token
    token: string,
};

/**
 * Configuration for the bzl server.
 */
export type BzlServerConfiguration = {
    // filename of the bzl.proto file.
    protofile: string,
    // address of the bzl server
    address: string,

    owner: string,
    repo: string,
    releaseTag: string,
    executable: string,
    command: string[],
};

export async function createBzlConfiguration(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const license = {
        protofile: config.get<string>("license.proto", "./proto/license.proto"),
        address: config.get<string>("license.address", "accounts.bzl.io"),
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
        console.log(`Read license.token from license file "${licenseFile}"`);
    }
    license.token = "";

    const server = {
        protofile: config.get<string>("server.proto", "./proto/bzl.proto"),
        address: config.get<string>("server.address", "accounts.bzl.io"),
        owner: config.get<string>("server.github-owner", "stackb"),
        repo: config.get<string>("server.github-repo", "bzl"),
        releaseTag: config.get<string>("github-release", "v0.8.7"),
        executable: config.get<string>("server.executable", ""),
        command: config.get<string[]>("server.command", ["lsp", "starlark", ""]),
    };
    if (server.protofile.startsWith("./")) {
        server.protofile = ctx.asAbsolutePath(server.protofile);
    }

    const cfg = {
        verbose: config.get<number>("verbose", 0),
        license: license,
        server: server,
    };

    return cfg;
}

export function loadLicenseProtos(protofile: string): LicenseProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as LicenseProtoType;
}


export function loadBzlProtos(protofile: string): BzlProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as BzlProtoType;
}


/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createLicensesClient(proto: LicenseProtoType, address: string): LicensesClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.license.v1beta1.Licenses(address, creds);
}


/**
 * Create a new client for the Workspace service.
 * 
 * @param address The address to connect.
 */
export function createWorkspaceServiceClient(proto: BzlProtoType, address: string): WorkspaceServiceClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.bezel.v1beta1.WorkspaceService(address, creds);
}