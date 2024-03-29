'use strict';

import * as fs from 'graceful-fs';
import * as octokit from '@octokit/rest';
import * as path from 'path';
import mv = require('mv');
import request = require('request');
import sha256File = require('sha256-file');
import tmp = require('tmp');
const { pipeline } = require('stream');
import { ReposListReleasesResponseData } from '@octokit/types';

tmp.setGracefulCleanup();

const USER_AGENT = 'bazel-stack-vscode';

/**
 * Configuration type that describes a desired asset from a gh release.
 */
export type GithubReleaseAssetRequest = {
  /**
   * The gh owner (e.g. "bazelbuild").
   */
  owner: string;

  /**
   * The gh reposito       ry name (e.g. "buildtools").
   */
  repo: string;

  /**
   * The tag name of the release (e.g. "3.3.0").
   */
  release: string;

  /**
   * The name of the asset to download (e.g. "buildifier.exe").
   */
  name: string;
};

export type GithubReleaseAsset = {
  url: string;
  browser_download_url: string;
  id: number;
  node_id: string;
  name: string;
  label: string;
  state: string;
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  uploader: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
};

export type GithubRelease = {
  url: string;
  html_url: string;
  assets_url: string;
  upload_url: string;
  tarball_url: string;
  zipball_url: string;
  id: number;
  node_id: string;
  tag_name: string;
  target_commitish: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
  assets: GithubReleaseAsset[];
};

export class GitHubReleaseAssetDownloader {
  constructor(
    private req: GithubReleaseAssetRequest,
    private outputDir: string,
    private executable: boolean
  ) {}

  /**
   * Return the path of the file that will be downloaded.
   * @param outputDir
   */
  getFilepath(): string {
    return path.join(this.outputDir, this.req.release, this.req.name);
  }

  newOctokit(): octokit.Octokit {
    const args: any = {
      userAgent: USER_AGENT,
    };
    const token = getGithubToken();
    if (token) {
      args['auth'] = token;
    }
    return new octokit.Octokit(args);
  }

  /**
   * Perform the download.
   */
  async download(): Promise<GithubReleaseAsset> {
    const filepath = this.getFilepath();

    const mode = this.executable ? 0o755 : 0o644;
    const client = this.newOctokit();
    const asset = await getReleaseAsset(client, this.req);
    await downloadAsset(asset.url, filepath, mode);
    if (!fs.existsSync(filepath)) {
      throw new Error(
        `Downloader should have created file <${filepath}>.  ` +
          'Please check that release ' +
          `https://github.com/${this.req.owner}/${this.req.repo}/releases/${this.req.release} ` +
          `has an asset named "${this.req.name}".  ` +
          'If the release does not exist, check your extension settings.  ' +
          'If the release exists and asset exists this is likely a bug.  ' +
          'Please file an issue at https://github.com/stackb/bazel-stack-vscode/issues'
      );
    }
    return asset;
  }
}

export async function getReleaseAsset(
  client: octokit.Octokit,
  req: GithubReleaseAssetRequest
): Promise<GithubReleaseAsset> {
  const releases = await listReleases(client, req.owner, req.repo);
  if (!releases.length) {
    throw new Error(`No releases found for github.com/${req.owner}/${req.name}`);
  }

  const release = findRelease(releases, req.release);
  if (!release) {
    throw new Error(`github.com/${req.owner}/${req.repo}/releases/${req.release} does not exist`);
  }

  const assets = await listReleaseAssets(client, req.owner, req.repo, release.id);
  if (!assets.length) {
    throw new Error(
      `No assets found for github.com/${req.owner}/${req.name}/releases/${req.release}`
    );
  }

  const asset = findAsset(assets, req.name);
  if (!asset) {
    throw new Error(
      `No asset named "${req.name}" in github.com/${req.owner}/${req.name}/releases/${req.release}`
    );
  }
  return asset;
}

export function listReleases(
  client: octokit.Octokit,
  owner: string,
  repo: string
): Promise<GithubRelease[]> {
  return client.repos
    .listReleases({
      owner: owner,
      repo: repo,
    })
    .then(response => {
      return response.data;
    });
}

export function listReleaseAssets(
  client: octokit.Octokit,
  owner: string,
  repo: string,
  release_id: number
): Promise<GithubReleaseAsset[]> {
  return client.repos
    .listReleaseAssets({
      owner: owner,
      repo: repo,
      release_id: release_id,
    })
    .then(resp => {
      return resp.data;
    });
}

export function findRelease(
  releases: ReposListReleasesResponseData,
  tagName: string
): GithubRelease | undefined {
  return releases.find(release => release.tag_name === tagName) as unknown as
    | GithubRelease
    | undefined;
}

export function findAsset(assets: GithubReleaseAsset[], assetName: string): GithubReleaseAsset {
  return assets.find(a => a.name === assetName) as unknown as GithubReleaseAsset;
}

/**
 * Downloads a release asset from GitHub. Calls the progress callback with the
 * chunk length progressively.
 *
 * @param {string} url
 * @param {string} filename the output filename
 * @param {number} mode the file mode
 * @param {string} mode an optional sha256 to match
 * @returns {Promise<void>}
 */
export async function downloadAsset(
  url: string,
  filename: string,
  mode: number,
  sha256?: string
): Promise<void> {
  if (fs.existsSync(filename) && sha256) {
    if (sha256Matches(filename, sha256)) {
      return Promise.reject(`${filename} already exists and matches requested sha256 ${sha256}`);
    }
  }

  const tmpFile = tmp.fileSync();

  return new Promise<void>((resolve, reject) => {
    const headers: request.Headers = {
      Accept: 'application/octet-stream',
      'User-Agent': 'bazel-stack-vscode',
    };
    const token = getGithubToken();
    if (token) {
      headers['Authorization'] = 'token ' + token;
    }
    const src = request({
      url: url,
      method: 'GET',
      headers: headers,
    });

    const dst = fs.createWriteStream(tmpFile.name, {
      mode: mode,
    });

    pipeline(src, dst, (err: any) => {
      if (err) {
        reject(err);
        return;
      }
      if (sha256) {
        const actual = sha256File(tmpFile.name);
        if (actual !== sha256) {
          reject(`${tmpFile.name} did not match requested sha256: want ${sha256}, got ${actual}`);
          return;
        }
      }
      resolve();
    });
  }).then(() => {
    fs.chmodSync(tmpFile.name, mode);
    return new Promise((resolve, reject) => {
      mv(tmpFile.name, filename, { mkdirp: true }, err => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Renamed ${tmpFile.name} -> ${filename}`);
        tmpFile.removeCallback();
        setTimeout(() => resolve(), 250);
      });
    });
  });
}

function getGithubToken(): string | undefined {
  return process.env['GITHUB_TOKEN'];
}

function sha256Matches(filename: string, sha256: string): boolean {
  return sha256File(filename) === sha256;
}

export function processPlatformBinaryName(toolName: string) {
  return platformBinaryName(process.platform, toolName);
}

export function platformBinaryName(platform: string, toolName: string) {
  if (platform === 'win32') {
    return toolName + '.exe';
  }
  if (platform === 'darwin') {
    return toolName + '.mac';
  }
  return toolName;
}

export function platformOsArchBinaryName(arch: string, platform: string, toolName: string): string {
  let osName = 'linux';
  let osArch = 'amd64';
  let ext = '';

  if (platform === 'win32') {
    osName = 'windows';
    ext = '.exe';
  } else if (platform === 'darwin') {
    osName = 'darwin';
  } else {
    // assume linux, try and map os.arch()
    switch (arch) {
      case 'arm':
      case 'arm64':
        osArch = 'arm64';
        break;
    }
  }

  return `${toolName}-${osName}-${osArch}${ext}`;
}
