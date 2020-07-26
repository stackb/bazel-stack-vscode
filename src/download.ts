"use strict";

import * as fs from 'fs';
import * as path from 'path';
import * as request from 'request';
import * as vscode from 'vscode';
import * as octokit from "@octokit/rest";
import { ReposListReleasesResponseData } from "@octokit/types";

const USER_AGENT = "bazel-stack-vscode";

/**
 * Configuration type that describes a desired asset from a gh release.
 */
export type GithubReleaseAssetRequest = {
    /**
     * The gh owner (e.g. "bazelbuild").
     */
    owner: string,

    /**
     * The gh repository name (e.g. "buildtools").
     */
    repo: string,

    /**
     * The tag name of the release (e.g. "3.3.0").
     */
    releaseTag: string,

    /**
     * The name of the asset to download (e.g. "buildifier.exe").
     */
    name: string,
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

export class GitHubReleaseAssetDownloader implements vscode.Disposable {
    private status: vscode.StatusBarItem | undefined;
    private lastPercentage: number = 0;
    private resetTimout: any;
    private statusLabel: string;

    constructor(
        private req: GithubReleaseAssetRequest,
        private outputDir: string,
        private executable: boolean,
    ) {
        this.statusLabel = `${req.name} ${req.releaseTag}`;
    }

    updateProgress(percentage: number) {
        if (!this.status) {
            this.status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
            this.status.text = this.statusLabel;
            this.status.show();
        }
        if (typeof this.lastPercentage === 'undefined') {
            this.status.text = this.statusLabel;
        } else {
            this.status.text = typeof percentage === 'number' ? `${this.statusLabel} ${percentage}%` : this.statusLabel;
        }
        if (percentage === 100 && typeof this.lastPercentage !== 'undefined') {
            this.resetProgress();
        }
        this.lastPercentage = percentage;
    }

    resetProgress() {
        const status = this.status;
        if (!status) {
            return;
        }
        status.text = `${this.statusLabel} ✓`;

        clearTimeout(this.resetTimout);

        this.resetTimout = setTimeout(() => status.text = this.statusLabel, 5000);
    }


    /**
     * Return the path of the file that will be downloaded.
     * @param outputDir 
     */
    getFilepath(): string {
        return path.join(this.outputDir, this.req.releaseTag, this.req.name);
    }


    newOctokit(): octokit.Octokit {
        const args: any = {
            userAgent: 'bazel-stack.vscode',
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
    async download(progress: (pct: number) => void): Promise<GithubReleaseAsset> {
        const filepath = this.getFilepath();
        fs.mkdirSync(path.dirname(filepath), {
            recursive: true,
        });
        const client = this.newOctokit();
        const asset = await getReleaseAsset(client, this.req);
        const total = asset.size;
        let current = 0;
        await downloadAsset(asset.url, filepath, (chunkSize: number) => {
            current += chunkSize;
            const pct = (current / total) * 100;
            progress(Math.round(pct * 100) / 100);
        });
        if (!fs.existsSync(filepath)) {
            throw new Error(`Downloader should have created file <${filepath}>.  `
                + `Please check that release `
                + `https://github.com/${this.req.owner}/${this.req.repo}/releases/${this.req.releaseTag} `
                + `has an asset named "${this.req.name}".  `
                + `If the release does not exist, check your extension settings.  `
                + `If the release exists and asset exists this is likely a bug.  `
                + `Please file an issue at https://github.com/stackb/bazel-stack-vscode/issues`);
        }
        if (this.executable) {
            fs.chmodSync(filepath, "755");
        }
        return asset;
    }

    dispose() {
        if (this.status) {
            this.status.dispose();
            delete (this.status);
        }
    }
}

export async function getReleaseAsset(client: octokit.Octokit, req: GithubReleaseAssetRequest): Promise<GithubReleaseAsset> {
    const releases = await listReleases(client, req.owner, req.repo);
    if (!releases.length) {
        return Promise.reject(`No releases found for github.com/${req.owner}/${req.name}`);
    }

    const release = findRelease(releases, req.releaseTag);
    if (!release) {
        return Promise.reject(`github.com/${req.owner}/${req.name} does not have a release tagged "${req.releaseTag}"`);
    }

    const assets = await listReleaseAssets(client, req.owner, req.repo, release.id);
    if (!assets.length) {
        return Promise.reject(`No assets found for github.com/${req.owner}/${req.name}/releases/${req.releaseTag}`);
    }

    const asset = findAsset(assets, req.name);
    if (!asset) {
        return Promise.reject(`No asset named "${req.name}" in github.com/${req.owner}/${req.name}/releases/${req.releaseTag}`);
    }
    return asset;
}

export function listReleases(client: octokit.Octokit, owner: string, repo: string): Promise<GithubRelease[]> {
    return client.repos.listReleases({
        owner: owner,
        repo: repo,
    }).then(response => {
        return response.data;
    });
}

export function listReleaseAssets(client: octokit.Octokit, owner: string, repo: string, release_id: number): Promise<GithubReleaseAsset[]> {
    return client.repos.listReleaseAssets({
        owner: owner,
        repo: repo,
        release_id: release_id,
    }).then(resp => {
        return resp.data;
    });
}

export function findRelease(releases: ReposListReleasesResponseData, tagName: string): GithubRelease | undefined {
    return releases.find(release => release.tag_name === tagName) as unknown as GithubRelease | undefined;
}

export function findAsset(assets: GithubReleaseAsset[], assetName: string): GithubReleaseAsset {
    return assets.find(a => a.name === assetName) as unknown as GithubReleaseAsset;
}


/**
 * Downloads a release asset from GitHub. Calls the progress callback with the
 * chunk length progressively.
 *
 * @param {string} url
 * @param {string} the output filename
 * @param {function} callback function that takes the number of bytes in the
 * current data chunk.
 * @returns {Promise<void>}
 */
export async function downloadAsset(url: string, filename: string, progress: (total: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filename);
        const headers: request.Headers = {
            Accept: "application/octet-stream",
            "User-Agent": "bazel-stack-vscode",
        };
        const token = getGithubToken();
        if (token) {
            headers['Authorization'] = 'token ' + token;
        }
        const req = request({
            url: url,
            method: "GET",
            headers: headers,
        });
        req.pipe(fileStream);
        req.on('data',
            chunk => progress(chunk.length));
        req.on('error',
            err => reject(`could not download asset from url ${url}: ${err}`));
        req.on('end',
            () => resolve());
    });
}

function getGithubToken(): string | undefined {
    return process.env['GITHUB_TOKEN'];
}
