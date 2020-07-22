"use strict";

import * as vscode from 'vscode';
import * as fs from 'fs';
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

    // The ts.d does not seem to want an argument, so we fallback to 'arguments'
    // to make tsc happy.
    filterRelease(): boolean {
        const release = arguments[0];
        return release.tag_name === this.releaseTag;
    }

    // The ts.d does not seem to want an argument, so we fallback to 'arguments'
    // to make tsc happy.
    filterAsset() {
        const asset = arguments[0];
        // console.log(`checking asset`, asset);
        return asset.name === this.assetName;
    }

    /**
     * Return the path of the file that will be downloaded.
     * @param outputDir 
     */
    getFilepath(): string {
        return `${this.outputDir}/${this.releaseTag}/${this.assetName}`;
    }

    /**
     * Perform the download.
     */
    download(): Promise<string> {
        const filepath = this.getFilepath();

        return new Promise((resolve, reject) => {
            downloadReleases(this.owner, this.repo, this.outputDir, this.filterRelease, this.filterAsset)
                .then(() => {
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
