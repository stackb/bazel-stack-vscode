'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import vscode = require('vscode');
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { GitHubReleaseAssetDownloader, GithubReleaseAsset } from '../../download';
import { platformBinaryName } from '../../buildifier/feature';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);


describe('download', function () {
    this.timeout(20000);

    let tmpPath: string;

    beforeEach(async () => {
		tmpPath = path.join(os.tmpdir(), "download");
	});

	afterEach(async () => {
		await fs.remove(tmpPath);
	});

    it.only('should download desired release asset', async () => {
        const binaryName = platformBinaryName("buildifier");
        const releaseTag = "3.4.0";

        const downloader = new GitHubReleaseAssetDownloader({
            owner: "bazelbuild",
            repo: "buildtools",
            releaseTag: releaseTag,
            name: binaryName,
        }, tmpPath, true);

        const filepath = downloader.getFilepath();
        let asset: GithubReleaseAsset | undefined;

        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Downloading Buildifier'
        }, async progress => {
            progress.report({ message: `Downloading ${binaryName} ${releaseTag}...` });
            asset = await downloader.download((size: number) => {
                console.log(`chunk ${size}`);
            });
        });
    
        console.log(asset);
        const releaseDir = path.dirname(filepath);
        expect(path.basename(filepath)).to.equal(binaryName);
        expect(path.basename(releaseDir)).to.equal(releaseTag);

        expect(fs.existsSync(filepath)).to.be.true;

        const resp = await exec(`${filepath} -version`);
        expect(resp.stdout).to.equal(`buildifier version: 3.4.0 \nbuildifier scm revision: b1667ff58f714d13c2bba6823d6c52214705508f \n`);

        downloader.dispose();
    });
});
