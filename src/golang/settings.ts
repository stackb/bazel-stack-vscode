import * as vscode from 'vscode';
import * as fs from 'graceful-fs';
import path = require('path');
import fsExtra = require('fs-extra');
import normalize = require('normalize-path');
import { Settings } from '../bezel/settings';
import { GolangConfiguration, GopackagesdriverClientConfiguration } from './configuration';
import { ConfigurationContext } from '../common';
import { BzlAssetDownloader } from '../bezel/download';
import { BzlSettings, GopackagesdriverServerConfiguration, LanguageServerSettings } from '../bezel/configuration';

export class GolangSettings extends Settings<GolangConfiguration> {
  constructor(
    configCtx: ConfigurationContext,
    section: string,
    private ctx: vscode.ExtensionContext,
    private bzlSettings: BzlSettings,
    private lspSettings: LanguageServerSettings,
  ) {
    super(configCtx, section);
  }

  protected async configure(
    config: vscode.WorkspaceConfiguration
  ): Promise<GolangConfiguration> {
    const cfg: GolangConfiguration = {
      enabled: config.get<boolean>('enabled', true),
      gopackagesdriver: {
        goSdkWorkspaceName: config.get<string>('gopackagesdriver.goSdkWorkspaceName', 'go_sdk'),
        release: config.get<string>('gopackagesdriver.release', 'v1.3.21'),
        executable: normalize(config.get<string>('gopackagesdriver.executable', '')),
        flags: config.get<string[] | undefined>('gopackagesdriver.flags'),
        script: `${path.join(this.ctx.storageUri?.fsPath!, 'gopackagesdriver')}`,
      },
    };

    if (!cfg.gopackagesdriver.executable) {
      const bzl = await this.bzlSettings.get();
      await setServerExecutable(this.ctx, bzl.downloadBaseURL, cfg.gopackagesdriver);
    }

    const lsp = await this.lspSettings.get();
    installGopackagesDriverScript(lsp.gopackagesdriver, cfg.gopackagesdriver);

    return cfg;
  }
}

async function setServerExecutable(
  ctx: vscode.ExtensionContext,
  downloadBaseURL: string,
  gopackagesdriver: GopackagesdriverClientConfiguration,
): Promise<any> {
  try {
    const fileUri = await maybeInstallExecutable(ctx, downloadBaseURL, gopackagesdriver.release);
    gopackagesdriver.executable = normalize(fileUri.fsPath);
  } catch (e) {
    throw new Error(`could not install gopackagesdriver: ${e instanceof Error ? e.message : e}`);
  }
  if (!fs.existsSync(gopackagesdriver.executable)) {
    throw new Error(`could not activate: gopackagesdriver file "${gopackagesdriver.executable}" not found.`);
  }
}

/**
 * Installs gopackagesdriver.  If the expected file already exists the download
 * operation is skipped.
 */
async function maybeInstallExecutable(
  ctx: vscode.ExtensionContext,
  downloadBaseURL: string,
  release: string,
): Promise<vscode.Uri> {
  const cancellationTokenSource = new vscode.CancellationTokenSource();
  const cancellationToken = cancellationTokenSource.token;
  const downloader = await BzlAssetDownloader.fromConfiguration({
    basename: 'gopackagesdriver',
    downloadBaseURL: downloadBaseURL,
    release: release,
  });
  const mode = 0o755;
  return downloader.getOrDownloadFile(ctx, mode, cancellationToken);
}

async function installGopackagesDriverScript(
  server: GopackagesdriverServerConfiguration,
  client: GopackagesdriverClientConfiguration,
) {

  try {
    fsExtra.ensureDirSync(path.dirname(client.script), {
      mode: 0o755,
    });

    fsExtra.writeFileSync(client.script, [
      "#!/usr/bin/env bash",
      `exec '${client.executable}' --log_level=debug --log_file=/tmp/gpdc2.log --server_host=${server.host} --server_port=${server.port} "\${@}"`,
      "",
    ].join("\n"), {
      mode: 0o755,
    });
  } catch (e) {
    if (e instanceof Error) {
      vscode.window.showErrorMessage(`failed to write client script: ${e.message}`);
    }
    client.script = ''; // set to empty string to disable this functionality for now    
  }

}