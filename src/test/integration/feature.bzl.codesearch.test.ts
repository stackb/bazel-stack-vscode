'use strict';

import { expect, use as chaiUse } from 'chai';
import { describe, it } from 'mocha';
import { CodesearchRenderer } from '../../bezel/codesearch/renderer';
import { BzlFeatureName } from '../../bezel/feature';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { CodeSearchResult } from '../../proto/livegrep/CodeSearchResult';
import tmp = require('tmp');
import vscode = require('vscode');

chaiUse(require('chai-string'));

tmp.setGracefulCleanup();

describe(BzlFeatureName + '.codesearch', function () {
  const cancellationTokenSource = new vscode.CancellationTokenSource();

  describe('Renderer', () => {
    describe('renderResults', () => {
      type renderResultsTest = {
        d: string;
        result: CodeSearchResult;
        check: (html: string) => void;
      };

      const cases: renderResultsTest[] = [
        {
          d: 'returns empty string when no results',
          result: {},
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
              },
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
                },
              },
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
              },
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
                contextBefore: ['line-1', 'line-2'],
                contextAfter: ['line-4', 'line-5'],
              },
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
                contextBefore: ['A'],
                contextAfter: ['C'],
              },
              {
                path: '/path/to/cwd/foo.txt',
                bounds: {
                  left: 1,
                  right: 2,
                },
                line: 'C',
                lineNumber: 3,
                contextBefore: ['B'],
                contextAfter: ['D'],
              },
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
        d: string;
        result: CodeSearchResult;
        check: (html: string) => void;
      };

      const cases: renderSummaryTest[] = [
        {
          d: 'reports when no results',
          result: {},
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
              },
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
              },
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
              },
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
              },
            ],
          },
          check: (html: string) => {
            expect(html).to.eql('<span>2 matches</span>');
          },
        },
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
});
