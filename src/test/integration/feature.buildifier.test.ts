'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BuildifierConfiguration } from '../../buildifier/configuration';
import { BuildifierFeatureName, maybeInstallBuildifier, versionedPlatformBinaryName } from '../../buildifier/feature';
import { BuildifierFormatter } from '../../buildifier/formatter';

suite(BuildifierFeatureName, function () {
	this.timeout(20000);

	let tmpPath: string;
	let fixturePath: string;

	let formatter: BuildifierFormatter;
	let formattingOptions: vscode.FormattingOptions;

	const cancellationTokenSource = new vscode.CancellationTokenSource();

	suiteSetup(async () => {
		tmpPath = path.join(os.tmpdir(), 'buildifier');
		const cfg: BuildifierConfiguration = {
			owner: 'bazelbuild',
			repo: 'buildtools',
			releaseTag: '4.0.1',
			executable: '',
			fixOnFormat: true,
			verbose: 0,
		};

		cfg.executable = await maybeInstallBuildifier(cfg, tmpPath);

		fixturePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures', BuildifierFeatureName);
		formatter = new BuildifierFormatter(cfg);
		formattingOptions = {
			tabSize: 4,
			insertSpaces: true,
		};
	});

	suiteTeardown(async () => {
		await fs.remove(tmpPath);
		formatter.dispose();
	});

	teardown(() => {
		sinon.restore();
	});

	test('will not make edits on preformatted file', async () => {
		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'preformatted.bzl')));
		const edits = await formatter.provideDocumentFormattingEdits(document, formattingOptions, cancellationTokenSource.token);
		console.log(`${process.platform} edits:\n${JSON.stringify(edits, null, 2)}`);
		// actually, on windows it will replace \n -> \r\n
		expect(edits).to.have.length(process.platform === 'win32' ? 1 : 0);
	});

	test('will make edits on unformatted file', async () => {
		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'unformatted.bzl')));
		const edits = await formatter.provideDocumentFormattingEdits(document, formattingOptions, cancellationTokenSource.token);
		expect(edits).to.have.length(1);
		expect(edits[0].range.start.line).to.equal(0);
		expect(edits[0].range.start.character).to.equal(0);
		expect(edits[0].range.end.line).to.equal(5);
		expect(edits[0].range.end.character).to.equal(0);
		// no need to test buildifier itself, just trust that the edit is
		// correct, but provide enought context here to remember what is is
		// supposed to be.
		expect(edits[0].newText.slice(0, 18)).to.be.equal('load("@bazel_tools'); //...
	});
});


suite('versionedPlatformBinaryName', function () {
	interface TestCase {
		name: string // test name
		arch: string // os architecture
		platform: string // os platform
		tool: string // tool name
		version: string // semver string
		want: string // desired output string
	}

	const cases: TestCase[] = [
		{
			name: 'linux 3.5.0',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'linux',
			version: '3.5.0',
			want: 'buildifier',
		},
		{
			name: 'linux 3.5.0 (arm64)',
			tool: 'buildifier',
			arch: 'arm64',
			platform: 'linux',
			version: '3.5.0',
			want: 'buildifier',
		},
		{
			name: 'mac 3.5.0 ',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'darwin',
			version: '3.5.0',
			want: 'buildifier.mac',
		},
		{
			name: 'windows 3.5.0 ',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'win32',
			version: '3.5.0',
			want: 'buildifier.exe',
		},
		{
			name: 'linux 4.0.1',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'linux',
			version: '4.0.1',
			want: 'buildifier-linux-amd64',
		},
		{
			name: 'linux 4.0.1 (arm64)',
			tool: 'buildifier',
			arch: 'arm64',
			platform: 'linux',
			version: '4.0.1',
			want: 'buildifier-linux-arm64',
		},
		{
			name: 'mac 4.0.1 ',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'darwin',
			version: '4.0.1',
			want: 'buildifier-darwin-amd64',
		},
		{
			name: 'windows 4.0.1 ',
			tool: 'buildifier',
			arch: 'x64',
			platform: 'win32',
			version: '4.0.1',
			want: 'buildifier-windows-amd64.exe',
		}

	];

	cases.forEach(tc => {
		test(tc.name, () =>
			expect(versionedPlatformBinaryName(tc.arch, tc.platform, tc.tool, tc.version)).to.eq(tc.want)
		);
	});
});

