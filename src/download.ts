"use strict";

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import downloadReleases from "@etclabscore/dl-github-releases";

export class GitHubReleaseAssetDownloader {
    constructor(
        private owner: string,
        private repo: string,
        private releaseTag: string,
        private assetName: string,
        private outputDir: string,
        private executable: boolean) {
    }

    /**
     * Return the path of the file that will be downloaded.
     * @param outputDir 
     */
    getFilepath(): string {
        return path.join(this.outputDir, this.releaseTag, this.assetName);
    }

    /**
     * Perform the download.
     */
    download(): Promise<string> {
        const filepath = this.getFilepath();
        const dirname = path.dirname(filepath);
        fs.mkdirSync(dirname, {
            recursive: true,
        });

        return new Promise((resolve, reject) => {
            downloadReleases(
                this.owner,
                this.repo,
                this.outputDir,
                withArgumentPropertyValue("tag_name", this.releaseTag),
                withArgumentPropertyValue("name", this.assetName),
            ).then(() => {
                if (!fs.existsSync(filepath)) {
                    throw new Error(`Downloader should have created file <${filepath}>.  `
                        + `Please check that release `
                        + `https://github.com/${this.owner}/${this.repo}/releases/${this.releaseTag} `
                        + `has an asset named "${this.assetName}".  `
                        + `If the release does not exist, check your extension settings.  `
                        + `If the release exists and asset exists this is likely a bug.  `
                        + `Please file an issue at https://github.com/stackb/bazel-stack-vscode/issues`);
                }
                if (this.executable) {
                    fs.chmodSync(filepath, "755");
                }
                vscode.window.showInformationMessage(
                    `${this.assetName} ${this.releaseTag} installed & ready`,
                );
                resolve(filepath);
            })
                .catch(err => reject(err));
        });
    }

}

/**
 * Return a function that expects a single (json-like) argument and checks that
 * the named property matches the expected value.  We use this convoluted
 * approach to make tsc happy because the definition of the filterRelease and
 * filterAsset signature of the downloadRelease function don't seem to want an
 * argument even though they actually do.
 *
 * @param name The property name to be accessed
 * @param value The expected value of the property
 */
function withArgumentPropertyValue(name: string, value: string): () => boolean {
    return function(): boolean {
        if (!arguments.length) {
            throw new Error(`Expected filter function to be provided at least one argument`);
        }
        const obj = arguments[0];
        if (obj[name] === value) {
            return true;
        }
        return false;
    };
}

