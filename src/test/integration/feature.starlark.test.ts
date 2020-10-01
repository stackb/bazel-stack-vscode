'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import fs = require('fs');
import os = require('os');
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import { fail } from 'assert';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import * as lsclient from 'vscode-languageclient';
import { LanguageClient } from 'vscode-languageclient';
import { platformBinaryName } from '../../constants';
import { GitHubReleaseAssetDownloader } from '../../download';
import { StardocLSPClient } from '../../starlark/client';
import { StarlarkLSPFeatureName } from '../../starlark/feature';

const packageJson: any = require('../../../package');
const keepTmpDownloadDir = true;

tmp.setGracefulCleanup();

type hoverTest = {
	d: string, // test description
	input: string, // content of file
	col: number, // apparent hover position 
	match?: string, // expected markdown string
	range?: vscode.Range, // the expected range, if we care
};

describe(StarlarkLSPFeatureName, function () {
	this.timeout(60 * 1000); // for download

	let downloadDir: string;
	let client: LanguageClient;
	const tokenSource = new vscode.CancellationTokenSource();

	before(async () => {
		const properties: any = packageJson.contributes.configuration.properties;
		const owner = properties['bsv.starlark.lsp.github-owner'].default as string;
		const repo = properties['bsv.starlark.lsp.github-repo'].default as string;
		const release = properties['bsv.starlark.lsp.github-release'].default as string;
		const command = properties['bsv.starlark.lsp.server.command'].default as string[];

		// something like:
		// /var/folders/ft/hhfr3jns16n3g89p5j86zy6h0000gn/T/bsv.starlark.lsp/stackb/bazel-stack-vscode
		downloadDir = path.join(os.tmpdir(), StarlarkLSPFeatureName, owner, repo);

		const downloader = new GitHubReleaseAssetDownloader({
			owner: owner,
			repo: repo,
			releaseTag: release,
			name: platformBinaryName('gostarlark'),
		}, downloadDir, true);

		const executable = downloader.getFilepath();
		if (!fs.existsSync(executable)) {
			await downloader.download();
		}

		client = new StardocLSPClient(executable, command).getLanguageClientForTesting();
		client.start();
		await client.onReady();
	});

	after(async () => {
		await client.stop();
		if (!keepTmpDownloadDir) {
			fs.rmdirSync(downloadDir, {
				recursive: true,
			});
		}
	});

	it('InitializeResult', () => {
		let expected = {
			capabilities: {
				textDocumentSync: 1,
				hoverProvider: true,
			}
		};
		expect(client.initializeResult).eql(expected);
	});

	describe('Hover', () => {
		const cases: hoverTest[] = [
			{
				d: 'should miss empty line',
				input: '',
				col: 1,
			},
			{
				d: 'should miss comment line',
				input: "# len('')",
				col: 4,
			},
			{
				d: 'should hit builtin function (leading edge)',
				input: "len('')",
				col: 1,
				match: 'len(x)',
				range: new vscode.Range(
					new vscode.Position(0, 0),
					new vscode.Position(0, 7), // todo: should this be more limited?
				),
			},
			{
				d: 'should hit builtin function (trailing edge)',
				input: "len('')", // len|('')
 				col: 4, 
				match: 'len(x)',
			},
			{
				d: 'should hit builtin string function (leading edge)',
				input: "'a'.upper()",
 				col: 5, 
				match: '.upper()',
			},
			{
				d: 'should hit builtin string function (trailing edge)',
				input: "'a'.upper()", // 'a'.upper|()
 				col: 10, 
				match: '.upper()',
			},
			{
				d: 'should hit builtin function (more complex expr)',
				input: "strLen = len('')",
 				col: 11, 
				match: 'len(x)',
			},
			{
				d: 'should hit top-level-module (leading edge)',
				input: 'attr',
 				col: 1, 
				match: 'This is a top-level module',
			},
			{
				d: 'should hit top-level-module (trailing edge)',
				input: 'attr',
 				col: 5, 
				match: 'This is a top-level module',
			},
			{
				d: 'should hit top-level-module (trailing edge)',
				input: 'attr',
 				col: 5, 
				match: 'This is a top-level module',
			},
			{
				d: 'should hit top-level-module in dot-expr (leading edge)',
				input: 'attr.string()',
 				col: 1, 
				match: 'This is a top-level module',
			},
			{
				d: 'should hit top-level-module in dot-expr (trailing edge)',
				input: 'attr.string()',
 				col: 5, 
				match: 'This is a top-level module',
			},
			{
				d: 'should hit top-level-module function in dot-expr (leading edge)',
				input: 'attr.string()',
 				col: 6, 
				match: 'attr.string(default, doc, mandatory, values)',
			},
			{
				d: 'should hit top-level-module function in dot-expr (leading edge)',
				input: 'attr.string()',
 				col: 12, 
				match: 'attr.string(default, doc, mandatory, values)',
			},
			{
				d: 'should hit top-level-module function in dot-expr (extra space)',
				input: 'attr. string ()',
 				col: 7, 
				match: 'attr.string(default, doc, mandatory, values)',
			},
			{
				d: 'should hit load stmt (leading edge)',
				input: "load('module', 'foo')",
 				col: 1, 
				match: 'Use the load statement to import a symbol from an extension',
			},
			{
				d: 'should hit load stmt (tailing edge)',
				input: "load('module', 'foo')",
 				col: 21, 
				match: 'Use the load statement to import a symbol from an extension',
			},
			{
				d: 'should hit bazel global',
				input: 'select()',
 				col: 1, 
				match: 'select(x, no_match_error)',
			},
			{
				d: 'should hit bazel rule',
				input: 'genrule()',
 				col: 1, 
				match: 'genrule(srcs, outs, cmd',
			},
			{
				d: 'should hit bazel rule attribute',
				input: 'genrule(srcs = [])',
 				col: 9, 
				match: 'srcs = "?"',
			},
			{
				d: "bazel rule 'name' attribute is not documented",
				input: "genrule(name = '')",
 				col: 9,
			},
		];
	
		cases.forEach((tc) => {
			it(tc.d, async () => {
				const filename = tmp.tmpNameSync({ postfix: '.bazel' });
				fs.writeFileSync(filename, tc.input);
				const uri = vscode.Uri.file(filename);
				const document = await vscode.workspace.openTextDocument(uri);
				const position = new vscode.Position(0, tc.col - 1);

				const provider = client.getFeature(lsclient.HoverRequest.method).getProvider(document);
				expect(provider).not.to.be.undefined;

				const hover = await provider.provideHover(document, position, tokenSource.token);
				if (!hover) {
					fail('expected defined hover result');
				}				
				if (!tc.match) {
					expect(hover.contents).to.have.length(0);
					return;
				}

				expect(hover).not.to.be.undefined;
				expect(hover?.contents.length).greaterThan(0); // first one is the prototype, second one is the doc
				const content = hover?.contents[0] as vscode.MarkdownString;
				expect(content.value).to.contain(tc.match);
				if (tc.range) {
					expect(tc.range.start.line).equals(hover?.range?.start.line);
					expect(tc.range.start.character).equals(hover?.range?.start.character);
					expect(tc.range.end.line).equals(hover?.range?.end.line);
					expect(tc.range.end.character).equals(hover?.range?.end.character);
				}
			});
		});
	});
	
});
