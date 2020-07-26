'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BuildifierConfiguration } from '../../buildifier/configuration';
import { BuildifierFormatter } from '../../buildifier/formatter';
import { BuildifierFeatureName, maybeInstallBuildifier } from '../../buildifier/feature';

suite(BuildifierFeatureName, function () {
	this.timeout(20000);

	let tmpPath: string;
	let fixturePath: string;

	let formatter: BuildifierFormatter;
	let formattingOptions: vscode.FormattingOptions;

	const cancellationTokenSource = new vscode.CancellationTokenSource();

	suiteSetup(async () => {
		tmpPath = path.join(os.tmpdir(), "buildifier");
		const cfg: BuildifierConfiguration = {
			owner: "bazelbuild",
			repo: "buildtools",
			releaseTag: "3.3.0",
			executable: "",
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
	});

	teardown(() => {
		sinon.restore();
	});

	test('will not make edits on preformatted file', async () => {
		const document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'preformatted.bzl')));
		const edits = await formatter.provideDocumentFormattingEdits(document, formattingOptions, cancellationTokenSource.token);
		console.log(`edits:\n${JSON.stringify(edits, null, 2)}`);
		// actually, on windows it will replace \n -> \r\n
		if (process.platform === "win32") {
			expect(edits).to.have.length(1);
		} {
			expect(edits).to.have.length(0);
		}
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
		expect(edits[0].newText.slice(0, 18)).to.be.equal(`load("@bazel_tools`); //...
	});

});
