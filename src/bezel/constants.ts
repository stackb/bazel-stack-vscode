import * as vscode from 'vscode';

export const FeatureName = 'bazel';

export enum ConfigSection {
  BzlDownloadBaseUrl = 'bzl.downloadBaseUrl',
  BzlRelease = 'bzl.release',
  BzlExecutable = 'bzl.executable',
  BzlAddress = 'bzl.address',
  BzlCommand = 'bzl.command',
  BazelExecutable = 'executable',
  BazelBuildFlags = 'buildFlags',
  BazelTestFlags = 'testFlags',
  BazelStarlarkDebuggerFlags = 'starlarkDebuggerFlags',
  CodeLensEnabled = 'codelens.enabled',
  CodeLensCodesearchEnabled = 'codelens.codesearch.enabled',
  CodeLensBepEnabled = 'codelens.bep.enabled',
  CodeLensUIEnabled = 'codelens.ui.enabled',
  CodeLensDebugStarlarkEnabled = 'codelens.debugStarlark.enabled',
  AccountServerAddress = 'account.server.address',
  AccountToken = 'account.token',
}

export enum ViewName {
  Workspace = 'bsv.bazel.workspace',
  Invocation = 'bsv.bazel.invocation',
  ExecRoot = 'bsv.bazel.execroot',
}

export enum MatcherName {
  /**
   * The name of the problem matcher to apply to all bazel run tasks.  Hardcoded
   * and in this extensions' problemMatcher list.
   */
  Bazel = 'bazel',
}

export enum CommandName {
  Redo = 'bsv.bazel.redo',
  CopyToClipboard = 'bsv.bazel.copyToClipboard',
  Build = 'bsv.bazel.build',
  Test = 'bsv.bazel.test',
  DebugBuild = 'bsv.bazel.debugBuild',
  DebugTest = 'bsv.bazel.debugTest',
  BuildEvents = 'bsv.bazel.buildEvents',
  TestEvents = 'bsv.bazel.testEvents',
  Codesearch = 'bsv.bazel.codesearch',
  CodesearchSearch = 'bsv.bazel.codesearch.search',
  CodesearchIndex = 'bsv.bazel.codesearch.index',
  UI = 'bsv.bazel.ui',
  SignIn = 'bsv.bzl.signin',
  Kill = 'bsv.bazel.kill',
  OpenTerminal = 'bsv.bazel.openTerminal',
  Login = 'bzv.bzl.login',
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
