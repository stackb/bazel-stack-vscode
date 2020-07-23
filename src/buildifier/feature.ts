import * as vscode from "vscode";
import * as fs from 'fs';

import { IExtensionFeature, info, fail } from "../common";
import { GitHubReleaseAssetDownloader } from '../download';
import { BuildifierConfiguration } from "./configuration";
import { BuildifierDiagnosticsManager } from "./diagnostics";
import { BuildifierFormatter } from "./formatter";

export class BuildifierFeature implements IExtensionFeature {
    public readonly name = "feature.buildifier";

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
                cfg.executable = await this.maybeInstallBuildifier(cfg, ctx.globalStoragePath);
            } catch (err) {
                return fail(this, `could not install buildifier: ${JSON.stringify(err)}`);
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

    /**
     * Installs buildifier from a github release.  If the expected file already
     * exists the download operation is skipped.
     *
     * @param cfg The configuration
     * @param storagePath The directory where the binary should be installed
     */
    maybeInstallBuildifier(cfg: BuildifierConfiguration, storagePath: string): Promise<string> {

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
            if (cfg.verbose > 1) {
                info(this, `skipping download ${assetName} ${cfg.releaseTag} (${executable} already exists)`);
            }
            return Promise.resolve(executable);
        }

        if (cfg.verbose > 0) {
            info(this, `downloading ${assetName} ${cfg.releaseTag} to ${executable}`);
        }

        return downloader.download();
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


function platformBinaryName(toolName: string) {
    if (process.platform === 'win32') {
        return toolName + '.exe';
    }
    if (process.platform === 'darwin') {
        return toolName + '.mac';
    }
    return toolName;
}
