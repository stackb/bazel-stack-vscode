'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import vscode = require('vscode');
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import { GitHubReleaseAssetDownloader, GithubReleaseAsset } from '../../download';
import { platformBinaryName } from '../../buildifier/feature';
import { fail } from 'assert';

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

    it('should download desired release asset', () => {
        const binaryName = platformBinaryName("buildifier");
        const releaseTag = "3.4.0";

        const downloader = new GitHubReleaseAssetDownloader({
            owner: "bazelbuild",
            repo: "buildtools",
            releaseTag: releaseTag,
            name: binaryName,
        }, tmpPath, true);

        const filepath = downloader.getFilepath();

        return downloader.download((completed: number) => {
            console.log(`${completed}%`);
        }).then(asset => {
            expect(fs.existsSync(filepath)).to.be.true;
            const releaseDir = path.dirname(filepath);
            expect(path.basename(filepath)).to.equal(binaryName);
            expect(path.basename(releaseDir)).to.equal(releaseTag);
            return exec(`${filepath} -version`)
                .then((resp: any) => {
                    expect(resp.stdout).to.contain(releaseTag);
                }).catch((err: any) => {
                    fail(`release check failed` + err, err);
                });
        }).finally(() => {
            downloader.dispose();
        });
    });
});
