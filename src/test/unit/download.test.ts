'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import { fail } from 'assert';
import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import {
  GitHubReleaseAssetDownloader,
  platformBinaryName,
  platformOsArchBinaryName,
} from '../../download';
import { versionedPlatformBinaryName } from '../../buildifier/settings';

const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('download', function () {
  this.timeout(20000);

  let tmpPath: string;

  beforeEach(async () => {
    tmpPath = path.join(os.tmpdir(), 'download');
  });

  afterEach(async () => {
    await fs.remove(tmpPath);
  });

  it('should download desired release asset', async () => {
    const release = '4.0.1';
    const binaryName = versionedPlatformBinaryName(
      os.arch(),
      process.platform,
      'buildifier',
      release
    );

    const downloader = new GitHubReleaseAssetDownloader(
      {
        owner: 'bazelbuild',
        repo: 'buildtools',
        release: release,
        name: binaryName,
      },
      tmpPath,
      true
    );

    const filepath = downloader.getFilepath();

    await downloader.download();

    expect(fs.existsSync(filepath)).to.be.true;
    const releaseDir = path.dirname(filepath);
    expect(path.basename(filepath)).to.equal(binaryName);
    expect(path.basename(releaseDir)).to.equal(release);
    return exec(`${filepath} -version`)
      .then((resp: any) => {
        expect(resp.stdout).to.contain(release);
      })
      .catch((err: any) => {
        fail('release check failed' + err, err);
      });
  });
});

describe('platformBinaryName', function () {
  interface TestCase {
    name: string; // test name
    platform: string; // os platform
    tool: string; // tool name
    want: string; // desired output string
  }

  const tests: TestCase[] = [
    {
      name: 'linux',
      tool: 'buildifier',
      platform: 'linux',
      want: 'buildifier',
    },
    {
      name: 'mac',
      tool: 'buildifier',
      platform: 'darwin',
      want: 'buildifier.mac',
    },
    {
      name: 'windows',
      tool: 'buildifier',
      platform: 'win32',
      want: 'buildifier.exe',
    },
  ];

  tests.forEach(test => {
    it(test.name, () => expect(platformBinaryName(test.platform, test.tool)).to.eq(test.want));
  });
});

describe('platformOsArchBinaryName', function () {
  interface TestCase {
    name: string; // test name
    tool: string; // tool name
    arch: string; // os architecture
    platform: string; // os platform
    want: string; // desired output string
  }

  const tests: TestCase[] = [
    {
      name: 'linux',
      tool: 'buildifier',
      arch: 'x64',
      platform: 'linux',
      want: 'buildifier-linux-amd64',
    },
    {
      name: 'linux (arm64)',
      tool: 'buildifier',
      arch: 'arm64',
      platform: 'linux',
      want: 'buildifier-linux-arm64',
    },
    {
      name: 'mac',
      tool: 'buildifier',
      arch: 'x64',
      platform: 'darwin',
      want: 'buildifier-darwin-amd64',
    },
    {
      name: 'windows',
      tool: 'buildifier',
      arch: 'x64',
      platform: 'win32',
      want: 'buildifier-windows-amd64.exe',
    },
  ];

  tests.forEach(test => {
    it(test.name, () =>
      expect(platformOsArchBinaryName(test.arch, test.platform, test.tool)).to.eq(test.want)
    );
  });
});
