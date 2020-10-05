import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'graceful-fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { parsers } from 'vscode-common';
import { platformBinaryName } from '../constants';
import { GitHubReleaseAssetDownloader } from '../download';
import { ProtoGrpcType as AuthProtoType } from '../proto/auth';
import { AuthServiceClient } from '../proto/build/stack/auth/v1beta1/AuthService';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { PlansClient } from '../proto/build/stack/nucleate/v1beta/Plans';
import { SubscriptionsClient } from '../proto/build/stack/nucleate/v1beta/Subscriptions';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import { ProtoGrpcType as NucleateProtoType } from '../proto/nucleate';
import { ConfigSection, Server, ServerBinaryName } from './constants';
import { BzlFeatureName } from './feature';
import portfinder = require('portfinder');

/**
 * Configuration for the Bzl feature.
 */
export type BzlConfiguration = {
    verbose: number,
    auth: AuthServerConfiguration,
    license: LicenseServerConfiguration,
    nucleate: NucleateServerConfiguration,
    server: BzlServerConfiguration,
    commandTask: CommandTaskConfiguration,
};

/**
 * Configuration that affect the behavior of tasks launched the the command server.
 */
export type CommandTaskConfiguration = {
    // the build_event_stream.proto file
    buildEventStreamProtofile: string,
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
    // address of the oauth-relay endpoint
    githubOAuthRelayUrl: string
};

/**
 * Configuration for the auth server integration.
 */
export type AuthServerConfiguration = {
    // filename of the license.proto file.
    protofile: string,
    // address of the license server
    address: string,
};

/**
 * Configuration for the nucleate server integration.
 */
export type NucleateServerConfiguration = {
    // filename of the nucleate.proto file.
    protofile: string,
    // address of the nucleate server
    address: string,
};

/**
 * Configuration for the bzl server.
 */
export type BzlServerConfiguration = {
    // filename of the bzl.proto file.
    protofile: string,
    // address of the bzl server
    address: string,
    // addresses of additional remote servers
    remotes: string[],
    // Download specs
    owner: string,
    repo: string,
    releaseTag: string,

    // Path to binary
    executable: string,

    // launch command
    command: string[],
};

export async function createBzlConfiguration(
    asAbsolutePath: (rel: string) => string,
    storagePath: string,
    config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const license: LicenseServerConfiguration = {
        protofile: config.get<string>(ConfigSection.LicenseProto,
            asAbsolutePath('./proto/license.proto')),
        address: config.get<string>(ConfigSection.AccountsAddress,
            'accounts.bzl.io:443'),
        token: config.get<string>(ConfigSection.LicenseToken,
            ''),
        githubOAuthRelayUrl: config.get<string>(ConfigSection.OAuthGithubRelay, 
            'https://build.bzl.io/github_login'),
    };

    const auth = {
        protofile: config.get<string>(ConfigSection.AuthProto, 
            asAbsolutePath('./proto/auth.proto')),
        address: config.get<string>(ConfigSection.AccountsAddress, 
            'accounts.bzl.io:443'),
    };

    const nucleate = {
        protofile: config.get<string>(ConfigSection.NucleateProto, 
            asAbsolutePath('./proto/nucleate.proto')),
        address: config.get<string>(ConfigSection.AccountsAddress, 
            'accounts.bzl.io:443'),
    };

    const server = {
        protofile: config.get<string>(ConfigSection.ServerProto, 
            asAbsolutePath('./proto/bzl.proto')),
        address: config.get<string>(ConfigSection.ServerAddress, 
            ''),
        owner: config.get<string>(ConfigSection.ServerGithubOwner, 
            'stackb'),
        repo: config.get<string>(ConfigSection.ServerGithubRepo, 
            'bzl'),
        releaseTag: config.get<string>(ConfigSection.ServerGithubRelease, 
            '0.9.0'),
        executable: config.get<string>(ConfigSection.ServerExecutable, 
            ''),
        command: config.get<string[]>(ConfigSection.ServerCommand, 
            ['serve', '--vscode']),
        remotes: config.get<string[]>(ConfigSection.ServerRemotes, 
            []),
        };

    await setServerExecutable(server, storagePath);
    await setServerAddresses(server);

    const commandTask: CommandTaskConfiguration = {
        buildEventStreamProtofile: config.get<string>(ConfigSection.BuildEventStreamProto, 
            asAbsolutePath('./proto/build_event_stream.proto')),
    };

    const cfg: BzlConfiguration = {
        verbose: config.get<number>(ConfigSection.Verbose, 0),
        auth: auth,
        license: license,
        nucleate: nucleate,
        server: server,
        commandTask: commandTask,
    };

    return cfg;
}

export async function setServerExecutable(grpcServer: BzlServerConfiguration, storagePath: string): Promise<any> {
    if (!grpcServer.executable) {
        try {
            grpcServer.executable = await maybeInstallExecutable(grpcServer, path.join(storagePath, BzlFeatureName));
        } catch (err) {
            throw new Error(`could not install bzl ${err}`);
        }
    }
    if (!fs.existsSync(grpcServer.executable)) {
        throw new Error(`could not activate: bzl executable file "${grpcServer.executable}" not found.`);
    }
}

export async function setServerAddresses(server: BzlServerConfiguration): Promise<any> {
    if (!server.address) {
        server.address = `localhost:${await portfinder.getPortPromise({
            port: 8080,
        })}`;
    }
    server.command.push(`${Server.AddressFlag}=${server.address}`);
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

export function loadAuthProtos(protofile: string): AuthProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as AuthProtoType;
}

export function loadNucleateProtos(protofile: string): NucleateProtoType {
    const protoPackage = loader.loadSync(protofile, {
        keepCase: false,
        // longs: String,
        // enums: String,
        defaults: false,
        oneofs: true
    });
    return grpc.loadPackageDefinition(protoPackage) as unknown as NucleateProtoType;
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
export function createAuthServiceClient(proto: AuthProtoType, address: string): AuthServiceClient {
    return new proto.build.stack.auth.v1beta1.AuthService(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the Subscriptions service.
 * 
 * @param address The address to connect.
 */
export function createSubscriptionsClient(proto: NucleateProtoType, address: string): SubscriptionsClient {
    return new proto.build.stack.nucleate.v1beta.Subscriptions(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the Plans service.
 * 
 * @param address The address to connect.
 */
export function createPlansClient(proto: NucleateProtoType, address: string): PlansClient {
    return new proto.build.stack.nucleate.v1beta.Plans(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createLicensesClient(proto: LicenseProtoType, address: string): LicensesClient {
    return new proto.build.stack.license.v1beta1.Licenses(address, getGRPCCredentials(address));
}

export type LabelParts = {
    ws: string,
    pkg: string,
    target: string,
};

export function getLabelAbsolutePath(workspace: Workspace, label: LabelParts) {
    const segments: string[] = [];
    if (label.ws && label.ws !== '@') {
        segments.push(workspace.outputBase!, 'external', label.ws.slice(1));
    } else {
        segments.push(workspace.cwd!);
    }
    if (label.pkg) {
        segments.push(label.pkg);
    }
    if (label.target) {
        segments.push(label.target);
    }
    return path.join(...segments);
}

export function splitLabel(label: string): LabelParts | undefined {
    if (!label) {
        return undefined;
    }
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

/**
 * Installs buildifier from a github release.  If the expected file already
 * exists the download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallExecutable(cfg: BzlServerConfiguration, storagePath: string): Promise<string> {

    const assetName = platformBinaryName(ServerBinaryName);

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

    return executable;
}
