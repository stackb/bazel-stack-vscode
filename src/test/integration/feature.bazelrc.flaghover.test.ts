'use strict';

import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BazelrcFeatureName } from '../../bazelrc/feature';
import { BazelFlagSupport } from '../../bazelrc/flags';

type flagHoverTest = {
	d: string, // test description
	pos: vscode.Position, // hover position in the test file
	match: string | undefined, // expected markdown string
};

suite.only(BazelrcFeatureName, function () {
	this.timeout(20000);

	let fixturePath: string;

	let document: vscode.TextDocument;
	let hoverProvider: BazelFlagSupport;

	const cancellationTokenSource = new vscode.CancellationTokenSource();

	suiteSetup(async () => {
		fixturePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures', BazelrcFeatureName);
		const protoPath = path.join(__dirname, '..', '..', '..', 'proto', 'bazel_flags.proto');
		const infoPath = path.join(__dirname, '..', '..', '..', 'flaginfo', 'bazel.flaginfo');

		document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'flaghovertest.bazelrc')));
		hoverProvider = new BazelFlagSupport({
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

	const cases: flagHoverTest[] = [
		{
			d: "should miss comment line",
			pos: new vscode.Position(0, 0),
			match: undefined,
		},
		{
			d: "should miss --config in comment line",
			pos: new vscode.Position(0, 8),
			match: undefined,
		},
		{
			d: "should hit --config (leading edge)",
			pos: new vscode.Position(1, 8),
			match: "--config",
		},
		{
			d: "should hit --config (trailing edge)",
			pos: new vscode.Position(1, 13),
			match: "--config",
		},
		{
			d: "should miss --config (after trailing edge)",
			pos: new vscode.Position(1, 14),
			match: undefined,
		},
	];

	cases.forEach((tc) => {
		test(tc.d, async () => {
			const hover = await hoverProvider.provideHover(document, tc.pos, cancellationTokenSource.token);
			if (tc.match) {
				expect(hover).not.to.be.undefined;
				expect(hover?.contents.length).eq(1);
				const content = hover?.contents[0] as vscode.MarkdownString;
				expect(content.value).to.contain(tc.match);
			} else {
				expect(hover).to.be.undefined;
			}
		});
	});

	// test('not hover over http_archive (no trailiing parenthesis)', async () => {
	// 	const hover = await hoverProvider.provideHover(document, new vscode.Position(6, 2), cancellationTokenSource.token);
	// 	expect(hover).to.be.undefined;
	// });

	// test.only('hover over --config(', async () => {
	// 	const hover = await hoverProvider.provideHover(document, new vscode.Position(2, 10), cancellationTokenSource.token);
	// 	expect(hover).not.to.be.undefined;
	// 	expect(hover?.range?.start.line).to.equal(2);
	// 	expect(hover?.range?.start.character).to.equal(9);
	// 	expect(hover?.range?.end.line).to.equal(2);
	// 	expect(hover?.range?.end.character).to.equal(15);
	// 	expect(hover?.contents).to.have.length(1);

	// 	const md = hover?.contents[0] as vscode.MarkdownString;
	// 	expect(md.value).to.be.contain(`config`);
	// });

});
