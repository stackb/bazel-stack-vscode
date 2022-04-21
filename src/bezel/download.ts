'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import { IFileDownloader } from '../vendor/microsoft/vscode-file-downloader/IFileDownloader';
import FileDownloader from '../vendor/microsoft/vscode-file-downloader/FileDownloader';
import { Container } from '../container';
import HttpRequestHandler from '../vendor/microsoft/vscode-file-downloader/networking/HttpRequestHandler';

/**
 * Configuration type that describes a desired asset from bzl.io.
 */
export interface BzlAssetConfiguration {
  /**
   * The base URL (e.g "https://bzl.io").
   */
  downloadBaseURL: string;

  /**
   * The tag name of the release (e.g. "3.3.0").
   */
  release: string;
}

export class BzlAssetDownloader {
  private constructor(private downloaderApi: IFileDownloader, private cfg: BzlAssetConfiguration) {}

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
    return [this.cfg.downloadBaseURL, osarch, this.cfg.release, this.getBasename()].join('/');
  }

  /**
   * Return the path of the file that will be downloaded.
   * @param outputDir
   */
  getFilename(): string {
    if (!this.cfg.release) {
      throw new TypeError(
        'bzl download misconfiguration: .release version string to be retrieved must be defined'
      );
    }
    return [this.cfg.release, this.getBasename()].join('-');
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

    const url = this.getDownloadURL();

    try {
      fileUri = await this.downloadWithProgress(ctx, token, filename, url);
      fs.chmodSync(fileUri.fsPath, mode);
      return fileUri;
    } catch (e) {
      throw new Error(`${url}: ${e instanceof Error ? e.message : JSON.stringify(e)}`);
    }
  }

  async downloadWithProgress(
    ctx: vscode.ExtensionContext,
    token: vscode.CancellationToken,
    filename: string,
    url: string
  ): Promise<vscode.Uri> {
    const basename = this.getBasename();

    return await vscode.window.withProgress(
      {
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
        title: `Downloading ${basename} ${this.cfg.release}...`,
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
            const pct = (downloaded / reportedTotal) * 100;
            progress.report({
              increment: pct,
              // message: `${pct}%`,
            });
          }
        );
      }
    );
  }

  /**
   * Contructor for the downloader.
   * @param cfg
   * @returns
   */
  static async fromConfiguration(cfg: BzlAssetConfiguration): Promise<BzlAssetDownloader> {
    const requestHandler = new HttpRequestHandler(Container.logger);
    const downloader = new FileDownloader(requestHandler, Container.logger);
    return new BzlAssetDownloader(downloader, cfg);
  }
}
