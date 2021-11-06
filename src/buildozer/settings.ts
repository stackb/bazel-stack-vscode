import * as fs from 'graceful-fs';
import * as vscode from 'vscode';
import { Settings } from '../bezel/settings';
import { BuildozerConfiguration as BuildozerConfiguration } from './configuration';
import { Container } from '../container';
import path = require('path');
import { BuildifierSettings, maybeInstallBuildtool } from '../buildifier/settings';
import { ConfigurationContext } from '../common';

export class BuildozerSettings extends Settings<BuildozerConfiguration> {
  constructor(configCtx: ConfigurationContext, section: string, private buildifier: BuildifierSettings) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<BuildozerConfiguration> {
    const cfg: BuildozerConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      githubOwner: config.get<string>('githubOwner', 'bazelbuild'),
      githubRepo: config.get<string>('githubRepo', 'buildtools'),
      githubRelease: config.get<string>('githubRelease', '4.2.3'),
      executable: config.get<string | undefined>('executable'),
      options: config.get<string[] | undefined>('options'),
    };

    if (!cfg.executable) {
      cfg.executable = await maybeInstallBuildtool(
        cfg.githubOwner,
        cfg.githubRepo,
        cfg.githubRelease,
        path.join(this.configCtx.globalStorageUri.fsPath, 'bsv.buildifier'),
        'buildozer',
      );
    }

    if (!fs.existsSync(cfg.executable)) {
      throw new Error(
        `could not activate: buildozer executable file "${cfg.executable}" not found.`
      );
    }

    return cfg;
  }
}
