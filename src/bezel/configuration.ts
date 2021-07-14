import * as grpc from '@grpc/grpc-js';
import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import { ConfigSection } from './constants';
import { BzlAssetDownloader } from './download';
import path = require('path');
import { Settings } from './settings';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as CodesearchProtoType } from '../proto/codesearch';
import { getGRPCCredentials, loadBzlProtos, loadCodesearchProtos } from './proto';
import { Container } from '../container';
import { Workspace } from '../proto/build/stack/bezel/v1beta1/Workspace';
import { assertIsDefined } from 'vscode-common/out/types';

/**
 * Configuration for the bzl server.
 */
export type BzlConfiguration = {
  // Download specs
  release: string;
  // Base URL for bzl downloads
  downloadBaseURL: string;
  // Path to binary
  executable: string;
  // Address for server
  address: vscode.Uri;
  // launch command
  command: string[];
  // channel credentials
  _creds: grpc.ChannelCredentials;
  // bzl proto type
  _bzpb: BzlProtoType;
  // codesearch proto type
  _cspb: CodesearchProtoType;
  // the representative workspace
  _ws: Workspace;
};

/**
 * Configuration for the license server.
 */
export type AccountConfiguration = {
  serverAddress: vscode.Uri;
  token: string;
};

/**
 * Configuration for the bzl server.
 */
export type BazelConfiguration = {
  // path to the bazel executable
  executable: string | undefined;
  // common flags for the build command
  buildFlags: string[];
  // common flags for the test command
  testFlags: string[];
  // common flags for the run command
  runFlags: string[];
  // common flags for the starlark debugger command
  starlarkDebuggerFlags: string[];
};

/**
 * Configuration for the remote cache.
 */
export type RemoteCacheConfiguration = {
  // path to the remote cache executable
  executable: string | undefined;
  // launch command
  command: string[];
  // size of the remote cache, in GB
  maxSizeGb: number;
  // actual bind address for the cache
  address: string;
  // cache directory
  dir: string | undefined;
};


/**
 * Configuration for the bes backend.
 */
 export type BuildEventServiceConfiguration = {
  // bind address for the service
  address: vscode.Uri;
};

/**
 * Configuration for the bezel codelenses.
 */
export type BazelCodeLensConfiguration = {
  // whether to use codelenses at all
  enableCodeLens?: boolean;
  // use BEP-style invocations for build
  enableBuildEventProtocol?: boolean;
  // enable codesearch codelenses
  enableCodesearch?: boolean;
  // enable enable UI codelenses
  enableUI?: boolean;
  // enable enable debug codelenses
  enableStarlarkDebug?: boolean;
  // enable run codelens
  enableBuild?: boolean;
  // enable run codelens
  enableTest?: boolean;
  // enable run codelens
  enableRun?: boolean;
};

export type LanguageServerConfiguration = {
  executable: string,
  command: string[],
}


export class BazelSettings extends Settings<BazelConfiguration> {
  constructor(section: string) {
    super(section);
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BazelConfiguration> {
    return {
      executable: config.get<string | undefined>(ConfigSection.BazelExecutable, undefined),
      buildFlags: config.get<string[]>(ConfigSection.BazelBuildFlags, []),
      testFlags: config.get<string[]>(ConfigSection.BazelTestFlags, []),
      runFlags: config.get<string[]>(ConfigSection.BazelRunFlags, []),
      starlarkDebuggerFlags: config.get<string[]>(ConfigSection.BazelStarlarkDebuggerFlags, [
        '--experimental_skylark_debug',
        '--experimental_skylark_debug_server_port=7300',
        '--experimental_skylark_debug_verbose_logging=true',
      ]),
    }
  }
}

export class BzlSettings extends Settings<BzlConfiguration> {
  constructor(private ctx: vscode.ExtensionContext, private cwd: string, private bazel: BazelSettings, section: string) {
    super(section);
    this.disposables.push(bazel.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const bazel = await this.bazel.get();
    const address = vscode.Uri.parse(config.get<string>('address', 'grpc://localhost:8080'));
    const cfg: BzlConfiguration = {
      downloadBaseURL: config.get<string>('downloadBaseUrl', 'https://get.bzl.io'),
      release: config.get<string>('release', 'v0.9.16'),
      executable: config.get<string>('executable', ''),
      address: address,
      command: config.get<string[]>('command', ['serve', '--vscode', '--address='+address]),
      _creds: getGRPCCredentials(address.authority),
      _bzpb: loadBzlProtos(Container.protofile('bzl.proto').fsPath),
      _cspb: loadCodesearchProtos(Container.protofile('codesearch.proto').fsPath),
      _ws: {
        bazelBinary: bazel.executable,
        cwd: this.cwd,
      }  
    };
    if (!cfg.executable) {
      await setServerExecutable(this.ctx, cfg);
    }
    return cfg;
  }
}

export class AccountSettings extends Settings<AccountConfiguration> {
  constructor(private ctx: vscode.ExtensionContext, section: string) {
    super(section);
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<AccountConfiguration> {
    const cfg = {
      serverAddress: vscode.Uri.parse(config.get<string>(ConfigSection.AccountServerAddress, 'grpcs://accounts.bzl.io:443')),
      token: config.get<string>(ConfigSection.AccountAuthToken, ''),
    };
    await setAccountToken(this.ctx, cfg);
    return cfg;
  }
}

export class RemoteCacheSettings extends Settings<RemoteCacheConfiguration> {
  constructor(private bzl: BzlSettings, section: string) {
    super(section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<RemoteCacheConfiguration> {
    const cfg = {
      address: config.get<string>('address', 'grpc://localhost:2020'),
      command: config.get<string[]>('command', ['cache']),
      dir: config.get<string|undefined>('dir', undefined),
      executable: config.get<string | undefined>('executable'),
      maxSizeGb: config.get<number>('maxSizeGb', 10),
    };
    if (!cfg.executable) {
      const bzl = await this.bzl.get();
      cfg.executable = bzl.executable;
    } 
    return cfg;
  }
}


export class BuildEventServiceSettings extends Settings<BuildEventServiceConfiguration> {
  constructor(private bzl: BzlSettings, section: string) {
    super(section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BuildEventServiceConfiguration> {
    const addr = config.get<string|undefined>('address');
    if (addr) {
      return { address: vscode.Uri.parse(addr) };
    } else {
      const bzl = await this.bzl.get();
      return { address: bzl.address };
    }
  }
}

export class CodeLensSettings extends Settings<BazelCodeLensConfiguration> {
  constructor(private account: AccountSettings, section: string) {
    super(section);
    assertIsDefined(account);
    this.disposables.push(account.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BazelCodeLensConfiguration> {
    const cfg = {
      enableCodeLens: config.get<boolean>(ConfigSection.StarlarkCodeLensEnabled, true),
      enableBuildEventProtocol: config.get<boolean>(ConfigSection.StarlarkCodeLensBepEnabled, true),
      enableCodesearch: config.get<boolean>(ConfigSection.StarlarkCodeLensCodesearchEnabled, true),
      enableUI: config.get<boolean>(ConfigSection.StarlarkCodeLensUIEnabled, true),
      enableStarlarkDebug: config.get<boolean>(ConfigSection.StarlarkCodeLensDebugStarlarkEnabled, true),
      enableBuild: true,
      enableTest: true,
      enableRun: true,
    };
    const account = await this.account.get();
      // if the bzl account token is not available, disable bezel features
    if (!account.token) {
      cfg.enableBuildEventProtocol = false;
      cfg.enableCodesearch = false;
      cfg.enableUI = false;
    }

    return cfg;
  }
}

export class LanguageServerSettings extends Settings<LanguageServerConfiguration> {
  constructor(private bzl: BzlSettings, private remoteCache: RemoteCacheSettings, section: string) {
    super(section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
    this.disposables.push(remoteCache.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<LanguageServerConfiguration> {
    const bzl = await this.bzl.get();
    const remoteCache = await this.remoteCache.get();

    const command = config.get<string[]>('command', []);

    // command.push('--address=' + bzl.address);

    if (remoteCache.address) {
      // try {
      //   // const reClient = RemoteCacheClient.fromAddress(remoteCache.address);
      //   // await reClient.getServerCapabilities();  
      //   // if we get here, assume the cache is already running, don't try and
      //   // start a new one.
      //   // console.log(`remote cache ${remoteCache.address} is already running`);
      // } catch (ex) {
      //   // assume cache is not running.  In this case add arguments to start the cache
      //   command.push('--remote_cache=' + remoteCache.address);
      //   if (remoteCache.maxSizeGb) {
      //     command.push('--remote_cache_size_gb=' + remoteCache.maxSizeGb);
      //   }
      //   if (remoteCache.dir) {
      //     command.push('--remote_cache_dir=' + remoteCache.dir);
      //   }  
      // }
    }
    
    return {
      executable: bzl.executable,
      command: command,
    };

  }
}

export async function setAccountToken(
  ctx: vscode.ExtensionContext,
  account: AccountConfiguration
): Promise<void> {
  if (account.token) {
    return;
  }
  const uri = getLicenseFileURI();
  if (!fs.existsSync(uri.fsPath)) {
    return;
  }
  const token = fs.readFileSync(uri.fsPath);
  account.token = token.toString().trim();
}

export function getLicenseFileURI(ext: string = ''): vscode.Uri {
  const homedir = require('os').homedir();
  const name = 'license.key' + ext;
  return vscode.Uri.file(path.join(homedir, '.bzl', name));
}

export async function writeLicenseFile(token: string): Promise<void> {
  const uri = getLicenseFileURI();
  if (fs.existsSync(uri.fsPath)) {
    const backup = getLicenseFileURI('.' + Date.now());
    fs.copyFileSync(uri.fsPath, backup.fsPath);
  }
  fs.writeFileSync(uri.fsPath, token);
}

export async function setServerExecutable(
  ctx: vscode.ExtensionContext,
  server: BzlConfiguration
): Promise<any> {
  try {
    const fileUri = await maybeInstallExecutable(ctx, server);
    server.executable = fileUri.fsPath;
  } catch (err) {
    throw new Error(`could not install bzl: ${err.message}`);
  }
  if (!fs.existsSync(server.executable)) {
    throw new Error(`could not activate: bzl executable file "${server.executable}" not found.`);
  }
}

/**
 * Installs bzl.  If the expected file already exists the
 * download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallExecutable(
  ctx: vscode.ExtensionContext,
  cfg: BzlConfiguration
): Promise<vscode.Uri> {
  const cancellationTokenSource = new vscode.CancellationTokenSource();
  const cancellationToken = cancellationTokenSource.token;
  const downloader = await BzlAssetDownloader.fromConfiguration(cfg);
  const mode = 0o755;
  return downloader.getOrDownloadFile(ctx, mode, cancellationToken);
}


// /**
//  * Configuration for the Bezel feature.
//  */
//  export type BezelConfiguration = {
//   bzl: BzlConfiguration;
//   bazel: BazelConfiguration;
//   codelens: BazelCodeLensConfiguration;
//   account: AccountConfiguration;
//   remoteCache: RemoteCacheConfiguration;
// };


// export async function createBezelConfiguration(
//   ctx: vscode.ExtensionContext,
//   config: vscode.WorkspaceConfiguration
// ): Promise<BezelConfiguration> {
//   const cfg: BezelConfiguration = {
//     bzl: {
//       downloadBaseURL: config.get<string>(ConfigSection.BzlDownloadBaseUrl, 'https://get.bzl.io'),
//       release: config.get<string>(ConfigSection.BzlRelease, 'v0.9.14'),
//       executable: config.get<string>(ConfigSection.BzlExecutable, ''),
//       address: config.get<string>(ConfigSection.BzlAddress, 'localhost:2774'),
//       command: config.get<string[]>(ConfigSection.BzlCommand, []),
//     },
//     bazel: {
//       executable: config.get<string | undefined>(ConfigSection.BazelExecutable, undefined),
//       buildFlags: config.get<string[]>(ConfigSection.BazelBuildFlags, []),
//       testFlags: config.get<string[]>(ConfigSection.BazelTestFlags, []),
//       runFlags: config.get<string[]>(ConfigSection.BazelRunFlags, []),
//       starlarkDebuggerFlags: config.get<string[]>(ConfigSection.BazelStarlarkDebuggerFlags, [
//         '--experimental_skylark_debug',
//         '--experimental_skylark_debug_server_port=7300',
//         '--experimental_skylark_debug_verbose_logging=true',
//       ]),
//     },
//     codelens: {
//       enableCodeLens: config.get<boolean>(ConfigSection.StarlarkCodeLensEnabled, true),
//       enableBuildEventProtocol: config.get<boolean>(ConfigSection.StarlarkCodeLensBepEnabled, true),
//       enableCodesearch: config.get<boolean>(ConfigSection.StarlarkCodeLensCodesearchEnabled, true),
//       enableUI: config.get<boolean>(ConfigSection.StarlarkCodeLensUIEnabled, true),
//       enableStarlarkDebug: config.get<boolean>(ConfigSection.StarlarkCodeLensDebugStarlarkEnabled, true),
//       enableBuild: true,
//       enableTest: true,
//       enableRun: true,
//     },
//     account: {
//       serverAddress: config.get<string>(ConfigSection.AccountServerAddress, 'accounts.bzl.io:443'),
//       token: config.get<string>(ConfigSection.AccountAuthToken, ''),
//     },
//     remoteCache: {
//       address: config.get<string>(ConfigSection.RemoteCacheAddress, 'grpc://localhost:2020'),
//       command: config.get<string[]>(ConfigSection.RemoteCacheCommand, ["cache"]),
//       dir: config.get<string>(ConfigSection.RemoteCacheDir, ''),
//       executable: config.get<string | undefined>(ConfigSection.RemoteCacheExecutable),
//       maxSizeGb: config.get<number>(ConfigSection.RemoteCacheSizeGb, 10),
//     },
//   };

//   await setServerExecutable(ctx, cfg.bzl);
//   await setAccountToken(ctx, cfg.account);

//   if (!cfg.remoteCache.executable) {
//     cfg.remoteCache.executable = cfg.bzl.executable;
//   }

//   // if the bzl account token is not available, disable bezel features
//   if (!cfg.account.token) {
//     cfg.codelens.enableBuildEventProtocol = false;
//     cfg.codelens.enableCodesearch = false;
//     cfg.codelens.enableUI = false;
//     // config.update(ConfigSection.StarlarkCodeLensBepEnabled, false);
//     // config.update(ConfigSection.StarlarkCodeLensCodesearchEnabled, false);
//     // config.update(ConfigSection.StarlarkCodeLensUIEnabled, false);
//   }

//   return cfg;
// }
