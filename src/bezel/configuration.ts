import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import { ConfigSection } from './constants';
import { BzlAssetDownloader } from './download';
import path = require('path');

/**
 * Configuration for the Bezel feature.
 */
export type BezelConfiguration = {
  bzl: BzlConfiguration;
  bazel: BazelConfiguration;
  codelens: BazelCodeLensConfiguration;
  account: AccountConfiguration;
  remoteCache: RemoteCacheConfiguration;
};

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
  address: string;
  // launch command
  command: string[];
};

/**
 * Configuration for the license server.
 */
export type AccountConfiguration = {
  serverAddress: string;
  token: string;
};

/**
 * Configuration for the bzl server.
 */
export type BazelConfiguration = {
  // path to the bazel executable
  executable: string;
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
 * Configuration for the bzl server.
 */
export type RemoteCacheConfiguration = {
  // size of the remote cache, in GB
  maxSizeGb: number;
  // preferred bind address for the cache
  preferredPort: number;
  // actual bind address for the cache
  address: string;
  // cache directory
  dir: string;
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

export async function createBezelConfiguration(
  ctx: vscode.ExtensionContext,
  config: vscode.WorkspaceConfiguration
): Promise<BezelConfiguration> {
  const cfg: BezelConfiguration = {
    bzl: {
      downloadBaseURL: config.get<string>(ConfigSection.BzlDownloadBaseUrl, 'https://get.bzl.io'),
      release: config.get<string>(ConfigSection.BzlRelease, 'v0.9.13'),
      executable: config.get<string>(ConfigSection.BzlExecutable, ''),
      address: config.get<string>(ConfigSection.BzlAddress, 'localhost:2774'),
      command: config.get<string[]>(ConfigSection.BzlCommand, []),
    },
    bazel: {
      executable: config.get<string>(ConfigSection.BazelExecutable, 'bazel'),
      buildFlags: config.get<string[]>(ConfigSection.BazelBuildFlags, []),
      testFlags: config.get<string[]>(ConfigSection.BazelTestFlags, []),
      runFlags: config.get<string[]>(ConfigSection.BazelRunFlags, []),
      starlarkDebuggerFlags: config.get<string[]>(ConfigSection.BazelStarlarkDebuggerFlags, [
        '--experimental_skylark_debug',
        '--experimental_skylark_debug_server_port=7300',
        '--experimental_skylark_debug_verbose_logging=true',
      ]),
    },
    codelens: {
      enableCodeLens: config.get<boolean>(ConfigSection.CodeLensEnabled, true),
      enableBuildEventProtocol: config.get<boolean>(ConfigSection.CodeLensBepEnabled, true),
      enableCodesearch: config.get<boolean>(ConfigSection.CodeLensCodesearchEnabled, true),
      enableUI: config.get<boolean>(ConfigSection.CodeLensUIEnabled, true),
      enableStarlarkDebug: config.get<boolean>(ConfigSection.CodeLensDebugStarlarkEnabled, true),
      enableBuild: true,
      enableTest: true,
      enableRun: true,
    },
    account: {
      serverAddress: config.get<string>(ConfigSection.AccountServerAddress, 'accounts.bzl.io:443'),
      token: config.get<string>(ConfigSection.AccountToken, ''),
    },
    remoteCache: {
      address: config.get<string>(ConfigSection.RemoteCacheAddress, 'grpc://localhost:2773'),
      preferredPort: config.get<number>(ConfigSection.RemoteCachePreferredPort, 2773),
      maxSizeGb: config.get<number>(ConfigSection.RemoteCacheSizeGb, 10),
      dir: config.get<string>(ConfigSection.RemoteCacheDir, ''),
    },
  };

  await setServerExecutable(ctx, cfg.bzl);
  await setAccountToken(ctx, cfg.account);

  // if the bzl account token is not available, disable bezel features
  if (!cfg.account.token) {
    cfg.codelens.enableBuildEventProtocol = false;
    cfg.codelens.enableCodesearch = false;
    cfg.codelens.enableUI = false;
  }

  return cfg;
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
  if (!server.executable) {
    try {
      const fileUri = await maybeInstallExecutable(ctx, server);
      server.executable = fileUri.fsPath;
    } catch (err) {
      throw new Error(`could not install bzl ${err}`);
    }
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
