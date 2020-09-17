'use strict';

import fs = require('fs');
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { BazelrcCodelens, RunContext } from '../../bazelrc/codelens';
import { BazelrcFeatureName } from '../../bazelrc/feature';
import { BazelFlagSupport } from '../../bazelrc/flags';

tmp.setGracefulCleanup();

type flagHoverTest = {
	d: string, // test description
	input: string, // content of file
	col: number, // apparent hover position 
	match?: string, // expected markdown string
	range?: vscode.Range, // the expected range, if we care
};

type flagCompletionTest = {
	d: string, // test description
	input: string, // content of file
	triggerKind?: vscode.CompletionTriggerKind, // trigger context
	triggerCharacter?: string, // trigger context
	numItems?: number, // expected number of completion items
};

type codelensTest = {
	d: string, // test description
	input: string, // content of file
	numItems?: number, // expected number of codelens items
	command?: vscode.Command, // expected command
	range?: vscode.Range, // the expected range, if we care
};

describe(BazelrcFeatureName, function () {
	let support: BazelFlagSupport;
	let codelens: BazelrcCodelens;
	const cancellationTokenSource = new vscode.CancellationTokenSource();

	before(async () => {
		const protoPath = path.join(__dirname, '..', '..', '..', 'proto', 'bazel_flags.proto');
		const infoPath = path.join(__dirname, '..', '..', '..', 'flaginfo', 'bazel.flaginfo');
		support = new BazelFlagSupport({
			protofile: protoPath,
			infofile: infoPath,
		});
		await support.load();
		codelens = new BazelrcCodelens('bazel');
        await codelens.setup(true); // skip install commands
	});

	after(() => {
		support.dispose();
		codelens.dispose();
	});

	describe('hover', () => {
		const cases: flagHoverTest[] = [
			{
				d: 'should miss empty line',
				input: '',
				col: 1,
			},
			{
				d: 'should miss before token boundary start',
				input: ' --config',
				col: 1,
			},
			{
				d: 'should hit at token boundary start',
				input: ' --config',
				col: 2,
				match: '--config',
				range: new vscode.Range(
					new vscode.Position(0, 1),
					new vscode.Position(0, 9),
				),
			},
			{
				d: 'should hit at token boundary end',
				input: ' --config',
				col: 10,
				match: '--config',
			},
			{
				d: 'should miss after token boundary end',
				input: ' --config',
				col: 11,
			},
			{
				d: 'should miss before token boundary start (abbrev)',
				input: ' -j',
				col: 1,
			},
			{
				d: 'should hit at token boundary start (abbrev)',
				input: ' -j',
				col: 2,
				match: '--jobs',
				range: new vscode.Range(
					new vscode.Position(0, 1),
					new vscode.Position(0, 3),
				),
			},
			{
				d: 'should hit at token boundary end (abbrev)',
				input: ' -j',
				col: 4,
				match: '--jobs',
			},
			{
				d: 'should miss after token boundary end (abbrev)',
				input: ' -j ',
				col: 5,
			},
			{
				d: 'also matches inside a comment line',
				input: '# --config',
				col: 3,
				match: '--config',
			},
		];
	
		cases.forEach((tc) => {
			it(tc.d, async () => {
				const filename = tmp.tmpNameSync({ postfix: '.bazelrc' });
				fs.writeFileSync(filename, tc.input);
				const uri = vscode.Uri.file(filename);
				const document = await vscode.workspace.openTextDocument(uri);
				const position = new vscode.Position(0, tc.col - 1);
				const hover = await support.provideHover(document, position, cancellationTokenSource.token);
				if (!tc.match) {
					expect(hover).to.be.undefined;
					return;
				}
				expect(hover).not.to.be.undefined;
				expect(hover?.contents.length).eq(1);
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

	describe('completion', () => {
		const cases: flagCompletionTest[] = [
			{
				d: 'should miss empty document',
				input: '',
				numItems: 0,
			},
			{
				d: 'should miss comment lines',
				input: '# build --',
				numItems: 0,
			},
			{
				d: 'should report all possible shorts',
				input: '  -',
				numItems: 7,
			},
			{
				d: 'should report all at long + negatables',
				input: ' --',
				numItems: 1267,
			},
			{
				d: 'should report all at negatables',
				input: ' --no',
				numItems: 436, // all hasNegatives plus 3 that happen to start with "no"
			},
			{
				d: 'should filter by command name (short option)',
				input: 'build -',
				numItems: 5,
			},
			{
				d: 'should filter by command name (long option)',
				input: 'build --',
				numItems: 1086,
			},
			{
				d: 'should filter by command name and current token',
				input: 'build --an',
				numItems: 17,
			},
			{
				d: 'should provide single match (short)',
				input: 'build -j',
				numItems: 1,
			},
			{
				d: 'should provide single match (long)',
				input: 'build --jobs',
				numItems: 1,
			},
		];
	
		cases.forEach((tc) => {
			it(tc.d, async () => {
				const filename = tmp.tmpNameSync({ postfix: '.bazelrc' });
				fs.writeFileSync(filename, tc.input);
				const uri = vscode.Uri.file(filename);
				const document = await vscode.workspace.openTextDocument(uri);
				const position = new vscode.Position(0, tc.input.length);
				const items = await support.provideCompletionItems(document, position, cancellationTokenSource.token, {
					triggerKind: tc.triggerKind || vscode.CompletionTriggerKind.Invoke,
					triggerCharacter: tc.triggerCharacter,
				});
				if (!tc.numItems) {
					expect(items).to.be.undefined;
					return;
				}
				expect(items).not.to.be.undefined;
				expect(items?.length).eq(tc.numItems);
			});
		});
	});


	describe('codelens', () => {
		const cases: codelensTest[] = [
			{
				d: 'should miss empty document',
				input: '',
				numItems: 0,
			},
			{
				d: 'should miss comment lines',
				input: '# build',
				numItems: 0,
			},
			{
				d: 'should miss non-commands',
				input: 'dig',
				numItems: 0,
			},
			{
				d: 'command must start at beginning of line',
				input: ' build',
				numItems: 0,
			},
			{
				d: 'should lens build command',
				input: 'build //foo',
				numItems: 1,
				command: {
					title: 'build',
					tooltip: 'build //foo',
					command: 'feature.bazelrc.runCommand',
					arguments: [{
						executable: 'bazel',
						command: 'build',
						args: ['//foo'],
					} as RunContext],
				},
				range: new vscode.Range(
					new vscode.Position(0, 0),
					new vscode.Position(0, 5),
				),
			},
			{
				d: 'supports line continuations',
				input: 'build //foo \\\n --config=bar',
				numItems: 1,
				command: {
					title: 'build',
					tooltip: 'build //foo --config=bar',
					command: 'feature.bazelrc.runCommand',
					arguments: [{
						executable: 'bazel',
						command: 'build',
						args: ['//foo', '--config=bar'],
					} as RunContext],
				},
				range: new vscode.Range(
					new vscode.Position(0, 0),
					new vscode.Position(0, 5),
				),
			},
		];
	
		cases.forEach((tc) => {
			it(tc.d, async () => {
				const filename = tmp.tmpNameSync({ postfix: '.bazelrc' });
				fs.writeFileSync(filename, tc.input);
				const uri = vscode.Uri.file(filename);
				const document = await vscode.workspace.openTextDocument(uri);
				const items = await codelens.provideCodeLenses(document, cancellationTokenSource.token);
				if (!tc.numItems) {
					expect(items).to.be.undefined;
					return;
				}
				expect(items).not.to.be.undefined;
				if (!items) {
					return;
				}
				expect(items?.length).eq(tc.numItems);
				const lens = items[0];
				if (tc.command) {
					expect(lens.command?.title).eq(tc.command.title);
					expect(lens.command?.tooltip).eq(tc.command.tooltip);
					expect(lens.command?.arguments).to.have.length(1);
					const actuals = lens.command?.arguments as RunContext[];
					const actual = actuals[0];
					const expecteds = tc.command?.arguments as RunContext[];
					const expected = expecteds[0];
					expect(actual.executable).eq(expected.executable);
					expect(actual.command).eq(expected.command);
					// doing lowercase here to normalize
					// c:\\Users\\RUNNER~1\\AppData\\Local\\Temp vs
					// C:\\Users\\RUNNER~1\\AppData\\Local\\Temp
					expect(actual.cwd.toLowerCase()).equals(path.dirname(filename).toLowerCase());
					expect(actual.args).to.eql(expected.args);
				}
				if (tc.range) {
					expect(tc.range.start.line).equals(lens?.range?.start.line);
					expect(tc.range.start.character).equals(lens?.range?.start.character);
					expect(tc.range.end.line).equals(lens?.range?.end.line);
					expect(tc.range.end.character).equals(lens?.range?.end.character);
				}
			});
		});
	});	
});
