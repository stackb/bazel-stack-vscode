import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { fail, IExtensionFeature } from "../common";
import { GitHubReleaseAssetDownloader } from '../download';
import { StardocLSPClient } from "./client";
import { createStarlarkLSPConfiguration, StarlarkLSPConfiguration } from "./configuration";

export const StarlarkLSPFeatureName = "feature.starlark.lsp";

export class StarlarkLSPFeature implements IExtensionFeature {
    public readonly name = StarlarkLSPFeatureName;

    private client: StardocLSPClient | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createStarlarkLSPConfiguration(ctx, config);
        
        if (!cfg.server.executable) {
            try {
                cfg.server.executable = await maybeInstallExecutable(cfg, path.join(ctx.globalStoragePath, StarlarkLSPFeatureName));
            } catch (err) {
                return fail(this, `could not install gostarlark ${err}`);
            }
        }

        if (!fs.existsSync(cfg.server.executable)) {
            return fail(this, `could not activate: gostarlark executable file "${cfg.server.executable}" not found.`);
        }

        const client = this.client = new StardocLSPClient(
            cfg.server.executable, 
            cfg.server.command);
            
        client.start();
    }

    public deactivate() {
        if (this.client) {
            this.client.dispose();
            delete (this.client);
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
export async function maybeInstallExecutable(cfg: StarlarkLSPConfiguration, storagePath: string): Promise<string> {

    const assetName = platformBinaryName("gostarlark");

    const downloader = new GitHubReleaseAssetDownloader(
        {
            owner: cfg.server.owner,
            repo: cfg.server.repo,
            releaseTag: cfg.server.releaseTag,
            name: assetName,
        },
        storagePath,
        true, // isExecutable
    );

    const executable = downloader.getFilepath();

    if (fs.existsSync(executable)) {
        if (cfg.verbose > 1) {
            vscode.window.showInformationMessage(`skipping download ${assetName} ${cfg.server.releaseTag} (${executable} already exists)`);
        }
        return Promise.resolve(executable);
    }

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${assetName} ${cfg.server.releaseTag}`
    }, progress => {
        return downloader.download();
    });

    if (cfg.verbose > 0) {
        vscode.window.showInformationMessage(`Downloaded ${assetName} ${cfg.server.releaseTag} to ${executable}`);
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
