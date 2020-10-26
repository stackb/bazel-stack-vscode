'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import fs = require('graceful-fs');
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

		let executable = downloader.getFilepath();
		if (!fs.existsSync(executable)) {
			await downloader.download();
		}

		client = new StardocLSPClient(executable, command, 'LSP Test Instance').getLanguageClientForTesting();
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
		let expected: lsclient.InitializeResult = {
			capabilities: {
				textDocumentSync: 1,
				hoverProvider: true,
				definitionProvider: true,
			}
		};
		expect(client.initializeResult).eql(expected);
	});

	describe('Hover', () => {

		type hoverTest = {
			d: string, // test description
			input: string, // content of file
			col: number, // apparent hover position 
			match?: string, // expected markdown string
			range?: vscode.Range, // the expected range, if we care
		};
		
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
				const filename = tmp.tmpNameSync({ postfix: '.BUILD' });
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

	describe('Definition', () => {

		type definitionTest = {
			d: string, // test description
			input: string, // content of file
			files: { [key: string]: string }, // mock files to setup
			line: number,
			col: number, // apparent document position 
			location?: string, // expected location string
			range?: vscode.Range, // the expected range, if we care
		};
		
		const cases: definitionTest[] = [
			{
				d: 'should not locate empty line',
				input: '',
				line: 1,
				col: 2,
				files: {
					'WORKSPACE': '',
					'BUILD.bazel': 'THIS'
				},
			},
			//
			// TODO: need to figure out how to initialize the LSP implementation
			// with the correct cwd.  For now, relying on tests in the upstream
			// gostarlark repo.
			//
			// {
			// 	d: 'should locate source file in current directory',
			// 	input: '"file.txt"',
			// 	files: {
			// 		'WORKSPACE': '',
			// 		'BUILD.bazel': 'THIS',
			// 		'file.txt': '',
			// 	},
			// 	line: 1,
			// 	col: 1,
			// },
		];

		cases.forEach((tc) => {
			it(tc.d, async () => {
				const tmpDir = tmp.dirSync();
				let thisFile = '';
				for (const relname of Object.keys(tc.files)) {
					const filename = path.join(tmpDir.name, relname);
					fs.mkdirSync(path.dirname(filename), {
						recursive: true,
					});
					let content = tc.files[relname];
					if (content === 'THIS') {
						content = tc.input;
						thisFile = filename;
					}
					fs.writeFileSync(filename, content);
				}
				if (!thisFile) {
					throw new Error('target build file no defined');
				}
				const uri = vscode.Uri.file(thisFile);
				const document = await vscode.workspace.openTextDocument(uri);
				const position = new vscode.Position(tc.line - 1, tc.col - 1);
				const provider = client.getFeature(lsclient.DefinitionRequest.method).getProvider(document);
				expect(provider).not.to.be.undefined;

				const locs = await provider.provideDefinition(document, position, tokenSource.token);
				if (!locs) {
					fail('expected defined locs result');
				}
				if (!tc.location) {
					expect(locs).to.have.length(0);
					return;
				}
				const locations: vscode.Location[] = locs as vscode.Location[];
				expect(locations).not.to.be.undefined;
				expect(locations?.length).greaterThan(0); // first one is the prototype, second one is the doc
				const location = locations[0];
				expect(location.uri.toString()).to.eql(tc.location);
				if (tc.range) {
					expect(tc.range.start.line).equals(location.range?.start.line);
					expect(tc.range.start.character).equals(location.range?.start.character);
					expect(tc.range.end.line).equals(location.range?.end.line);
					expect(tc.range.end.character).equals(location.range?.end.character);
				}
			});
		});
	});

});
