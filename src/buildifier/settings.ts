import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import * as os from 'os';
import * as semver from 'semver';
import {
  GitHubReleaseAssetDownloader,
  platformOsArchBinaryName,
  platformBinaryName,
} from '../download';
import { Settings } from "../bezel/settings";
import { BuildifierConfiguration } from "./configuration";
import { Container } from '../container';
import path = require('path');

export class BuildifierSettings extends Settings<BuildifierConfiguration> {
    constructor(section: string) {
      super(section);
    }
  
    protected async configure(config: vscode.WorkspaceConfiguration): Promise<BuildifierConfiguration> {
      const cfg = {
        owner: config.get<string>('github-owner', 'bazelbuild'),
        repo: config.get<string>('github-repo', 'buildtools'),
        release: config.get<string>('github-release', '4.0.1'),
        executable: config.get<string | undefined>('executable'),
        fixOnFormat: config.get<boolean>('fix-on-format', false),
      };
  
      if (!cfg.executable) {
        cfg.executable = await maybeInstallBuildifier(
          cfg,
          path.join(Container.context.globalStoragePath, 'bsv.buildifier')
        );
      }
  
      if (!fs.existsSync(cfg.executable)) {
        throw new Error(
          `could not activate: buildifier executable file "${cfg.executable}" not found.`
        );
      }
  
      return cfg;
    }
  }
  

/**
 * Installs buildifier from a github release.  If the expected file already
 * exists the download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallBuildifier(
    cfg: BuildifierConfiguration,
    storagePath: string
  ): Promise<string> {
    const assetName = versionedPlatformBinaryName(
      os.arch(),
      process.platform,
      'buildifier',
      cfg.release
    );
  
    const downloader = new GitHubReleaseAssetDownloader(
      {
        owner: cfg.owner,
        repo: cfg.repo,
        release: cfg.release,
        name: assetName,
      },
      storagePath,
      true // isExecutable
    );
  
    const executable = downloader.getFilepath();
  
    if (fs.existsSync(executable)) {
      return Promise.resolve(executable);
    }
  
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${assetName} ${cfg.release}...`,
      },
      progress => {
        return downloader.download();
      }
    );
  
    return executable;
  }
  
  export function versionedPlatformBinaryName(
    arch: string,
    platform: string,
    toolName: string,
    version: string
  ): string {
    if (semver.gt(version, '3.5.0')) {
      return platformOsArchBinaryName(arch, platform, toolName);
    } else {
      return platformBinaryName(platform, toolName);
    }
  }
  