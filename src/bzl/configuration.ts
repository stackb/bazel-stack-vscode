import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { GitHubReleaseAssetDownloader } from '../download';
import { ProtoGrpcType as AuthProtoType } from '../proto/auth';
import { AuthServiceClient } from '../proto/build/stack/auth/v1beta1/AuthService';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import { CommandServiceClient } from '../proto/build/stack/bezel/v1beta1/CommandService';
import { ExternalWorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { HistoryClient } from '../proto/build/stack/bezel/v1beta1/History';
import { PackageServiceClient } from '../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { LicensesClient } from '../proto/build/stack/license/v1beta1/Licenses';
import { PlansClient } from '../proto/build/stack/nucleate/v1beta/Plans';
import { SubscriptionsClient } from '../proto/build/stack/nucleate/v1beta/Subscriptions';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as LicenseProtoType } from '../proto/license';
import { ProtoGrpcType as NucleateProtoType } from '../proto/nucleate';
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
    grpcServer: BzlGrpcServerConfiguration,
    httpServer: BzlHttpServerConfiguration,
    commandTask: CommandTaskConfiguration,
};

/**
 * Configuration that affect the behavior of tasks launched the the command server.
 */
export type CommandTaskConfiguration = {
    // a mapping of ruleClass -> problemMatcher names
    ruleClassMatchers: Map<string, string[]>,
    // the build_event_stream.proto file
    buildEventStreamProtofile: string,
};

interface RuleClassMatcherConfig {
    rules: string[],
    matchers: string[],
}


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
    const license: LicenseServerConfiguration = {
        protofile: config.get<string>('license.proto', './proto/license.proto'),
        address: config.get<string>('accounts.address', 'accounts.bzl.io:443'),
        token: config.get<string>('license.token', ''),
        githubOAuthRelayUrl: config.get<string>('oauth.github.relay', 'https://build.bzl.io/github_login'),
    };
    if (license.protofile.startsWith('./')) {
        license.protofile = asAbsolutePath(license.protofile);
    }

    const auth = {
        protofile: config.get<string>('auth.proto', './proto/auth.proto'),
        address: config.get<string>('accounts.address', 'accounts.bzl.io:443'),
    };
    if (auth.protofile.startsWith('./')) {
        auth.protofile = asAbsolutePath(auth.protofile);
    }

    const nucleate = {
        protofile: config.get<string>('nucleate.proto', './proto/nucleate.proto'),
        address: config.get<string>('accounts.address', 'accounts.bzl.io:443'),
    };
    if (nucleate.protofile.startsWith('./')) {
        nucleate.protofile = asAbsolutePath(nucleate.protofile);
    }

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

    const cfg: BzlConfiguration = {
        verbose: config.get<number>('verbose', 0),
        auth: auth,
        license: license,
        nucleate: nucleate,
        grpcServer: grpcServer,
        httpServer: httpServer,
        commandTask: makeCommandTaskConfiguration(config.get<RuleClassMatcherConfig[]>('problemMatchers')),
    };

    cfg.commandTask.buildEventStreamProtofile = config.get<string>('build_event_stream.proto', asAbsolutePath('./proto/build_event_stream.proto'));
    
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
        grpcServer.address = `localhost:${await portfinder.getPortPromise({
            port: 1080,
        })}`;
    }
    if (!httpServer.address) {
        httpServer.address = `localhost:${await portfinder.getPortPromise({
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


/**
 * Create a new client for the Application service.
 * 
 * @param address The address to connect.
 */
export function createApplicationServiceClient(proto: BzlProtoType, address: string): ApplicationServiceClient {
    return new proto.build.stack.bezel.v1beta1.ApplicationService(address, getGRPCCredentials(address), {
        'grpc.initial_reconnect_backoff_ms': 200,
    });
}


/**
 * Create a new client for the Workspace service.
 * 
 * @param address The address to connect.
 */
export function createWorkspaceServiceClient(proto: BzlProtoType, address: string): WorkspaceServiceClient {
    return new proto.build.stack.bezel.v1beta1.WorkspaceService(address, getGRPCCredentials(address));
}


/**
 * Create a new client for the Package service.
 * 
 * @param address The address to connect.
 */
export function createPackageServiceClient(proto: BzlProtoType, address: string): PackageServiceClient {
    return new proto.build.stack.bezel.v1beta1.PackageService(address, getGRPCCredentials(address));
}


/**
 * Create a new client for the External Workspace service.
 * 
 * @param address The address to connect.
 */
export function createExternalWorkspaceServiceClient(proto: BzlProtoType, address: string): ExternalWorkspaceServiceClient {
    return new proto.build.stack.bezel.v1beta1.ExternalWorkspaceService(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the Command service.
 * 
 * @param address The address to connect.
 */
export function createCommandServiceClient(proto: BzlProtoType, address: string): CommandServiceClient {
    return new proto.build.stack.bezel.v1beta1.CommandService(address, getGRPCCredentials(address));
}

/**
 * Create a new client for the command History service.
 * 
 * @param address The address to connect.
 */
export function createHistoryClient(proto: BzlProtoType, address: string): HistoryClient {
    return new proto.build.stack.bezel.v1beta1.History(address, getGRPCCredentials(address));
}

export type LabelParts = {
    ws: string,
    pkg: string,
    target: string,
};

export function getLabelAbsolutePath(workspace: Workspace, label: LabelParts) {
    const segments: string[] = [];
    if (label.ws && label.ws !== '@') {
        segments.push(workspace.outputBase!, 'external', label.ws);
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

function makeCommandTaskConfiguration(mappings: RuleClassMatcherConfig[] | undefined): CommandTaskConfiguration {
    const map = new Map<string, string[]>();
    if (mappings) {
        for (const item of mappings) {
            if (!item) {
                continue;
            }
            if (!(Array.isArray(item.rules) && Array.isArray(item.matchers))) {
                continue;
            }
            for (const rule of item.rules) {
                map.set(rule, item.matchers);
            }
        }
    }
    return { ruleClassMatchers: map, buildEventStreamProtofile: '' };
}