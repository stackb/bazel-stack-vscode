'use strict';

import { expect, use as chaiUse } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import { BzlCodesearch } from '../../bzl/client';
import { CodeSearchCodeLens, CodesearchIndexOptions, OutputChannel } from '../../bzl/codesearch/codelens';
import { CodesearchRenderer } from '../../bzl/codesearch/renderer';
import { CommandName } from '../../bzl/constants';
import { BzlFeatureName } from '../../bzl/feature';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { CreateScopeRequest } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { GetScopeRequest } from '../../proto/build/stack/codesearch/v1beta1/GetScopeRequest';
import { ListScopesRequest } from '../../proto/build/stack/codesearch/v1beta1/ListScopesRequest';
import { ListScopesResponse } from '../../proto/build/stack/codesearch/v1beta1/ListScopesResponse';
import { Scope } from '../../proto/build/stack/codesearch/v1beta1/Scope';
import { ScopedQuery } from '../../proto/build/stack/codesearch/v1beta1/ScopedQuery';
import { CodeSearchResult } from '../../proto/livegrep/CodeSearchResult';
import fs = require('graceful-fs');
import tmp = require('tmp');
import vscode = require('vscode');

chaiUse(require('chai-string'));

tmp.setGracefulCleanup();


class MockBzlCodesearch implements BzlCodesearch {
	constructor(
	) {
	}

	async createScope(request: CreateScopeRequest, callback: (response: CreateScopeResponse) => void): Promise<void> {
		return Promise.reject('Unimplemented');
	}

	async getScope(request: GetScopeRequest): Promise<Scope> {
		return Promise.reject('Unimplemented');
	}

	async listScopes(request: ListScopesRequest): Promise<ListScopesResponse> {
		return Promise.reject('Unimplemented');
	}

	async searchScope(request: ScopedQuery): Promise<CodeSearchResult> {
		return Promise.reject('Unimplemented');
	}
}

class MockBzlCodesearchCreator extends MockBzlCodesearch {
	public request: CreateScopeRequest | undefined;

	constructor(
		public progress: string[],
	) {
		super();
	}

	async createScope(request: CreateScopeRequest, callback: (response: CreateScopeResponse) => void): Promise<void> {
		this.request = request;
		this.progress.forEach(line => callback({ progress: [line] }));
	}
}

class MockBzlCodesearchLister extends MockBzlCodesearch {
	public request: CreateScopeRequest | undefined;

	constructor(
		public scopes: Scope[],
	) {
		super();
	}

	async listScopes(request: ListScopesRequest): Promise<ListScopesResponse> {
		return {
			scope: this.scopes,
		};
	}
}


/**
 * An output channel is a container for readonly textual information.
 */
class MockOutputChannel implements OutputChannel {
	public wasCleared: number = 0;
	public wasShown: number = 0;
	public lines: string[] = [];

	constructor(
		public name: string,
	) {

	}

	appendLine(value: string): void {
		this.lines.push(value);
	}

	clear(): void {
		this.wasCleared++;
	}

	show(): void {
		this.wasShown;
	}
}

describe(BzlFeatureName + '.codesearch', function () {
	const cancellationTokenSource = new vscode.CancellationTokenSource();

	describe('Renderer', () => {


		describe('renderResults', () => {
			type renderResultsTest = {
				d: string,
				result: CodeSearchResult,
				check: (html: string) => void,
			};

			const cases: renderResultsTest[] = [
				{
					d: 'returns empty string when no results',
					result: {
					},
					check: (html: string) => {
						expect(html).to.eql('');
					},
				},
				{
					d: 'handles undefined',
					result: {
						fileResults: undefined,
						results: undefined,
					},
					check: (html: string) => {
						expect(html).to.eql('');
					},
				},
				{
					d: 'single fileresult',
					result: {
						fileResults: [
							{
								path: '/tmp/foo.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).equalIgnoreSpaces(`
						<div class="file-results">
							<div class="linerow file-result" data-file="/tmp/foo.txt" data-line="0" data-col="0" onclick="postDataElementClick('line', this)">
								/tmp/foo.txt
							</div>
						</div> 
						`);
					},
				},
				{
					d: 'single fileresult with bounds',
					result: {
						fileResults: [
							{
								path: '/tmp/foo.txt',
								bounds: {
									left: 5,
									right: 8,
								}
							}
						],
					},
					check: (html: string) => {
						expect(html).equalIgnoreSpaces(`
						<div class="file-results">
							<div class="linerow file-result" data-file="/tmp/foo.txt" data-line="0" data-col="0" onclick="postDataElementClick('line', this)">
								/tmp/<span class="matchHighlight">foo</span>.txt
							</div>
						</div> 
						`);
					},
				},
				{
					d: 'single result (minimal)',
					result: {
						results: [
							{
								path: '/path/to/cwd/foo.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).equalIgnoreSpaces(`
						<div class="peek-view">
							<div class="peek-view-title">
								<label>foo.txt</label>
								<span class="peek-view-title-description"></span>
								<span style="float: right; margin-right: 0.5rem" class="peek-view-title-description">*</span>
							</div>
							<div class="file-block">
							</div>
						</div>
						`);
					},
				},
				{
					d: 'single result (full)',
					result: {
						results: [
							{
								path: '/path/to/cwd/foo.txt',
								bounds: {
									left: 14,
									right: 19,
								},
								line: 'line-3: hello, world',
								lineNumber: 3,
								contextBefore: [
									'line-1',
									'line-2',
								],
								contextAfter: [
									'line-4',
									'line-5',
								],
							}
						],
					},
					check: (html: string) => {
						expect(html).equalIgnoreSpaces(`
						<div class="peek-view">
							<div class="peek-view-title">
								<label>foo.txt</label>
								<span class="peek-view-title-description"></span>
								<span style="float: right; margin-right: 0.5rem" class="peek-view-title-description">*</span>
							</div>
							<div class="file-block">
								<table class="result-block">
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt" data-line="1" data-col="0">
										<td class="lineno ">1</td>
										<td class="line-container">
											<pre class="shiki" style="background-color: inherit">
												<code><span class="line"><span style="color: #D4D4D4">line-</span><span style="color: #B5CEA8">1</span></span></code>
											</pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt" data-line="2" data-col="0">
										<td class="lineno ">2</td><td class="line-container">
											<pre class="shiki" style="background-color: inherit">
												<code><span class="line"><span style="color: #D4D4D4">line-</span><span style="color: #B5CEA8">2</span></span></code>
											</pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt" data-line="3" data-col="0">
										<td class="lineno activelineno">3</td><td class="line-container">
											<pre class="shiki" style="background-color: inherit"><code><span class="line">
												<span class="" style="color: #D4D4D4">line-</span><span class="" style="color: #B5CEA8">3</span><span class="" style="color: #D4D4D4">: hello,</span><span class="matchHighlight" style="color: #D4D4D4"> worl</span><span class="" style="color: #D4D4D4">d</span></span></code>
											</pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt" data-line="4" data-col="0">
										<td class="lineno ">4</td><td class="line-container">
											<pre class="shiki" style="background-color: inherit">
												<code><span class="line"><span style="color: #D4D4D4">line-</span><span style="color: #B5CEA8">4</span></span></code>
											</pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt" data-line="5" data-col="0">
										<td class="lineno ">5</td><td class="line-container">
											<pre class="shiki" style="background-color: inherit">
												<code><span class="line"><span style="color: #D4D4D4">line-</span><span style="color: #B5CEA8">5</span></span></code>
											</pre>
										</td>
									</tr>
								</table>
							</div>
						</div> 
						`);
					},
				},
				{
					d: 'multi result (merge)',
					result: {
						results: [
							{
								path: '/path/to/cwd/foo.txt',
								bounds: {
									left: 1,
									right: 2,
								},
								line: 'B',
								lineNumber: 2,
								contextBefore: [
									'A',
								],
								contextAfter: [
									'C',
								],
							},
							{
								path: '/path/to/cwd/foo.txt',
								bounds: {
									left: 1,
									right: 2,
								},
								line: 'C',
								lineNumber: 3,
								contextBefore: [
									'B',
								],
								contextAfter: [
									'D',
								],
							}
						],
					},
					check: (html: string) => {
						expect(html).equalIgnoreSpaces(`
						<div class="peek-view">

							<div class="peek-view-title">
								<label>foo.txt</label>
								<span class="peek-view-title-description"></span>
								<span style="float: right; margin-right: 0.5rem" class="peek-view-title-description">*</span>
							</div>
						
							<div class="file-block">
								<table class="result-block">
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt"
										data-line="1" data-col="0">
										<td class="lineno ">1</td>
										<td class="line-container">
											<pre class="shiki"
												style="background-color: inherit"><code><span class="line"><span style="color: #D4D4D4">A</span></span></code></pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt"
										data-line="2" data-col="0">
										<td class="lineno activelineno">2</td>
										<td class="line-container">
											<pre class="shiki"
												style="background-color: inherit"><code><span class="line"><span class="" style="color: #D4D4D4">B</span></span></code></pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt"
										data-line="3" data-col="0">
										<td class="lineno activelineno">3</td>
										<td class="line-container">
											<pre class="shiki"
												style="background-color: inherit"><code><span class="line"><span class="" style="color: #D4D4D4">C</span></span></code></pre>
										</td>
									</tr>
									<tr class="linerow" onclick="postDataElementClick('line', this)" data-file="/path/to/cwd/foo.txt"
										data-line="4" data-col="0">
										<td class="lineno ">4</td>
										<td class="line-container">
											<pre class="shiki"
												style="background-color: inherit"><code><span class="line"><span style="color: #D4D4D4">D</span></span></code></pre>
										</td>
									</tr>
								</table>
							</div>
						</div>
						`);
					},
				},
			];

			cases.forEach(tc => {
				it(tc.d, async () => {
					const renderer = new CodesearchRenderer();
					const ws: Workspace = {
						cwd: '/path/to/cwd',
						outputBase: '/path/to/ob',
					};
					const html = await renderer.renderResults(tc.result, ws);
					tc.check(html);
				});
			});
		});

		describe('renderSummary', () => {
			type renderSummaryTest = {
				d: string,
				result: CodeSearchResult,
				check: (html: string) => void,
			};

			const cases: renderSummaryTest[] = [
				{
					d: 'reports when no results',
					result: {
					},
					check: (html: string) => {
						expect(html).to.eql('No results.');
					},
				},
				{
					d: 'handles undefined',
					result: {
						fileResults: undefined,
						results: undefined,
					},
					check: (html: string) => {
						expect(html).to.eql('No results.');
					},
				},
				{
					d: 'single fileresult',
					result: {
						fileResults: [
							{
								path: '/tmp/foo.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).to.eql(' (<span>1 filename match</span>)');
					},
				},
				{
					d: 'multiple fileresult',
					result: {
						fileResults: [
							{
								path: '/tmp/foo.txt',
							},
							{
								path: '/tmp/bar.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).to.eql(' (<span>2 filename matches</span>)');
					},
				},
				{
					d: 'single result',
					result: {
						results: [
							{
								path: '/tmp/foo.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).to.eql('<span>1 match</span>');
					},
				},
				{
					d: 'multiple result',
					result: {
						results: [
							{
								path: '/tmp/foo.txt',
							},
							{
								path: '/tmp/bar.txt',
							}
						],
					},
					check: (html: string) => {
						expect(html).to.eql('<span>2 matches</span>');
					},
				}
			];

			cases.forEach(tc => {
				it(tc.d, async () => {
					const renderer = new CodesearchRenderer();
					const html = await renderer.renderSummary({}, tc.result);
					tc.check(html);
				});
			});
		});


	});

	describe('Codelens', () => {

		describe('provideCommandCodeLenses', () => {
			let codelens: CodeSearchCodeLens;
			let onDidWorkspaceChange: vscode.EventEmitter<Workspace>;
			let onDidBzlClientChange: vscode.EventEmitter<BzlCodesearch>;

			beforeEach(async () => {
				onDidWorkspaceChange = new vscode.EventEmitter<Workspace>();
				onDidBzlClientChange = new vscode.EventEmitter<BzlCodesearch>();
				codelens = new CodeSearchCodeLens({
					codesearchProtofile: '',
					livegrepProtofile: '',
					defaultQuery: '',
				}, onDidWorkspaceChange.event, onDidBzlClientChange.event, true);
			});

			afterEach(() => {
				onDidWorkspaceChange.dispose();
				onDidBzlClientChange.dispose();
				if (codelens) {
					codelens.dispose();
				}
			});

			type codelensTest = {
				d: string, // test description
				ws?: Workspace, // input workspace
				client?: BzlCodesearch, // input client
				args: string[], // input command args
				check: (lenses: vscode.CodeLens[] | undefined) => void,
			};

			const cases: codelensTest[] = [
				{
					d: 'no lenses unless client and ws are present',
					args: [],
					check: (lenses: vscode.CodeLens[] | undefined) => {
						expect(lenses).to.be.undefined;
					}
				},
				{
					d: 'index & search are present (no metadata)',
					args: ['deps(//...)'],
					ws: {},
					client: new MockBzlCodesearchLister([]),
					check: (lenses: vscode.CodeLens[] | undefined) => {
						expect(lenses).not.to.be.undefined;
						expect(lenses).to.have.lengthOf(2);
						const index = lenses![0];
						const search = lenses![1];
						expect(index.command?.command).to.eql(CommandName.CodeSearchIndex);
						expect(index.command?.title).to.eql('Index');
						expect(search.command?.command).to.eql(CommandName.CodeSearchSearch);
						expect(search.command?.title).to.eql('Search');
					}
				},
				{
					d: 'index & search are present (with metadata)',
					args: ['deps(//...)'],
					ws: {},
					client: new MockBzlCodesearchLister([
						{
							name: '57be84bf28bb4909e48512a1360cf603', // md5 hash of args
							size: 10,
							createdAt: {
								seconds: 0,
							}
						}
					]),
					check: (lenses: vscode.CodeLens[] | undefined) => {
						expect(lenses).not.to.be.undefined;
						expect(lenses).to.have.lengthOf(2);
						const index = lenses![0];
						const search = lenses![1];
						expect(index.command?.command).to.eql(CommandName.CodeSearchIndex);
						expect(index.command?.title).to.eql('Index (50 years ago)');
						expect(search.command?.command).to.eql(CommandName.CodeSearchSearch);
						expect(search.command?.title).to.eql('Search (10 files)');
					}
				}
			];

			cases.forEach((tc) => {
				it(tc.d, async () => {
					const filename = tmp.tmpNameSync({ postfix: 'launch.bazelrc' });
					fs.writeFileSync(filename, '');
					const uri = vscode.Uri.file(filename);
					const document = await vscode.workspace.openTextDocument(uri);
					if (tc.client) {
						onDidBzlClientChange.fire(tc.client);
					}
					if (tc.ws) {
						onDidWorkspaceChange.fire(tc.ws);
					}
					await codelens.updateScopes();
					const items = await codelens.provideCommandCodeLenses(document, cancellationTokenSource.token, 1, 1, 'codesearch', tc.args);
					tc.check(items);
				});
			});
		});

		describe('createScope', () => {
			let codelens: CodeSearchCodeLens;
			let onDidWorkspaceChange: vscode.EventEmitter<Workspace>;
			let onDidBzlClientChange: vscode.EventEmitter<BzlCodesearch>;

			beforeEach(async () => {
				onDidWorkspaceChange = new vscode.EventEmitter<Workspace>();
				onDidBzlClientChange = new vscode.EventEmitter<BzlCodesearch>();
				codelens = new CodeSearchCodeLens({
					codesearchProtofile: '',
					livegrepProtofile: '',
					defaultQuery: '',
				}, onDidWorkspaceChange.event, onDidBzlClientChange.event, true);
			});

			afterEach(() => {
				onDidWorkspaceChange.dispose();
				onDidBzlClientChange.dispose();
				if (codelens) {
					codelens.dispose();
				}
			});

			type createScopeTest = {
				d: string, // test description
				opts: CodesearchIndexOptions, // input options
				ws: Workspace // input workspace
				// a function to make assertions about the request that was produced
				check: (request: CreateScopeRequest | undefined) => void;
			};

			const cases: createScopeTest[] = [
				{
					d: 'formats request appropriately',
					opts: {
						cwd: 'cwd-a',
						args: ['deps(//foo)'],
					},
					ws: {
						cwd: 'ws-cwd',
						outputBase: 'ws-outputBase'
					},
					check: (request: CreateScopeRequest | undefined) => {
						expect(request).not.to.be.undefined;
						expect(request?.cwd).eql('ws-cwd');
						expect(request?.outputBase).eql('ws-outputBase');
						expect(request?.force).to.be.undefined;
						expect(request?.name).eql('b893ccc7b257dd04e168b4bb80587a8e');
						expect(request?.bazelQuery?.expression).eql('deps(//foo)');
						// unused slots
						expect(request?.expression).to.be.undefined;
						expect(request?.bazelQuery?.bazelInternal).to.be.undefined;
						expect(request?.bazelQuery?.include).to.be.undefined;
						expect(request?.bazelQuery?.exclude).to.be.undefined;
						expect(request?.bazelQuery?.excludeDefault).to.be.undefined;
						expect(request?.bazelQuery?.bazelInternal).to.be.undefined;
					}
				}
			];

			cases.forEach((tc) => {
				it(tc.d, async () => {
					const output = new MockOutputChannel(tc.d);
					const client = new MockBzlCodesearchCreator([]);
					await codelens.createScope(tc.opts, client, tc.ws, output);
					tc.check(client.request);
				});
			});
		});


		describe('provideCommandCodeLenses', () => {
			let codelens: CodeSearchCodeLens;
			let onDidWorkspaceChange: vscode.EventEmitter<Workspace>;
			let onDidBzlClientChange: vscode.EventEmitter<BzlCodesearch>;

			beforeEach(async () => {
				onDidWorkspaceChange = new vscode.EventEmitter<Workspace>();
				onDidBzlClientChange = new vscode.EventEmitter<BzlCodesearch>();
				codelens = new CodeSearchCodeLens({
					codesearchProtofile: '',
					livegrepProtofile: '',
					defaultQuery: '',
				}, onDidWorkspaceChange.event, onDidBzlClientChange.event, true);
			});

			afterEach(() => {
				onDidWorkspaceChange.dispose();
				onDidBzlClientChange.dispose();
				if (codelens) {
					codelens.dispose();
				}
			});

			type codelensTest = {
				d: string, // test description
				input: string, // content of bazelrcfile
				ws?: Workspace // input workspace
				client?: BzlCodesearch // input client
				args: string[] // input command args
				numItems: number
			};

			const cases: codelensTest[] = [
				{
					d: 'should miss empty document',
					input: '',
					args: [],
					numItems: 0,
				}
			];

			cases.forEach((tc) => {
				it(tc.d, async () => {
					const filename = tmp.tmpNameSync({ postfix: 'launch.bazelrc' });
					fs.writeFileSync(filename, tc.input);
					const uri = vscode.Uri.file(filename);
					const document = await vscode.workspace.openTextDocument(uri);

					const items = await codelens.provideCommandCodeLenses(document, cancellationTokenSource.token, 1, 1, 'codesearch', tc.args);
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

				});
			});
		});

	});

});
