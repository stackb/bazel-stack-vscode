import * as fs from 'fs';
import * as path from 'path';
import * as vscode from "vscode";
import { fail, IExtensionFeature, info } from "../common";
import { GitHubReleaseAssetDownloader } from '../download';
import { BuildifierConfiguration } from "./configuration";
import { BuildifierDiagnosticsManager } from "./diagnostics";
import { BuildifierFormatter } from "./formatter";


export const BuildifierFeatureName = "feature.buildifier";

export class BuildifierFeature implements IExtensionFeature {
    public readonly name = BuildifierFeatureName;

    private cfg: BuildifierConfiguration | undefined;
    private diagnostics: BuildifierDiagnosticsManager | undefined;
    private formatter: BuildifierFormatter | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            owner: config.get<string>("github-owner", "bazelbuild"),
            repo: config.get<string>("github-repo", "buildtools"),
            releaseTag: config.get<string>("github-release", "3.3.0"),
            executable: config.get<string>("executable", ""),
            fixOnFormat: config.get<boolean>("fix-on-format", false),
            verbose: config.get<number>("verbose", 0),
        };

        if (!cfg.executable) {
            try {
                cfg.executable = await maybeInstallBuildifier(cfg, path.join(ctx.globalStoragePath, BuildifierFeatureName));
            } catch (err) {
                return fail(this, `could not install buildifier ${err}`);
            }
        }

        if (!fs.existsSync(cfg.executable)) {
            return fail(this, `could not activate: buildifier executable file "${cfg.executable}" not found.`);
        }

        this.diagnostics = new BuildifierDiagnosticsManager(cfg);
        this.formatter = new BuildifierFormatter(cfg);

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
    }


    public deactivate() {
        if (this.diagnostics) {
            this.diagnostics.dispose();
            delete (this.diagnostics);
        }
        if (this.formatter) {
            this.formatter.dispose();
            delete (this.formatter);
        }
        if (this.cfg && this.cfg.verbose > 0) {
            info(this, `deactivated.`);
        }
    }
}

/**
 * Installs buildifier from a github release.  If the expected file already
 * exists the download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallBuildifier(cfg: BuildifierConfiguration, storagePath: string): Promise<string> {

    const assetName = platformBinaryName("buildifier");

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
        if (cfg.verbose > 1) {
            vscode.window.showInformationMessage(`skipping download ${assetName} ${cfg.releaseTag} (${executable} already exists)`);
        }
        return Promise.resolve(executable);
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${assetName} ${cfg.releaseTag}...`
    }, progress => {
        return downloader.download();
    });

    if (cfg.verbose > 0) {
        vscode.window.showInformationMessage(`Downloaded ${assetName} ${cfg.releaseTag} to ${executable}`);
    }

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
