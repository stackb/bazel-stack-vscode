import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
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
    grpcServer: BzlGrpcServerConfiguration,
    httpServer: BzlHttpServerConfiguration,
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
export type BzlGrpcServerConfiguration = {
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


/**
 * Configuration for the bzl server.
 */
export type BzlHttpServerConfiguration = {
    address: string,
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

    const grpcServer = {
        protofile: config.get<string>("server.proto", "./proto/bzl.proto"),
        address: config.get<string>("server.address", "accounts.bzl.io"),
        owner: config.get<string>("server.github-owner", "stackb"),
        repo: config.get<string>("server.github-repo", "bzl"),
        releaseTag: config.get<string>("github-release", "v0.8.7"),
        executable: config.get<string>("server.executable", ""),
        command: config.get<string[]>("server.command", ["lsp", "starlark", ""]),
    };
    if (grpcServer.protofile.startsWith("./")) {
        grpcServer.protofile = ctx.asAbsolutePath(grpcServer.protofile);
    }

    const httpServer = {
        address: config.get<string>("http.address", "localhost:8080"),
    };
     
    const cfg = {
        verbose: config.get<number>("verbose", 0),
        license: license,
        grpcServer: grpcServer,
        httpServer: httpServer,
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


/**
 * Create a new client for the Package service.
 * 
 * @param address The address to connect.
 */
export function createPackageServiceClient(proto: BzlProtoType, address: string): PackageServiceClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.bezel.v1beta1.PackageService(address, creds);
}


/**
 * Create a new client for the External Workspace service.
 * 
 * @param address The address to connect.
 */
export function createExternalWorkspaceServiceClient(proto: BzlProtoType, address: string): ExternalWorkspaceServiceClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.bezel.v1beta1.ExternalWorkspaceService(address, creds);
}

export type LabelParts = {
    ws: string,
    pkg: string,
    target: string,
}

export function splitLabel(label: string): LabelParts | undefined {
    const halves = label.split('//');
    if (halves.length !== 2) {
        return undefined;
    }
    const ws = halves[0] || '@';
    let pkgTarget = halves[1].split(":");
    if (pkgTarget.length !== 2) {
        return undefined;
    }
    const pkg = pkgTarget[0];
    const target = pkgTarget[1];

    return {ws, pkg, target};
}