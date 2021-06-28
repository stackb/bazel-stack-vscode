'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import { getApi, FileDownloader } from '@microsoft/vscode-file-downloader-api';

/**
 * Configuration type that describes a desired asset from bzl.io.
 */
export interface BzlIoReleaseAssetConfiguration {
  /**
   * The base URL (e.g "https://bzl.io").
   */
  downloadBaseURL: string;

  /**
   * The tag name of the release (e.g. "3.3.0").
   */
  releaseTag: string;
}

export class BzlIoReleaseAssetDownloader {
  private constructor(
    private downloaderApi: FileDownloader,
    private cfg: BzlIoReleaseAssetConfiguration
  ) {}

  getBasename(): string {
    let basename = 'bzl';
    if (process.platform === 'win32') {
      basename += '.exe';
    }
    return basename;
  }

  /**
   * Return the path of the file that will be downloaded.
   * @param outputDir
   */
  getDownloadURL(): string {
    let osarch = 'linux_amd64';
    switch (process.platform) {
      case 'win32':
        osarch = 'windows_amd64';
        break;
      case 'darwin':
        osarch = 'darwin_amd64';
        break;
    }
    return [this.cfg.downloadBaseURL, osarch, this.cfg.releaseTag, this.getBasename()].join('/');
  }

  /**
   * Return the path of the file that will be downloaded.
   * @param outputDir
   */
  getFilename(): string {
    return [this.cfg.releaseTag, this.getBasename()].join('-');
  }

  /**
   * Return the file URI of the downloaded file.  If has not been performed
   * yet, download it and report progress.
   */
  async getOrDownloadFile(
    ctx: vscode.ExtensionContext,
    mode: number,
    token: vscode.CancellationToken
  ): Promise<vscode.Uri> {
    const filename = this.getFilename();

    let fileUri = await this.downloaderApi.tryGetItem(filename, ctx);
    if (fileUri !== undefined) {
      return fileUri;
    }

    const basename = this.getBasename();
    const url = this.getDownloadURL();

    fileUri = await vscode.window.withProgress(
      {
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${basename} ${this.cfg.releaseTag}...`,
      },
      progress => {
        return this.downloaderApi.downloadFile(
          vscode.Uri.parse(url),
          filename,
          ctx,
          token,
          (downloaded: number, totalBytes: number | undefined) => {
            const reportedTotal = totalBytes ?? 0;
            if (!reportedTotal) {
              return;
            }
            // the fileDownloader API does not appear to report numbers back
            // correctly.  As a result, we end up multiplying by 1000 rather
            // than 100.
            const pct = (downloaded / reportedTotal) * 100;
            progress.report({
              increment: pct,
              // message: `${pct}%`,
            });
          }
        );
      }
    );

    fs.chmodSync(fileUri.fsPath, mode);

    return fileUri;
  }

  /**
   * Contructor for the downloader.
   * @param cfg
   * @returns
   */
  static async fromConfiguration(
    cfg: BzlIoReleaseAssetConfiguration
  ): Promise<BzlIoReleaseAssetDownloader> {
    const api = await getApi();
    return new BzlIoReleaseAssetDownloader(api, cfg);
  }
}
