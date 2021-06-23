import * as fs from 'graceful-fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { ConfigSection, Server } from './constants';
import portfinder = require('portfinder');

/**
 * Configuration for the Bzl feature.
 */
export type BzlConfiguration = {
  verbose: number;
  auth: AuthServerConfiguration;
  license: LicenseServerConfiguration;
  nucleate: NucleateServerConfiguration;
  server: BzlServerConfiguration;
  commandTask: CommandTaskConfiguration;
  codesearch: CodesearchConfiguration;
};

/**
 * Configuration that affect the behavior of tasks launched the the command
 * server.
 */
export type CommandTaskConfiguration = {
  // the build_event_stream.proto file
  buildEventStreamProtofile: string;
  // a bazel executable to use as override of bazelisk mechanism
  bazelExecutable: string;
  // a bazel version to use as override of bazelisk mechanism
  bazelVersion: string;
};

/**
 * Configuration for the license server integration.
 */
export type LicenseServerConfiguration = {
  // filename of the license.proto file.
  protofile: string;
  // address of the license server
  address: string;
  // the value of the current license token
  token: string;
  // address of the oauth-relay endpoint
  githubOAuthRelayUrl: string;
};

/**
 * Configuration for the codesearch server integration.
 */
export type CodesearchConfiguration = {
  // filename of the codesearch.proto file.
  codesearchProtofile: string;
  // filename of the livegrep.proto file.
  livegrepProtofile: string;
  // default query
  defaultQuery: string;
};

/**
 * Configuration for the auth server integration.
 */
export type AuthServerConfiguration = {
  // filename of the license.proto file.
  protofile: string;
  // address of the license server
  address: string;
};

/**
 * Configuration for the nucleate server integration.
 */
export type NucleateServerConfiguration = {
  // filename of the nucleate.proto file.
  protofile: string;
  // address of the nucleate server
  address: string;
};

/**
 * Configuration for the bzl server.
 */
export type BzlServerConfiguration = {
  // filename of the bzl.proto file.
  protofile: string;
  // address of the bzl server
  address: string;
  // addresses of additional remote servers
  remotes: string[];
  // Download specs
  releaseTag: string;
  // Path to binary
  executable: string;
  // launch command
  command: string[];
};

export async function createBzlConfiguration(
  ctx: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration
): Promise<BzlConfiguration> {
  const license: LicenseServerConfiguration = {
    protofile: config.get<string>(
      ConfigSection.LicenseProto,
      ctx.asAbsolutePath('./proto/license.proto')
    ),
    address: config.get<string>(ConfigSection.AccountsAddress, 'accounts.bzl.io:443'),
    token: config.get<string>(ConfigSection.LicenseToken, ''),
    githubOAuthRelayUrl: config.get<string>(
      ConfigSection.OAuthGithubRelay,
      'https://bzl.io/github_login'
    ),
  };

  const auth: AuthServerConfiguration = {
    protofile: config.get<string>(
      ConfigSection.AuthProto,
      ctx.asAbsolutePath('./proto/auth.proto')
    ),
    address: config.get<string>(ConfigSection.AccountsAddress, 'accounts.bzl.io:443'),
  };

  const nucleate: NucleateServerConfiguration = {
    protofile: config.get<string>(
      ConfigSection.NucleateProto,
      ctx.asAbsolutePath('./proto/nucleate.proto')
    ),
    address: config.get<string>(ConfigSection.AccountsAddress, 'accounts.bzl.io:443'),
  };

  const server: BzlServerConfiguration = {
    protofile: config.get<string>(
      ConfigSection.ServerProto,
      ctx.asAbsolutePath('./proto/bzl.proto')
    ),
    address: config.get<string>(ConfigSection.ServerAddress, ''),
    releaseTag: config.get<string>(ConfigSection.ServerGithubRelease, 'v0.9.12'),
    executable: config.get<string>(ConfigSection.ServerExecutable, ''),
    command: config.get<string[]>(ConfigSection.ServerCommand, ['serve', '--vscode']),
    remotes: config.get<string[]>(ConfigSection.ServerRemotes, []),
  };

  const codesearch: CodesearchConfiguration = {
    codesearchProtofile: config.get<string>(
      ConfigSection.CodesearchProto,
      ctx.asAbsolutePath('./proto/codesearch.proto')
    ),
    livegrepProtofile: config.get<string>(
      ConfigSection.LivegrepProto,
      ctx.asAbsolutePath('./proto/livegrep.proto')
    ),
    defaultQuery: config.get<string>(ConfigSection.CodesearchDefaultQuery, 'deps(//...)'),
  };

  const commandTask: CommandTaskConfiguration = {
    buildEventStreamProtofile: config.get<string>(
      ConfigSection.BuildEventStreamProto,
      ctx.asAbsolutePath('./proto/build_event_stream.proto')
    ),
    bazelExecutable: config.get<string>(ConfigSection.BazelExecutable, 'bazel'),
    bazelVersion: config.get<string>(ConfigSection.BazelVersion, ''),
  };

  const cfg: BzlConfiguration = {
    verbose: config.get<number>(ConfigSection.Verbose, 0),
    auth: auth,
    license: license,
    nucleate: nucleate,
    server: server,
    commandTask: commandTask,
    codesearch: codesearch,
  };

  await setServerExecutable(ctx, server);
  await setServerAddresses(server);

  return cfg;
}

export async function setServerExecutable(
  ctx: vscode.ExtensionContext,
  grpcServer: BzlServerConfiguration
): Promise<any> {
  // if (!grpcServer.executable) {
  //     try {
  //         const fileUri = await maybeInstallExecutable(ctx, grpcServer);
  //         grpcServer.executable = fileUri.fsPath;
  //     } catch (err) {
  //         throw new Error(`could not install bzl ${err}`);
  //     }
  // }
  if (!fs.existsSync(grpcServer.executable)) {
    throw new Error(
      `could not activate: bzl executable file "${grpcServer.executable}" not found.`
    );
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

// /**
//  * Installs bzl.  If the expected file already exists the
//  * download operation is skipped.
//  *
//  * @param cfg The configuration
//  * @param storagePath The directory where the binary should be installed
//  */
//  export async function maybeInstallExecutable(ctx: vscode.ExtensionContext, cfg: BzlServerConfiguration): Promise<vscode.Uri> {
//     const cancellationTokenSource = new vscode.CancellationTokenSource();
//     const cancellationToken = cancellationTokenSource.token;
//     // const downloader = await BzlIoReleaseAssetDownloader.fromConfiguration(cfg);
//     // return downloader.getOrDownloadFile(ctx, 0, cancellationToken);
// }

export type LabelParts = {
  ws: string;
  pkg: string;
  target: string;
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
