'use strict';

import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BazelrcFeatureName } from '../../bazelrc/feature';
import { BazelFlagHover } from '../../bazelrc/flaghover';

suite(BazelrcFeatureName, function () {
	this.timeout(20000);

	let fixturePath: string;

	let document: vscode.TextDocument;
	let hoverProvider: BazelFlagHover;

	const cancellationTokenSource = new vscode.CancellationTokenSource();

	suiteSetup(async () => {
		fixturePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures', BazelrcFeatureName);
		const protoPath = path.join(__dirname, '..', '..', '..', 'src', 'proto', 'bazel_flags.proto');
		const infoPath = path.join(__dirname, '..', '..', '..', 'flaginfo', 'bazel.flaginfo');

		document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'flaghovertest.bazelrc')));
		hoverProvider = new BazelFlagHover({
			protofile: protoPath,
			infofile: infoPath,
		});
		await hoverProvider.load();
	});

	suiteTeardown(() => {
	});

	teardown(() => {
		sinon.restore();
	});

	test('no hover over comment ', async () => {
		const hover = await hoverProvider.provideHover(document, new vscode.Position(0, 8), cancellationTokenSource.token);
		expect(hover).to.be.undefined;
	});

	// test('not hover over http_archive (no trailiing parenthesis)', async () => {
	// 	const hover = await hoverProvider.provideHover(document, new vscode.Position(6, 2), cancellationTokenSource.token);
	// 	expect(hover).to.be.undefined;
	// });

	test.only('hover over --config(', async () => {
		const hover = await hoverProvider.provideHover(document, new vscode.Position(2, 10), cancellationTokenSource.token);
		expect(hover).not.to.be.undefined;
		expect(hover?.range?.start.line).to.equal(2);
		expect(hover?.range?.start.character).to.equal(9);
		expect(hover?.range?.end.line).to.equal(2);
		expect(hover?.range?.end.character).to.equal(15);
		expect(hover?.contents).to.have.length(1);

		const md = hover?.contents[0] as vscode.MarkdownString;
		expect(md.value).to.be.contain(`config`);
	});

});
