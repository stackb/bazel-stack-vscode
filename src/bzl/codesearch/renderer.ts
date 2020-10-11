import { IThemedToken } from 'shiki';
import { IShikiTheme } from 'shiki-themes';
import { Highlighter } from 'shiki/dist/highlighter';
import { HtmlRendererOptions } from 'shiki/dist/renderer';
import * as vscode from 'vscode';
import { map, strings } from 'vscode-common';
import { makeCommandURI } from '../../common';
import { BuiltInCommands } from '../../constants';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { LineBlock } from '../../proto/build/stack/codesearch/v1beta1/LineBlock';
import { LineBounds } from '../../proto/build/stack/codesearch/v1beta1/LineBounds';
import { MergedCodeSearchResult } from '../../proto/build/stack/codesearch/v1beta1/MergedCodeSearchResult';
import { MergedSearchResult } from '../../proto/build/stack/codesearch/v1beta1/MergedSearchResult';
import { Bounds } from '../../proto/livegrep/Bounds';
import { CodeSearchResult } from '../../proto/livegrep/CodeSearchResult';
import { SearchResult } from '../../proto/livegrep/SearchResult';
import { CodeHighlighter, getLanguageId } from './highlighter';
import path = require('path');
import Long = require('long');

const highlightedContentRe = new RegExp('<span style="color: #[a-z0-9A-Z]+">([^<]+)</span>', 'g');

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

	public async render(result: CodeSearchResult, workspace: Workspace): Promise<string> {
		const merge = mergeCodeSearchResult(result);
		const highlighter = await this._highlighter.getHighlighter();
		const theme = this._highlighter.getCurrentTheme();
		if (!(highlighter && theme)) {
			return 'N/A';
		}

		let lines: string[] = [];

		merge.results!.forEach(result => {
			this.formatMergedSearchResult(lines, workspace, result, highlighter, theme);
		});

		return lines.join('\n');
	}

	private formatMergedSearchResult(lines: string[], workspace: Workspace, result: MergedSearchResult, highlighter: Highlighter, theme: IShikiTheme) {
		const openCommand = getVscodeOpenCommand(result.path!, result!.block![0].lines![0].lineNumber as number, 0);
		const lang = getLanguageFromFilename(result.path!);

		//
		// Header
		//
		lines.push('<div class="peek-view">');
		lines.push(`
		<div class="peek-view-title">
			<label>${path.basename(result.path!)}</label>
			<span class="peek-view-title-description">${getDisplayFilename(path.dirname(result.path!), workspace)}</span>
			<span style="float: right; margin-right: 0.5rem" class="peek-view-title-description">${lang}</span>
		</div>
		`);

		// Body
		// const themeBgColor = color.Color.fromHex(theme.bg);
		// const lighter = themeBgColor.lighten(0.2);
		// const lighterBg = lighter.toString();
		lines.push('<div class="file-block">');

		for (const block of result.block!) {
			lines.push('<table class="result-block">');
			for (const line of block.lines!) {
				lines.push(`<tr class="linerow"><td class="lineno ${line.bounds?.length ? 'activelineno' : ''}">${line.lineNumber}</td><td class="line-container">`);
				const html = formatLineBounds(line, lang, highlighter, theme);
				lines.push(html);
				lines.push('</td></tr>');
			}
			lines.push('</table>');
		}
		lines.push('</div></div>'); // file-block,peek-view
	}

}

function getDisplayFilename(resultPath: string, workspace: Workspace | undefined): string {
	if (!workspace) {
		return resultPath;
	}
	resultPath = strings.ltrim(resultPath, workspace.outputBase!);
	resultPath = strings.ltrim(resultPath, workspace.cwd!);
	resultPath = strings.ltrim(resultPath, '/');
	return resultPath;
}

function getLanguageFromFilename(filename: string): string {
	let lang = path.extname(filename) || path.basename(filename);
	if (lang.startsWith('.')) {
		lang = lang.slice(1);
	}
	return getLanguageId(lang) || 'php'; // php is pretty advanced grammar
}

function formatLineBounds(line: LineBounds, lang: string, highlighter: Highlighter, theme: IShikiTheme): string {
	const lines = highlighter.codeToThemedTokens(line.line!, lang);

	// Simple case: line has no highlighted segments
	if (!(line.bounds && line.bounds.length)) {
		return renderToHtml(lines, {
			bg: 'inherit',
		});
		// return highlighter.codeToHtml!(line.line!, lang);
	}

	const fg = theme.fg;
	const bg = 'inherit';
	// const bg = theme.bg;
	let html = '';

	html += `<pre class="shiki" style="background-color: ${bg}">`;
	html += '<code>';

	const bounds = line.bounds; // areas in the string that need to be highlighted
	let boundIndex = 0; // tracks which bound we are currently considering

	let cursor = 0; // track the left side of the text content we've seen thus far

	const renderTokenContent = (content: string, color: string | undefined, clazz = ''): string => {
		return `<span class="${clazz}" style="color: ${color || fg}">${escapeHtml(
			content
		)}</span>`;
	};

	for (const l of lines) {
		if (l.length === 0) {
			html += '\n';
		} else {
			html += '<span class="line">';
			for (const token of l) {
				const bound =
					bounds[boundIndex];
				if (!bound) {
					// all out of bounds
					html += renderTokenContent(token.content, token.color);
					continue;
				}

				const nextCursor = cursor + token.content.length;
				// is this token completely before the bounding region?
				if (nextCursor < bound.left!) {
					// skip this one
					html += renderTokenContent(token.content, token.color);
				} else {
					const start = bound.left! - cursor;
					const end = bound.right! - cursor;
					const pre = token.content.slice(0, start);
					const mid = token.content.slice(start, end);
					const post = token.content.slice(end);
					if (pre) {
						html += renderTokenContent(pre, token.color);
					}
					if (mid) {
						html += renderTokenContent(mid, token.color, 'matchHighlight');
					}
					if (post) {
						html += renderTokenContent(post, token.color);
					}
				}

				// advance cursor
				cursor = nextCursor;
				// have we crossed over the end of this bound?
				if (cursor > bound.right!) {
					boundIndex++;
				}
			}
			html += '</span>\n';
		}
	}

	html = html.replace(/\n*$/, ''); // Get rid of final new lines
	html += '</code></pre>';

	return html;
}

export function renderToHtml(lines: IThemedToken[][], options: HtmlRendererOptions = {}): string {
	const bg = options.bg || '#fff';

	let html = '';

	html += `<pre class="shiki" style="background-color: ${bg}">`;
	if (options.langId) {
		html += `<div class="language-id">${options.langId}</div>`;
	}
	html += '<code>';

	lines.forEach((l: IThemedToken[]) => {
		if (l.length === 0) {
			html += '\n';
		} else {
			html += '<span class="line">';
			l.forEach(token => {
				html += `<span style="color: ${token.color || options.fg}">${escapeHtml(
					token.content
				)}</span>`;
			})
			html += '</span>\n';
		}
	})
	html = html.replace(/\n*$/, ''); // Get rid of final new lines
	html += '</code></pre>';

	return html;
}

function getVscodeOpenCommand(filename: string, line: number, col: number): string {
	return makeCommandURI(BuiltInCommands.Open, vscode.Uri.file(filename).with({
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
		let lineNo = Long.fromValue(sr.lineNumber!).toInt();
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
			if (!bounds.bounds) {
				debugger;
			}
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
		let lineNo = Long.fromValue(sr.lineNumber!).toInt() + i;
		if (before) {
			lineNo -= context.length;
		} else {
			lineNo += 1;
		}
		if (lines.has(lineNo)) {
			continue;
		}
		const bounds: LineBounds = {
			lineNumber: lineNo,
			line: context[i],
			bounds: [],
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

const htmlEscapes: { [key in string]: string } = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

function escapeHtml(html: string): string {
	return html.replace(/[&<>"']/g, chr => htmlEscapes[chr]);
}