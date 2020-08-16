import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { GitHubReleaseAssetDownloader } from '../download';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import { BzlFeatureName } from './feature';
import getPort = require('get-port');

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

export async function createBzlConfiguration(
    asAbsolutePath: (rel: string) => string,
    storagePath: string,
    config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const license = {
        protofile: config.get<string>('license.proto', './proto/license.proto'),
        address: config.get<string>('license.address', 'accounts.bzl.io'),
        token: config.get<string>('license.token', ''),
    };
    if (license.protofile.startsWith('./')) {
        license.protofile = asAbsolutePath(license.protofile);
    }
    if (!license.token) {
        const homedir = os.homedir();
        const licenseFile = path.join(homedir, '.bzl', 'license.key');
        if (fs.existsSync(licenseFile)) {
            const buf = fs.readFileSync(licenseFile);
            license.token = buf.toString().trim();
        }
        console.log(`Read license.token from license file "${licenseFile}"`);
    }
    license.token = '';

    const grpcServer = {
        protofile: config.get<string>('server.proto', './proto/bzl.proto'),
        address: config.get<string>('server.address', ''),
        owner: config.get<string>('server.github-owner', 'stackb'),
        repo: config.get<string>('server.github-repo', 'bzl'),
        releaseTag: config.get<string>('server.github-release', '0.9.0'),
        executable: config.get<string>('server.executable', ''),
        command: config.get<string[]>('server.command', ['serve', '--vscode']),
    };
    if (grpcServer.protofile.startsWith('./')) {
        grpcServer.protofile = asAbsolutePath(grpcServer.protofile);
    }

    const httpServer = {
        address: config.get<string>('http.address', ''),
    };

    await setServerExecutable(grpcServer, storagePath);
    await setServerAddresses(grpcServer, httpServer);

    const cfg = {
        verbose: config.get<number>('verbose', 0),
        license: license,
        grpcServer: grpcServer,
        httpServer: httpServer,
    };

    return cfg;
}

export async function setServerExecutable(grpcServer: BzlGrpcServerConfiguration, storagePath: string): Promise<any> {
    if (!grpcServer.executable) {
        try {
            grpcServer.executable = await maybeInstallExecutable(grpcServer, path.join(storagePath, BzlFeatureName));
        } catch (err) {
            throw new Error(`feature.bzl: could not install bzl ${err}`);
        }
    }
    if (!fs.existsSync(grpcServer.executable)) {
        throw new Error(`could not activate: bzl executable file "${grpcServer.executable}" not found.`);
    }
}

export async function setServerAddresses(grpcServer: BzlGrpcServerConfiguration, httpServer: BzlHttpServerConfiguration): Promise<any> {
    if (!grpcServer.address) {
        grpcServer.address = `localhost:${await getPort({
            port: 1080,
        })}`;
    }
    if (!httpServer.address) {
        httpServer.address = `localhost:${await getPort({
            port: 8080,
        })}`;
    }

    const gp = getHostAndPort(grpcServer.address);
    const hp = getHostAndPort(httpServer.address);

    grpcServer.command.push(`--grpc_host=${gp.host}`);
    grpcServer.command.push(`--grpc_port=${gp.port}`);
    grpcServer.command.push(`--http_host=${hp.host}`);
    grpcServer.command.push(`--http_port=${hp.port}`);
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
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createApplicationServiceClient(proto: BzlProtoType, address: string): ApplicationServiceClient {
    const creds = grpc.credentials.createInsecure();
    return new proto.build.stack.bezel.v1beta1.ApplicationService(address, creds, {
        'grpc.initial_reconnect_backoff_ms': 200,
    });
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
};

export function splitLabel(label: string): LabelParts | undefined {
    const halves = label.split('//');
    if (halves.length !== 2) {
        return undefined;
    }
    const ws = halves[0] || '@';
    let pkgTarget = halves[1].split(':');
    if (pkgTarget.length !== 2) {
        return undefined;
    }
    const pkg = pkgTarget[0];
    const target = pkgTarget[1];

    return { ws, pkg, target };
}

type HostAndPort = {
    host: string,
    port: number,
};

function getHostAndPort(address: string): HostAndPort {
    const colon = address.indexOf(':');
    if (colon < 0 || colon === address.length) {
        throw new Error(`malformed address: want HOST:PORT, got "${address}"`);
    }
    return {
        host: address.slice(0, colon),
        port: parseInt(address.slice(colon + 1), 10),
    };
}


/**
 * Installs buildifier from a github release.  If the expected file already
 * exists the download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallExecutable(cfg: BzlGrpcServerConfiguration, storagePath: string): Promise<string> {

    const assetName = platformBinaryName('bzl');

    const downloader = new GitHubReleaseAssetDownloader(
        {
            owner: cfg.owner,
            repo: cfg.repo,
            releaseTag: cfg.releaseTag,
            name: assetName,
        },
        storagePath,
        true, // isExecutable
    );

    const executable = downloader.getFilepath();

    if (fs.existsSync(executable)) {
        return Promise.resolve(executable);
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${assetName} ${cfg.releaseTag}`
    }, progress => {
        return downloader.download();
    });

    vscode.window.showInformationMessage(`Downloaded ${assetName} ${cfg.releaseTag} to ${executable}`);

    return executable;
}

export function platformBinaryName(toolName: string) {
    if (process.platform === 'win32') {
        return toolName + '.exe';
    }
    if (process.platform === 'darwin') {
        return toolName + '.mac';
    }
    return toolName;
}
