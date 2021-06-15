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
}

export enum ViewName {
    Workspace = 'bsv.bazel.workspace',
}

export enum CommandName {
    Redo = 'bsv.bazel.redo',
    CopyToClipboard = 'bsv.bazel.copyToClipboard',
    Build = 'bsv.bazel.build',
    Test = 'bsv.bazel.test',
    DebugBuild = 'bsv.bazel.debugBuild',
    DebugTest = 'bsv.bazel.debugTest',
    Codesearch = 'bsv.bazel.codesearch',
    CodesearchSearch = 'bsv.bazel.codesearch.search',
    CodesearchIndex = 'bsv.bazel.codesearch.index',
    UI = 'bsv.bazel.ui',
    Kill = 'bsv.bazel.kill',
    OpenTerminal = 'bsv.bazel.openTerminal',
}

export const ThemeIconFileSymlinkDirectory = new vscode.ThemeIcon('file-symlink-directory');
export const ThemeIconFolderOpened = new vscode.ThemeIcon('folder-opened');
export const ThemeIconServerProcess = new vscode.ThemeIcon('server-process');
export const ThemeIconPackage = new vscode.ThemeIcon('package');
export const ThemeIconRepo = new vscode.ThemeIcon('repo');
