import * as grpc from '@grpc/grpc-js';
import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import { BzlAssetDownloader } from './download';
import path = require('path');
import normalize = require('normalize-path');
import { Settings } from './settings';
import { ProtoGrpcType as BzlProtoType } from '../proto/bzl';
import { ProtoGrpcType as CodesearchProtoType } from '../proto/codesearch';
import { getGRPCCredentials, loadBzlProtos, loadCodesearchProtos } from './proto';
import { ConfigurationContext } from '../common';

/**
 * Configuration for a generic component.
 */
export interface ComponentConfiguration {
  // Boolean flag indicating if the component is enabled
  enabled: boolean;
}

/**
 * Configuration for the bzl server.
 */
export interface BzlConfiguration extends ComponentConfiguration {
  autoLaunch: boolean;
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
  creds: grpc.ChannelCredentials;
  // bzl proto type
  bzpb: BzlProtoType;
  // codesearch proto type
  cspb: CodesearchProtoType;
}

/**
 * Configuration for the license server.
 */
export interface SubscriptionConfiguration extends ComponentConfiguration {
  serverAddress: vscode.Uri;
  token: string | undefined;
}

/**
 * Configuration for the bzl server.
 */
export interface BazelConfiguration extends ComponentConfiguration {
  // path to the bazel executable
  executable: string | undefined;
  // common flags for the build command
  buildFlags: string[];
  // common flags for starlark debugging command
  starlarkDebugFlags: string[];
  // common flags for the test command
  testFlags: string[];
  // common flags for the run command
  runFlags: string[];
}

/**
 * Configuration for the remote cache.
 */
export interface RemoteCacheConfiguration extends ComponentConfiguration {
  autoLaunch: boolean;
  // path to the remote cache executable
  executable: string | undefined;
  // launch command
  command: string[];
  // size of the remote cache, in GB
  maxSizeGb: number;
  // actual bind address for the cache
  address: vscode.Uri;
  // cache directory
  dir: string | undefined;
}

/**
 * Configuration for the bes backend.
 */
export interface BuildEventServiceConfiguration extends ComponentConfiguration {
  // bind address for the gRPC service
  backendAddress: vscode.Uri;
  frontendAddress: vscode.Uri;
}

/**
 * Configuration for codesearch.
 */
export interface CodeSearchConfiguration extends ComponentConfiguration {
  defaultLinesContext: number;
  maxMatches: number;
  foldCase: boolean;
  defaultUseRegexp: boolean;
}

/**
 * Configuration for invocations.
 */
export interface InvocationsConfiguration extends ComponentConfiguration {
  // whether to use the command API for build & test
  invokeWithBuildEventStreaming: boolean;
  buildEventPublishAllActions: boolean;
  hideOutputPanelOnSuccess: boolean;
}

export interface LanguageServerConfiguration extends ComponentConfiguration {
  executable: string;
  command: string[];

  // whether to use codelenses at all
  enableCodelenses: boolean;
  // enable copy
  enableCodelensCopyLabel: boolean;
  // enable codesearch codelenses
  enableCodelensCodesearch: boolean;
  // enable enable UI codelenses
  enableCodelensBrowse: boolean;
  // enable enable debug codelenses
  enableCodelensStarlarkDebug: boolean;
  // enable run codelens
  enableCodelensBuild: boolean;
  // enable run codelens
  enableCodelensTest: boolean;
  // enable run codelens
  enableCodelensRun: boolean;
}

export interface StarlarkDebuggerConfiguration extends ComponentConfiguration {
  autoLaunch: boolean;
  debugAdapterExecutable: string,
  debugAdapterCommand: string[],
  debugAdapterHost: string,
  debugAdapterPort: number,
  debugAdapterVerbosity: number,
  debugServerHost: string | undefined,
  debugServerPort: number | undefined,
}

export class BazelSettings extends Settings<BazelConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string) {
    super(configCtx, section);
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BazelConfiguration> {
    const cfg: BazelConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      executable: config.get<string | undefined>('executable'),
      buildFlags: config.get<string[]>('buildFlags', []),
      testFlags: config.get<string[]>('testFlags', []),
      starlarkDebugFlags: config.get<string[]>('starlarkDebugFlags', [
        '--experimental_skylark_debug',
        '--experimental_skylark_debug_verbose_logging',
      ]),
      runFlags: config.get<string[]>('runFlags', []),
    };
    return cfg;
  }
}

export class InvocationsSettings extends Settings<InvocationsConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private subscription: Settings<SubscriptionConfiguration>) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<InvocationsConfiguration> {
    const cfg: InvocationsConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      invokeWithBuildEventStreaming: config.get<boolean>('invokeWithBuildEventStreaming', true),
      buildEventPublishAllActions: config.get<boolean>('buildEventPublishAllActions', true),
      hideOutputPanelOnSuccess: config.get<boolean>('hideOutputPanelOnSuccess', true),
    };
    const subscription = await this.subscription.get();
    if (!subscription.token) {
      cfg.invokeWithBuildEventStreaming = false;
    }
    return cfg;
  }
}

export class CodeSearchSettings extends Settings<CodeSearchConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<CodeSearchConfiguration> {
    const cfg: CodeSearchConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      maxMatches: config.get<number>('maxMatches', 50),
      foldCase: config.get<boolean>('foldCase', true),
      defaultLinesContext: config.get<number>('defaultLinesContext', 3),
      defaultUseRegexp: config.get<boolean>('defaultUseRegexp', false),
    };
    return cfg;
  }
}

export class StarlarkDebuggerSettings extends Settings<StarlarkDebuggerConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private bzl: BzlSettings) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<StarlarkDebuggerConfiguration> {
    const cfg: StarlarkDebuggerConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      autoLaunch: config.get<boolean>('autoLaunch', false),
      debugAdapterExecutable: config.get<string>('debugAdapterExecutable', ''),
      debugAdapterCommand: config.get<string[]>('debugAdapterCommand', ['debug', 'adapter']),
      debugAdapterHost: config.get<string>('debugAdapterHost', 'localhost'),
      debugAdapterPort: config.get<number>('debugAdapterPort', 4711),
      debugAdapterVerbosity: config.get<number>('debugServerVerbosity', 1),
      debugServerHost: config.get<string | undefined>('debugServerHost'),
      debugServerPort: config.get<number | undefined>('debugServerPort'),
    };

    if (!cfg.debugAdapterExecutable) {
      const bzl = await this.bzl.get();
      cfg.debugAdapterExecutable = bzl.executable;
    }

    return cfg;
  }
}

export class BzlSettings extends Settings<BzlConfiguration> {
  constructor(
    configCtx: ConfigurationContext,
    section: string,
    private ctx: vscode.ExtensionContext,
    private bazel: Settings<BazelConfiguration>
  ) {
    super(configCtx, section);
    this.disposables.push(bazel.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BzlConfiguration> {
    const bazel = await this.bazel.get();
    const address = vscode.Uri.parse(config.get<string>('address', 'grpc://localhost:8086'));
    const cfg: BzlConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      autoLaunch: config.get<boolean>('autoLaunch', true),
      downloadBaseURL: config.get<string>('downloadBaseUrl', 'https://get.bzl.io'),
      release: config.get<string>('release', 'v1.4.9'),
      executable: normalize(config.get<string>('executable', '')),
      address: address,
      command: config.get<string[]>('command', ['serve', '--address=${address}']),
      creds: getGRPCCredentials(address.authority),
      bzpb: loadBzlProtos(this.configCtx.protoFile('bzl.proto').fsPath),
      cspb: loadCodesearchProtos(this.configCtx.protoFile('codesearch.proto').fsPath),
    };
    if (!cfg.executable) {
      await setServerExecutable(this.ctx, cfg);
    }
    return cfg;
  }
}

export class SubscriptionSettings extends Settings<SubscriptionConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private ctx: vscode.ExtensionContext) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<SubscriptionConfiguration> {
    const cfg: SubscriptionConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      serverAddress: vscode.Uri.parse(
        config.get<string>('serverAddress', 'grpcs://accounts.bzl.io:443')
      ),
      token: config.get<string | undefined>('token'),
    };
    if (!cfg.token) {
      const legacy = vscode.workspace.getConfiguration('bsv.bzl.license');
      cfg.token = legacy.get<string | undefined>('token');
    }
    await setAccountToken(this.ctx, cfg);
    return cfg;
  }
}

export class RemoteCacheSettings extends Settings<RemoteCacheConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private bzl: Settings<BzlConfiguration>) {
    super(configCtx, section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<RemoteCacheConfiguration> {
    const cfg: RemoteCacheConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      address: vscode.Uri.parse(config.get<string>('address', 'grpc://localhost:2020')),
      command: config.get<string[]>('command', ['cache']),
      dir: config.get<string | undefined>('dir', undefined),
      executable: config.get<string | undefined>('executable'),
      maxSizeGb: config.get<number>('maxSizeGb', 10),
      autoLaunch: config.get<boolean>('autoLaunch', true),
    };
    if (!cfg.executable) {
      const bzl = await this.bzl.get();
      cfg.executable = bzl.executable;
    }
    cfg.executable = normalize(cfg.executable);
    return cfg;
  }
}

export class BuildEventServiceSettings extends Settings<BuildEventServiceConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private bzl: Settings<BzlConfiguration>) {
    super(configCtx, section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<BuildEventServiceConfiguration> {
    const addr = config.get<string | undefined>('address');
    if (addr) {
      return {
        enabled: config.get<boolean>('enabled', true),
        backendAddress: vscode.Uri.parse(`grpc://${addr}`),
        frontendAddress: vscode.Uri.parse(`http://${addr}/pipeline`),
      };
    } else {
      const bzl = await this.bzl.get();
      return {
        enabled: config.get<boolean>('enabled', true),
        backendAddress: bzl.address,
        frontendAddress: vscode.Uri.parse(`http://${bzl.address.authority}/pipeline`),
      };
    }
  }
}

export class LanguageServerSettings extends Settings<LanguageServerConfiguration> {
  constructor(
    configCtx: ConfigurationContext,
    section: string,
    private bzl: Settings<BzlConfiguration>,
    private subscription: Settings<SubscriptionConfiguration>
  ) {
    super(configCtx, section);
    this.disposables.push(bzl.onDidConfigurationChange(() => this.reconfigure.bind(this)));
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<LanguageServerConfiguration> {
    const bzl = await this.bzl.get();

    const cfg: LanguageServerConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      executable: bzl.executable,
      command: config.get<string[]>('command', ['lsp', 'serve', '--log_level=info']),
      enableCodelenses: config.get<boolean>('enableCodelenses', true),
      enableCodelensCopyLabel: config.get<boolean>('enableCodelensCopyLabel', true),
      enableCodelensCodesearch: config.get<boolean>('enableCodelensCodesearch', true),
      enableCodelensBrowse: config.get<boolean>('enableCodelensBrowse', true),
      enableCodelensStarlarkDebug: config.get<boolean>('enableCodelensStarlarkDebug', true),
      enableCodelensBuild: config.get<boolean>('enableCodelensBuild', true),
      enableCodelensTest: config.get<boolean>('enableCodelensTest', true),
      enableCodelensRun: config.get<boolean>('enableCodelensRun', true),
    };

    cfg.command.push(`--address=${bzl.address}`);

    const subscription = await this.subscription.get();
    if (!subscription.token) {
      cfg.enableCodelensCodesearch = false;
      cfg.enableCodelensBrowse = false;
    }

    return cfg;
  }
}

export async function setAccountToken(
  ctx: vscode.ExtensionContext,
  subscription: SubscriptionConfiguration
): Promise<void> {
  if (subscription.token) {
    return;
  }
  const uri = getLicenseFileURI();
  if (!fs.existsSync(uri.fsPath)) {
    return;
  }
  const token = fs.readFileSync(uri.fsPath);
  subscription.token = token.toString().trim();
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
    server.executable = normalize(fileUri.fsPath);
  } catch (e) {
    throw new Error(`could not install bzl: ${e instanceof Error ? e.message : e}`);
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
