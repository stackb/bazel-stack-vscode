import * as fs from 'graceful-fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as semver from 'semver';
import {
  GitHubReleaseAssetDownloader,
  platformOsArchBinaryName,
  platformBinaryName,
} from '../download';
import { BuildifierConfiguration } from './configuration';
import { BuildifierDiagnosticsManager } from './diagnostics';
import { BuildifierFormatter } from './formatter';
import { Reconfigurable } from '../reconfigurable';
import { Container } from '../container';

export const BuildifierFeatureName = 'bsv.buildifier';

export class BuildifierFeature extends Reconfigurable<BuildifierConfiguration> {
  constructor() {
    super(BuildifierFeatureName);

    this.add(new BuildifierDiagnosticsManager(this.onDidConfigurationChange.event));
    this.add(new BuildifierFormatter(this.onDidConfigurationChange.event));
  }

  async configure(config: vscode.WorkspaceConfiguration): Promise<BuildifierConfiguration> {
    const cfg = {
      owner: config.get<string>('github-owner', 'bazelbuild'),
      repo: config.get<string>('github-repo', 'buildtools'),
      releaseTag: config.get<string>('github-release', '4.0.1'),
      executable: config.get<string>('executable', ''),
      fixOnFormat: config.get<boolean>('fix-on-format', false),
    };

    if (!cfg.executable) {
      cfg.executable = await maybeInstallBuildifier(
        cfg,
        path.join(Container.context.globalStoragePath, BuildifierFeatureName)
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
    cfg.releaseTag
  );

  const downloader = new GitHubReleaseAssetDownloader(
    {
      owner: cfg.owner,
      repo: cfg.repo,
      releaseTag: cfg.releaseTag,
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
      title: `Downloading ${assetName} ${cfg.releaseTag}...`,
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
