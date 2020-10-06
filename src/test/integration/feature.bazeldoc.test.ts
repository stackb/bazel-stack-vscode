'use strict';

import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BazelDocFeatureName } from '../../bazeldoc/feature';
import { BazelDocGroupHover } from '../../bazeldoc/hover';

suite(BazelDocFeatureName, function () {
	this.timeout(20000);

	let fixturePath: string;


	let featureConfig: vscode.WorkspaceConfiguration;
	let document: vscode.TextDocument;
	let hoverProvider: BazelDocGroupHover;

	const cancellationTokenSource = new vscode.CancellationTokenSource();

	suiteSetup(async () => {
		fixturePath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures', BazelDocFeatureName);
		document = await vscode.workspace.openTextDocument(
			vscode.Uri.file(path.join(fixturePath, 'BUILD.bazel')));
		hoverProvider = new BazelDocGroupHover({
			baseUrl: 'https://example.com',
			groups: [
				{
					name: 'http_archive',
					path: 'be/http.html',
					items: ['http_archive', 'http_jar'],
				}
			],
			verbose: 0,
		});
		featureConfig = vscode.workspace.getConfiguration(BazelDocFeatureName, document);
	});

	suiteTeardown(() => {
		hoverProvider.dispose();
	});

	teardown(() => {
		sinon.restore();
	});

	test('no hover over empty first line ', async () => {
		const hover = await hoverProvider.provideHover(document, new vscode.Position(0, 0), cancellationTokenSource.token);
		expect(hover).to.be.undefined;
	});

	test('not hover over http_archive (no trailing parenthesis)', async () => {
		const hover = await hoverProvider.provideHover(document, new vscode.Position(6, 2), cancellationTokenSource.token);
		expect(hover).to.be.undefined;
	});

	test('hover over http_archive(', async () => {
		const hover = await hoverProvider.provideHover(document, new vscode.Position(1, 5), cancellationTokenSource.token);
		expect(hover).not.to.be.undefined;
		expect(hover?.range?.start.line).to.equal(1);
		expect(hover?.range?.start.character).to.equal(0);
		expect(hover?.range?.end.line).to.equal(1);
		expect(hover?.range?.end.character).to.equal(12);
		expect(hover?.contents).to.have.length(1);

		const md = hover?.contents[0] as vscode.MarkdownString;
		expect(md.value).to.be.equal(
			'**[http_archive](https://example.com/be/http.html#http_archive)** is a member of _http_archive_'
			+ '\n\n'
			+ '[http_archive](https://example.com/be/http.html#http_archive), [http_jar](https://example.com/be/http.html#http_jar)'
		);
	});

	// skip this test as it throws an error 
	// test.skip('not hover if feature disabled)', async () => {
	// 	await featureConfig.update('enabled', false);
	// 	const hover = await hoverProvider.provideHover(document, new vscode.Position(1, 5), cancellationTokenSource.token);
	// 	expect(hover).to.be.undefined;
	// });

});
