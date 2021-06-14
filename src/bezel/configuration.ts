import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import { ConfigSection } from './constants';
import { BzlIoReleaseAssetDownloader } from '../bzl/download';

/**
 * Configuration for the Bezel feature.
 */
export type BezelConfiguration = {
    bzl: BzlConfiguration,
    bazel: BazelConfiguration,
}

/**
 * Configuration for the bzl server.
 */
export type BzlConfiguration = {
    // Download specs
    releaseTag: string,
    // Base URL for bzl downloads
    downloadBaseURL: string,
    // Path to binary
    executable: string,
    // launch command
    command: string[],
}

/**
 * Configuration for the bzl server.
 */
export type BazelConfiguration = {
    // path to the bazel executable
    executable: string,
    // common flags for the build command
    buildFlags: string[],
    // common flags for the test command
    testFlags: string[],
    // common flags for the starlark debugger command
    starlarkDebuggerFlags: string[],
}

export async function createBezelConfiguration(
    ctx: vscode.ExtensionContext,
    config: vscode.WorkspaceConfiguration): Promise<BezelConfiguration> {

    const cfg: BezelConfiguration = {
        bzl: {
            downloadBaseURL: config.get<string>(ConfigSection.BzlDownloadBaseUrl,
                'https://get.bzl.io'),
            releaseTag: config.get<string>(ConfigSection.BzlRelease,
                'v0.9.12'),
            executable: config.get<string>(ConfigSection.BzlExecutable,
                ''),
            command: config.get<string[]>(ConfigSection.BzlCommand,
                ['serve', '--vscode']),
        },
        bazel: {
            executable: config.get<string>(ConfigSection.BazelExecutable,
                'bazel'),
            buildFlags: config.get<string[]>(ConfigSection.BazelBuildFlags,
                []),
            testFlags: config.get<string[]>(ConfigSection.BazelTestFlags,
                []),
            starlarkDebuggerFlags: config.get<string[]>(ConfigSection.BazelStarlarkDebuggerFlags,
                [
                    "--experimental_skylark_debug",
                    "--experimental_skylark_debug_server_port=7300",
                    "--experimental_skylark_debug_verbose_logging=true",
                ]),
        }
    };

    await setServerExecutable(ctx, cfg.bzl);

    return cfg;
}

export async function setServerExecutable(ctx: vscode.ExtensionContext, server: BzlConfiguration): Promise<any> {
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
export async function maybeInstallExecutable(ctx: vscode.ExtensionContext, cfg: BzlConfiguration): Promise<vscode.Uri> {
    const cancellationTokenSource = new vscode.CancellationTokenSource();
    const cancellationToken = cancellationTokenSource.token;
    const downloader = await BzlIoReleaseAssetDownloader.fromConfiguration(cfg);
    const mode = 0o755;
    return downloader.getOrDownloadFile(ctx, mode, cancellationToken);
}
