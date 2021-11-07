import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import * as os from 'os';
import * as semver from 'semver';
import {
  GitHubReleaseAssetDownloader,
  platformOsArchBinaryName,
  platformBinaryName,
} from '../download';
import { Settings } from '../bezel/settings';
import { BuildifierConfiguration } from './configuration';
import { Container } from '../container';
import path = require('path');
import { ConfigurationContext } from '../common';

export class BuildifierSettings extends Settings<BuildifierConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<BuildifierConfiguration> {
    const cfg: BuildifierConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      githubOwner: config.get<string>('githubOwner', 'bazelbuild'),
      githubRepo: config.get<string>('githubRepo', 'buildtools'),
      githubRelease: config.get<string>('githubRelease', '4.0.1'),
      executable: config.get<string | undefined>('executable'),
      fixOnFormat: config.get<boolean>('fixOnFormat', true),
    };

    if (!cfg.executable) {
      cfg.executable = await maybeInstallBuildtool(
        cfg.githubOwner,
        cfg.githubRepo,
        cfg.githubRelease,
        path.join(this.configCtx.globalStorageUri.fsPath, 'bsv.buildifier'),
        'buildifier',
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
 * Installs a named tool from the buildtools repo from a github release.  If the
 * expected file already exists the download operation is skipped.
 *
 * @param cfg The configuration
 * @param storagePath The directory where the binary should be installed
 */
export async function maybeInstallBuildtool(
  githubOwner: string,
  githubRepo: string,
  githubRelease: string,
  storagePath: string,
  binaryName: string,
): Promise<string> {
  const assetName = versionedPlatformBinaryName(
    os.arch(),
    process.platform,
    binaryName,
    githubRelease
  );

  const downloader = new GitHubReleaseAssetDownloader(
    {
      owner: githubOwner,
      repo: githubRepo,
      release: githubRelease,
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
      title: `Downloading ${assetName} ${githubRelease}...`,
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
