import * as vscode from "vscode";
import * as fs from 'fs';

import { IExtensionFeature } from "../common";
import { GitHubReleaseAssetDownloader } from '../download';
import { BuildifierConfiguration } from "./configuration";
import { BuildifierDiagnosticsManager } from "./diagnostics";
import { BuildifierFormatter } from "./formatter";

export class BuildifierFeature implements IExtensionFeature {
    public name = "bzl.buildifier";

    private diagnostics: BuildifierDiagnosticsManager | undefined;
    private formatter: BuildifierFormatter | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration) {
        const cfg = {
            owner: config.get<string>("github-owner", "bazelbuild"),
            repo: config.get<string>("github-repo", "buildtools"),
            releaseTag: config.get<string>("github-release", "3.3.0"),
            executable: config.get<string>("executable", ""),
            fixOnFormat: config.get<boolean>("fix-on-format", false),
        };

        if (!cfg.executable) {
            try {
                cfg.executable = await maybeInstallBuildifier(cfg, ctx.globalStoragePath);
            } catch (err) {
                this.warn(`could not activate: ${JSON.stringify(err)}`);
            }
        }

        if (!fs.existsSync(cfg.executable)) {
            this.warn(`could not activate: buildifier executable file "${cfg.executable}" not found.`);
        }

        this.diagnostics = new BuildifierDiagnosticsManager(cfg);
        this.formatter = new BuildifierFormatter(cfg);

        this.info(`enabled.`);
    }
    
    warn(msg: string) {
        vscode.window.showWarningMessage(`${this.name}> ${msg}`);
    }

    info(msg: string) {
        vscode.window.showInformationMessage(`${this.name}> ${msg}`);
    }

    public deactivate() {
        if (this.diagnostics) {
            this.diagnostics.dispose();
            delete(this.diagnostics);
        }
        if (this.formatter) {
            this.formatter.dispose();
            delete(this.formatter);
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
function maybeInstallBuildifier(cfg: BuildifierConfiguration, storagePath: string): Promise<string> {
    
    const assetName = platformBinaryName("buildifier");

    const downloader = new GitHubReleaseAssetDownloader(
        cfg.owner,
        cfg.repo,
        cfg.releaseTag,
        assetName,
        storagePath,
        true, // isExecutable
    );

    const executable = downloader.getFilepath();

    if (fs.existsSync(executable)) {
        return Promise.resolve(executable);
    }

    return downloader.download();

}

function platformBinaryName(toolName: string) {
    if (process.platform === 'win32') {
        return toolName + '.exe';
    }
    if (process.platform === 'darwin') {
        return toolName + '.mac';
    }
    return toolName;
}
