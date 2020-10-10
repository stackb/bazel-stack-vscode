import * as vscode from 'vscode';
import { map } from 'vscode-common';
import { makeCommandURI } from '../../common';
import { BuiltInCommands } from '../../constants';
import { LineBlock } from '../../proto/build/stack/codesearch/v1beta1/LineBlock';
import { LineBounds } from '../../proto/build/stack/codesearch/v1beta1/LineBounds';
import { MergedCodeSearchResult } from '../../proto/build/stack/codesearch/v1beta1/MergedCodeSearchResult';
import { MergedSearchResult } from '../../proto/build/stack/codesearch/v1beta1/MergedSearchResult';
import { Bounds } from '../../proto/livegrep/Bounds';
import { CodeSearchResult } from '../../proto/livegrep/CodeSearchResult';
import { SearchResult } from '../../proto/livegrep/SearchResult';
import { CodeHighlighter } from './highlighter';
import path = require('path');

export class CodesearchRenderer {

	private readonly _disposables: vscode.Disposable[] = [];

	private readonly _highlighter: CodeHighlighter;

	public readonly needsRender: vscode.Event<void>;

	constructor() {
		this._highlighter = new CodeHighlighter();
		this._disposables.push(this._highlighter);

		this.needsRender = this._highlighter.needsRender;
	}

	dispose() {
		let item: vscode.Disposable | undefined;
		while ((item = this._disposables.pop())) {
			item.dispose();
		}
	}

	public async render(result: CodeSearchResult): Promise<string> {
		const merge = mergeCodeSearchResult(result);
		const highlighter = await this._highlighter.getHighlighter();

		const parts = merge.results!.map(result => this.formatMergedSearchResult(result, highlighter));

		return parts.join('\n');
	}

	private formatMergedSearchResult(result: MergedSearchResult, highlighter: (code: string, language: string) => string): string {
		let lines: string[] = [];
		for (const block of result.block!) {
			this.formatLineBlock(block, lines);
		}
		const code = lines.join('\n');
		let lang = path.extname(result.path!) || path.basename(result.path!);
		if (lang.startsWith('.')) {
			lang = lang.slice(1);
		}
		const openCommand = getVscodeOpenCommand(result.path!, result!.block![0].lines![0].lineNumber as number, 0);
		const html = `<div><a href="${openCommand}">${result.path} <b>${lang}</b></a></div>`;
		return html + '<div class="code" style="white-space: pre-line; margin-bottom: 2rem">' + highlighter(code, lang) + '</div>';
	}

	private formatLineBlock(block: LineBlock, lines: string[]) {
		for (const line of block.lines!) {
			lines.push(`${line.line}`);
		}
	}

}

function getVscodeOpenCommand(filename: string, line: number, col: number): string {
	return `${BuiltInCommands.Open}?`+makeCommandURI(vscode.Uri.file(filename).with({
		fragment: [line, col].join(','),
	}).toString());
}
/**
 * Transforms the raw result into a merged result.
 * 
 * @param {!CodeSearchResult} result 
 * @returns {!MergedCodeSearchResult} 
 */
function mergeCodeSearchResult(result: CodeSearchResult): MergedCodeSearchResult {

	// Use a linkedmap to preserve file order from the server.
	const msrs = new map.LinkedMap<string, MergedSearchResult>();

	//
	const msrLines = new Map<string, Map<number, LineBounds>>();

	// iterate results and create a new merged search result 
	for (const sr of result.results || []) {
		const key = `${sr.tree || ''}-${sr.version || ''}-${sr.path}`;
		let msr = msrs.get(key);

		// Create a new unique MergeSearchResult if it does not exist.
		if (!msr) {
			msr = {
				tree: sr.tree,
				version: sr.version,
				path: sr.path,
				block: [],
			};
			msrs.set(key, msr);
			msrLines.set(key, new Map());
		}
		let lines = msrLines.get(key);
		if (!lines) {
			lines = new Map();
			debugger;
		}

		// Create LineBounds for context lines (these don't have any Bound object
		// on them)
		addContextLineBounds(sr, sr.contextBefore || [], lines, true);
		addContextLineBounds(sr, sr.contextAfter || [], lines, false);

		// Add in the matching line for this SearchResult
		let lineNo = sr.lineNumber as number;
		let bounds = lines.get(lineNo);
		if (!bounds) {
			bounds = {
				lineNumber: lineNo,
				line: sr.line,
				bounds: [],
			};
			lines.set(lineNo, bounds);
		}
		// TODO, check overlaps
		const bound = sr.bounds;
		if (bound) {
			bounds.bounds!.push(bound);
		}
	}

	const merge: MergedCodeSearchResult = {
		fileResults: result.fileResults,
		results: [],
	};

	// Now that we have processed all search results, shuttle the LineBounds
	// over and populate the merged code result.
	msrs.forEach((msr, key) => {
		const lines = msrLines.get(key);
		const lineNumbers = Array.from(lines!.keys());
		lineNumbers.sort((a, b) => a - b);

		/** The current line block
		 */
		let block: LineBlock | undefined = undefined;
		let lastLineNo = -1;

		lineNumbers.forEach(lineNo => {
			if (lineNo - lastLineNo !== 1) {
				block = {
					lines: [],
				};
				msr.block!.push(block);
			}
			lastLineNo = lineNo;

			const lineBound = lines!.get(lineNo)!;
			const sortedBounds = sortBoundsList(lineBound?.bounds || []);
			if (sortedBounds) {
				lineBound.bounds = sortedBounds;
			}
			block!.lines!.push(lineBound);
			// console.log(`Added ${key} ${lineNo}`, lineBound);
		});
		merge.results!.push(msr);
	});

	return merge;
}

/**
 * Utility function to iterate a set of context lines and transform them to line
 * bounds.  The lineBounds map argument is modified.
 * 
 * @param {!SearchResult} sr
 * @param {!Array<string>} context
 * @param {!Map<number,!LineBounds>} lines
 * @param {boolean} before If this is context before
 */
function addContextLineBounds(sr: SearchResult, context: string[], lines: Map<number, LineBounds>, before: boolean) {
	for (let i = 0; i < context.length; i++) {
		let lineNo = sr.lineNumber as number + i;
		if (before) {
			lineNo -= context.length;
		} else {
			lineNo += 1;
		}
		if (lines.has(lineNo)) {
			continue;
		}
		const bounds = {
			lineNumber: lineNo,
			line: context[i],
		};
		lines.set(lineNo, bounds);
	}
}


/**
 * Utility function to sort and deduplicate a set of bounding ranges for a
 * particular line.
 *
 * @param {!Array<!Bounds>} bounds
 * @returns {!Array<!Bounds>} 
 */
function sortBoundsList(bounds: Bounds[]): Bounds[] {
	if (bounds.length < 2) {
		return bounds;
	}
	const m = new Map<number, Bounds>();
	for (const b of bounds) {
		const key = b.left! + b.right!;
		if (m.has(key)) {
			continue;
		}
		m.set(key, b);
	}
	const keys = Array.from(m.keys());
	keys.sort((a, b) => a - b);
	return keys.map(k => m.get(k)!);
}
