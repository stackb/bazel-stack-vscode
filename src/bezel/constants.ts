import * as vscode from 'vscode';

export enum ConfigSection {
  BzlDownloadBaseUrl = 'downloadBaseUrl',
  BzlRelease = 'release',
  BzlExecutable = 'executable',
  BzlAddress = 'address',
  BzlCommand = 'command',
  BazelExecutable = 'bazelExecutable',
  BazelBuildFlags = 'buildFlags',
  BazelTestFlags = 'testFlags',
  BazelRunFlags = 'runFlags',
  BazelStarlarkDebuggerFlags = 'starlarkDebuggerFlags',
  CodeLensEnabled = 'codelens.enabled',
  CodeLensCodesearchEnabled = 'codelens.codesearch.enabled',
  CodeLensBepEnabled = 'codelens.bep.enabled',
  CodeLensUIEnabled = 'codelens.ui.enabled',
  CodeLensDebugStarlarkEnabled = 'codelens.debugStarlark.enabled',
  AccountServerAddress = 'account.server.address',
  RemoteCacheAddress = 'remoteCache.address',
  RemoteCachePreferredPort = 'remoteCache.preferredPort',
  RemoteCacheSizeGb = 'remoteCache.maxSizeGb',
  RemoteCacheDir = 'remoteCache.dir',
  AccountToken = 'account.token',
}

export enum ViewName {
  Workspace = 'bsv.bzl.workspace',
  Invocation = 'bsv.bzl.invocation',
  ExecRoot = 'bsv.bzl.execroot',
}

export enum MatcherName {
  /**
   * The name of the problem matcher to apply to all bazel run tasks.  Hardcoded
   * and in this extensions' problemMatcher list.
   */
  Bazel = 'bazel',
}

export enum CommandName {
  Build = 'bsv.bzl.build',
  Codesearch = 'bsv.bzl.codesearch',
  CodesearchIndex = 'bsv.bzl.codesearch.index',
  CodesearchSearch = 'bsv.bzl.codesearch.search',
  CopyLabel = 'bsv.bzl.copyLabel',
  CopyToClipboard = 'bsv.bzl.copyToClipboard',
  DebugBuild = 'bsv.bzl.debugBuild',
  DebugTest = 'bsv.bzl.debugTest',
  InvocationInvoke = 'bsv.bzl.invocation.invoke',
  InvocationsRefresh = 'bsv.bzl.invocations.refresh',
  Invoke = 'bsv.bzl.invoke',
  BazelKill = 'bsv.bzl.bazelKill',
  Login = 'bzv.bzl.login',
  OpenTerminal = 'bsv.bzl.openTerminal',
  Redo = 'bsv.bzl.redo',
  Run = 'bsv.bzl.run',
  SignIn = 'bsv.bzl.signin',
  Test = 'bsv.bzl.test',
  UiInvocation = 'bsv.bzl.ui.invocation',
  UiLabel = 'bsv.bzl.ui.label',
  UiServer = 'bsv.bzl.ui.server',
  UiWorkspace = 'bsv.bzl.ui.workspace',
  RemoteCacheConfig = 'bsv.bzl.remoteCache.config',
}

export enum ContextValue {
  ProblemFile = 'problem-file',
  ProblemFileMarker = 'problem-file-marker',
  History = 'history',
  Package = 'package',
  Repository = 'repository',
  ExternalWorkspace = 'external-workspace',
  DefaultWorkspace = 'default-workspace',
  Server = 'server',
  Metadata = 'metadata',
}

export enum DiagnosticCollectionName {
  Bazel = 'bazel',
}

export enum ButtonName {
  Reveal = 'Reveal',
}

export const ThemeIconCheck = new vscode.ThemeIcon('check');
export const ThemeIconPulse = new vscode.ThemeIcon('pulse');
export const ThemeIconCircleOutline = new vscode.ThemeIcon('circle-outline');
export const ThemeIconClose = new vscode.ThemeIcon('close');
export const ThemeIconCloudDownload = new vscode.ThemeIcon('cloud-download');
export const ThemeIconDebugContinue = new vscode.ThemeIcon('debug-continue');
export const ThemeIconDebugStackframe = new vscode.ThemeIcon('debug-stackframe');
export const ThemeIconDebugStackframeActive = new vscode.ThemeIcon('debug-stackframe-active');
export const ThemeIconDebugStackframeFocused = new vscode.ThemeIcon('debug-stackframe-focused');
export const ThemeIconDebugStart = new vscode.ThemeIcon('debug-start');
export const ThemeIconFileSymlinkDirectory = new vscode.ThemeIcon('file-symlink-directory');
export const ThemeIconFolderOpened = new vscode.ThemeIcon('folder-opened');
export const ThemeIconInfo = new vscode.ThemeIcon('info');
export const ThemeIconPackage = new vscode.ThemeIcon('package');
export const ThemeIconPass = new vscode.ThemeIcon('pass');
export const ThemeIconQuestion = new vscode.ThemeIcon('question');
export const ThemeIconReload = new vscode.ThemeIcon('reload');
export const ThemeIconRepo = new vscode.ThemeIcon('repo');
export const ThemeIconReport = new vscode.ThemeIcon('report');
export const ThemeIconServerProcess = new vscode.ThemeIcon('server-process');
export const ThemeIconShield = new vscode.ThemeIcon('shield');
export const ThemeIconSignIn = new vscode.ThemeIcon('sign-in');
export const ThemeIconSymbolEvent = new vscode.ThemeIcon('symbol-event');
export const ThemeIconSymbolInterface = new vscode.ThemeIcon('symbol-interface');
export const ThemeIconVerified = new vscode.ThemeIcon('verified');
export const ThemeIconZap = new vscode.ThemeIcon('zap');
