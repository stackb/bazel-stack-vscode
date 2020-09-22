import { StringDecoder } from 'string_decoder';
import * as vscode from 'vscode';
import * as Assert from '../common/assert';
import * as Objects from '../common/objects';
import * as Strings from '../common/strings';
import * as Types from '../common/types';
import { IMarkerData, IMarkerService } from './markers';
import Severity from './severity';
import path = require('path');
import fs = require('fs');
import os = require('os');

export interface ILineMatcher {
	matchLength: number;
	next(line: string): ProblemMatch | null;
	handle(lines: string[], start?: number): HandleResult;
}

export function createLineMatcher(matcher: ProblemMatcher, fileService?: IFileService): ILineMatcher {
	let pattern = matcher.pattern;
	if (Array.isArray(pattern)) {
		return new MultiLineMatcher(matcher, fileService);
	} else {
		return new SingleLineMatcher(matcher, fileService);
	}
}

const endOfLine: string = os.platform() === 'win32' ? '\r\n' : '\n';

abstract class AbstractLineMatcher implements ILineMatcher {
	private matcher: ProblemMatcher;
	private fileService?: IFileService;

	constructor(matcher: ProblemMatcher, fileService?: IFileService) {
		this.matcher = matcher;
		this.fileService = fileService;
	}

	public handle(lines: string[], start: number = 0): HandleResult {
		return { match: null, continue: false };
	}

	public next(line: string): ProblemMatch | null {
		return null;
	}

	public abstract get matchLength(): number;

	protected fillProblemData(data: ProblemData | undefined, pattern: ProblemPattern, matches: RegExpExecArray): data is ProblemData {
		if (data) {
			this.fillProperty(data, 'file', pattern, matches, true);
			this.appendProperty(data, 'message', pattern, matches, true);
			this.fillProperty(data, 'code', pattern, matches, true);
			this.fillProperty(data, 'severity', pattern, matches, true);
			this.fillProperty(data, 'location', pattern, matches, true);
			this.fillProperty(data, 'line', pattern, matches);
			this.fillProperty(data, 'character', pattern, matches);
			this.fillProperty(data, 'endLine', pattern, matches);
			this.fillProperty(data, 'endCharacter', pattern, matches);
			return true;
		} else {
			return false;
		}
	}

	private appendProperty(data: ProblemData, property: keyof ProblemData, pattern: ProblemPattern, matches: RegExpExecArray, trim: boolean = false): void {
		const patternProperty = pattern[property];
		if (Types.isUndefined(data[property])) {
			this.fillProperty(data, property, pattern, matches, trim);
		}
		else if (!Types.isUndefined(patternProperty) && patternProperty < matches.length) {
			let value = matches[patternProperty];
			if (trim) {
				value = value.trim();
			}
			(data as any)[property] += endOfLine + value;
		}
	}

	private fillProperty(data: ProblemData, property: keyof ProblemData, pattern: ProblemPattern, matches: RegExpExecArray, trim: boolean = false): void {
		const patternAtProperty = pattern[property];
		if (Types.isUndefined(data[property]) && !Types.isUndefined(patternAtProperty) && patternAtProperty < matches.length) {
			let value = matches[patternAtProperty];
			if (!Types.isUndefined(value)) {
				if (trim) {
					value = Strings.trim(value);
				}
				(data as any)[property] = value;
			}
		}
	}

	protected getMarkerMatch(data: ProblemData): ProblemMatch | undefined {
		try {
			let location = this.getLocation(data);
			if (data.file && location && data.message) {
				let marker: IMarkerData = {
					severity: this.getSeverity(data),
					startLineNumber: location.startLineNumber,
					startColumn: location.startCharacter,
					endLineNumber: location.endLineNumber,
					endColumn: location.endCharacter,
					message: data.message
				};
				if (data.code !== undefined) {
					marker.code = data.code;
				}
				if (this.matcher.source !== undefined) {
					marker.source = this.matcher.source;
				}
				return {
					description: this.matcher,
					resource: this.getResource(data.file),
					marker: marker
				};
			}
		} catch (err) {
			console.error(`Failed to convert problem data into match: ${JSON.stringify(data)}`);
		}
		return undefined;
	}

	protected getResource(filename: string): Promise<vscode.Uri> {
		return getResource(filename, this.matcher, this.fileService);
	}

	private getLocation(data: ProblemData): Location | null {
		if (data.kind === ProblemLocationKind.File) {
			return this.createLocation(0, 0, 0, 0);
		}
		if (data.location) {
			return this.parseLocationInfo(data.location);
		}
		if (!data.line) {
			return null;
		}
		let startLine = parseInt(data.line);
		let startColumn = data.character ? parseInt(data.character) : undefined;
		let endLine = data.endLine ? parseInt(data.endLine) : undefined;
		let endColumn = data.endCharacter ? parseInt(data.endCharacter) : undefined;
		return this.createLocation(startLine, startColumn, endLine, endColumn);
	}

	private parseLocationInfo(value: string): Location | null {
		if (!value || !value.match(/(\d+|\d+,\d+|\d+,\d+,\d+,\d+)/)) {
			return null;
		}
		let parts = value.split(',');
		let startLine = parseInt(parts[0]);
		let startColumn = parts.length > 1 ? parseInt(parts[1]) : undefined;
		if (parts.length > 3) {
			return this.createLocation(startLine, startColumn, parseInt(parts[2]), parseInt(parts[3]));
		} else {
			return this.createLocation(startLine, startColumn, undefined, undefined);
		}
	}

	private createLocation(startLine: number, startColumn: number | undefined, endLine: number | undefined, endColumn: number | undefined): Location {
		if (startColumn !== undefined && endColumn !== undefined) {
			return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: endLine || startLine, endCharacter: endColumn };
		}
		if (startColumn !== undefined) {
			return { startLineNumber: startLine, startCharacter: startColumn, endLineNumber: startLine, endCharacter: startColumn };
		}
		return { startLineNumber: startLine, startCharacter: 1, endLineNumber: startLine, endCharacter: 2 ** 31 - 1 }; // See https://github.com/microsoft/vscode/issues/80288#issuecomment-650636442 for discussion
	}

	private getSeverity(data: ProblemData): MarkerSeverity {
		let result: Severity = Severity.Ignore;
		if (data.severity) {
			let value = data.severity;
			if (value) {
				result = Severity.fromValue(value);
				if (result === Severity.Ignore) {
					if (value === 'E') {
						result = Severity.Error;
					} else if (value === 'W') {
						result = Severity.Warning;
					} else if (value === 'I') {
						result = Severity.Info;
					} else if (Strings.equalsIgnoreCase(value, 'hint')) {
						result = Severity.Info;
					} else if (Strings.equalsIgnoreCase(value, 'note')) {
						result = Severity.Info;
					}
				}
			}
		}
		if (result === null || result === Severity.Ignore) {
			result = this.matcher.severity || Severity.Error;
		}
		return MarkerSeverity.fromSeverity(result);
	}
}

class SingleLineMatcher extends AbstractLineMatcher {

	private pattern: ProblemPattern;

	constructor(matcher: ProblemMatcher, fileService?: IFileService) {
		super(matcher, fileService);
		this.pattern = <ProblemPattern>matcher.pattern;
	}

	public get matchLength(): number {
		return 1;
	}

	public handle(lines: string[], start: number = 0): HandleResult {
		Assert.ok(lines.length - start === 1);
		let data: ProblemData = Object.create(null);
		if (this.pattern.kind !== undefined) {
			data.kind = this.pattern.kind;
		}
		let matches = this.pattern.regexp.exec(lines[start]);
		if (matches) {
			this.fillProblemData(data, this.pattern, matches);
			let match = this.getMarkerMatch(data);
			if (match) {
				return { match: match, continue: false };
			}
		}
		return { match: null, continue: false };
	}

	public next(line: string): ProblemMatch | null {
		return null;
	}
}

class MultiLineMatcher extends AbstractLineMatcher {

	private patterns: ProblemPattern[];
	private data: ProblemData | undefined;

	constructor(matcher: ProblemMatcher, fileService?: IFileService) {
		super(matcher, fileService);
		this.patterns = <ProblemPattern[]>matcher.pattern;
	}

	public get matchLength(): number {
		return this.patterns.length;
	}

	public handle(lines: string[], start: number = 0): HandleResult {
		Assert.ok(lines.length - start === this.patterns.length);
		this.data = Object.create(null);
		let data = this.data!;
		data.kind = this.patterns[0].kind;
		for (let i = 0; i < this.patterns.length; i++) {
			let pattern = this.patterns[i];
			let matches = pattern.regexp.exec(lines[i + start]);
			if (!matches) {
				return { match: null, continue: false };
			} else {
				// Only the last pattern can loop
				if (pattern.loop && i === this.patterns.length - 1) {
					data = Objects.deepClone(data);
				}
				this.fillProblemData(data, pattern, matches);
			}
		}
		let loop = !!this.patterns[this.patterns.length - 1].loop;
		if (!loop) {
			this.data = undefined;
		}
		const markerMatch = data ? this.getMarkerMatch(data) : null;
		return { match: markerMatch ? markerMatch : null, continue: loop };
	}

	public next(line: string): ProblemMatch | null {
		let pattern = this.patterns[this.patterns.length - 1];
		Assert.ok(pattern.loop === true && this.data !== null);
		let matches = pattern.regexp.exec(line);
		if (!matches) {
			this.data = undefined;
			return null;
		}
		let data = Objects.deepClone(this.data);
		let problemMatch: ProblemMatch | undefined;
		if (this.fillProblemData(data, pattern, matches)) {
			problemMatch = this.getMarkerMatch(data);
		}
		return problemMatch ? problemMatch : null;
	}
}

export interface ProblemPattern {
	regexp: RegExp;

	kind?: ProblemLocationKind;

	file?: number;

	message?: number;

	location?: number;

	line?: number;

	character?: number;

	endLine?: number;

	endCharacter?: number;

	code?: number;

	severity?: number;

	loop?: boolean;
}

export interface NamedProblemPattern extends ProblemPattern {
	name: string;
}

export type MultiLineProblemPattern = ProblemPattern[];

export enum ProblemLocationKind {
	File,
	Location
}

export enum FileLocationKind {
	Default,
	Relative,
	Absolute,
	AutoDetect
}

export module FileLocationKind {
	export function fromString(value: string): FileLocationKind | undefined {
		value = value.toLowerCase();
		if (value === 'absolute') {
			return FileLocationKind.Absolute;
		} else if (value === 'relative') {
			return FileLocationKind.Relative;
		} else if (value === 'autodetect') {
			return FileLocationKind.AutoDetect;
		} else {
			return undefined;
		}
	}
}

interface Location {
	startLineNumber: number;
	startCharacter: number;
	endLineNumber: number;
	endCharacter: number;
}

interface ProblemData {
	kind?: ProblemLocationKind;
	file?: string;
	location?: string;
	line?: string;
	character?: string;
	endLine?: string;
	endCharacter?: string;
	message?: string;
	severity?: string;
	code?: string;
}

export interface ProblemMatch {
	resource: Promise<vscode.Uri>;
	marker: IMarkerData;
	description: ProblemMatcher;
}

export interface HandleResult {
	match: ProblemMatch | null;
	continue: boolean;
}

export interface ProblemMatcher {
	owner: string;
	source?: string;
	applyTo: ApplyToKind;
	fileLocation: FileLocationKind;
	filePrefix?: string;
	pattern: ProblemPattern | ProblemPattern[];
	severity?: Severity;
	// watching?: WatchingMatcher;
	uriProvider?: (path: string) => vscode.Uri;
}

export module ApplyToKind {
	export function fromString(value: string): ApplyToKind | undefined {
		value = value.toLowerCase();
		if (value === 'alldocuments') {
			return ApplyToKind.allDocuments;
		} else if (value === 'opendocuments') {
			return ApplyToKind.openDocuments;
		} else if (value === 'closeddocuments') {
			return ApplyToKind.closedDocuments;
		} else {
			return undefined;
		}
	}
}

export enum ApplyToKind {
	allDocuments,
	openDocuments,
	closedDocuments
}

/**
 * IFileService is used to fetch files and resolve stats about files.  It is
 * actually not currently needed, but acts as a placeholder from the copied
 * code.
 */
export interface IFileService {
}

export interface IFileStreamContent {

	/**
	 * The content of a file as stream.
	 */
	value: Buffer;
}

export enum MarkerSeverity {
	Hint = 1,
	Info = 2,
	Warning = 4,
	Error = 8,
}

export namespace MarkerSeverity {

	export function compare(a: MarkerSeverity, b: MarkerSeverity): number {
		return b - a;
	}

	const _displayStrings: { [value: number]: string; } = Object.create(null);
	_displayStrings[MarkerSeverity.Error] = 'Error';
	_displayStrings[MarkerSeverity.Warning] = 'Warning';
	_displayStrings[MarkerSeverity.Info] = 'Info';

	export function toString(a: MarkerSeverity): string {
		return _displayStrings[a] || '';
	}

	export function fromSeverity(severity: Severity): MarkerSeverity {
		switch (severity) {
			case Severity.Error: return MarkerSeverity.Error;
			case Severity.Warning: return MarkerSeverity.Warning;
			// case Severity.Info: return MarkerSeverity.Info;
			// case Severity.Ignore: return MarkerSeverity.Hint;
			default:
				return MarkerSeverity.Warning;
		}
	}

	export function toSeverity(severity: MarkerSeverity): Severity {
		switch (severity) {
			case MarkerSeverity.Error: return Severity.Error;
			case MarkerSeverity.Warning: return Severity.Warning;
			// case MarkerSeverity.Info: return Severity.Info;
			// case MarkerSeverity.Hint: return
			// Severity.Ignore;
			default:
				return Severity.Warning;
		}
	}
}


export async function getResource(filename: string, matcher: ProblemMatcher, fileService?: IFileService): Promise<vscode.Uri> {
	let kind = matcher.fileLocation;
	let fullPath: string | undefined;
	if (kind === FileLocationKind.Absolute) {
		fullPath = filename;
	} else if ((kind === FileLocationKind.Relative) && matcher.filePrefix) {
		fullPath = path.join(matcher.filePrefix, filename);
	} else if (kind === FileLocationKind.AutoDetect) {
		throw new Error('AutoDetect not supported');
	}
	if (fullPath === undefined) {
		throw new Error('FileLocationKind is not actionable. Does the matcher have a filePrefix? This should never happen.');
	}
	fullPath = path.normalize(fullPath);
	fullPath = fullPath.replace(/\\/g, '/');
	if (fullPath[0] !== '/') {
		fullPath = '/' + fullPath;
	}
	if (matcher.uriProvider !== undefined) {
		return matcher.uriProvider(fullPath);
	} else {
		return vscode.Uri.file(fullPath);
	}
}

export const enum ProblemCollectorEventKind {
	BackgroundProcessingBegins = 'backgroundProcessingBegins',
	BackgroundProcessingEnds = 'backgroundProcessingEnds'
}

export interface ProblemCollectorEvent {
	kind: ProblemCollectorEventKind;
}

namespace ProblemCollectorEvent {
	export function create(kind: ProblemCollectorEventKind) {
		return Object.freeze({ kind });
	}
}

export interface IProblemMatcher {
	processLine(line: string): void;
}

export class LineDecoder {
	private stringDecoder: StringDecoder;
	private remaining: string | null;

	constructor(encoding: string = 'utf8') {
		this.stringDecoder = new StringDecoder(encoding);
		this.remaining = null;
	}

	public write(buffer: Buffer): string[] {
		let result: string[] = [];
		let value = this.remaining
			? this.remaining + this.stringDecoder.write(buffer)
			: this.stringDecoder.write(buffer);

		if (value.length < 1) {
			return result;
		}
		let start = 0;
		let ch: number;
		while (start < value.length && ((ch = value.charCodeAt(start)) === 13 || ch === 10)) {
			start++;
		}
		let idx = start;
		while (idx < value.length) {
			ch = value.charCodeAt(idx);
			if (ch === 13 || ch === 10) {
				result.push(value.substring(start, idx));
				idx++;
				while (idx < value.length && ((ch = value.charCodeAt(idx)) === 13 || ch === 10)) {
					idx++;
				}
				start = idx;
			} else {
				idx++;
			}
		}
		this.remaining = start < value.length ? value.substr(start) : null;
		return result;
	}

	public end(): string | null {
		return this.remaining;
	}
}


/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are strings.
 */
export type IStringDictionary<V> = Record<string, V>;


/**
 * An interface for a JavaScript object that
 * acts a dictionary. The keys are numbers.
 */
export type INumberDictionary<V> = Record<number, V>;



export abstract class AbstractProblemCollector implements vscode.Disposable {

	private matchers: INumberDictionary<ILineMatcher[]>;
	private activeMatcher: ILineMatcher | null;
	private _numberOfMatches: number;
	private _maxMarkerSeverity?: MarkerSeverity;
	private buffer: string[];
	private bufferLength: number;
	private tail: Promise<void> | undefined;

	// [owner] -> ApplyToKind
	protected applyToByOwner: Map<string, ApplyToKind>;
	// [owner] -> [resource] -> URI
	private resourcesToClean: Map<string, Map<string, vscode.Uri>>;
	// [owner] -> [resource] -> [markerkey] -> markerData
	private markers: Map<string, Map<string, Map<string, IMarkerData>>>;
	// [owner] -> [resource] -> number;
	private deliveredMarkers: Map<string, Map<string, number>>;

	protected _onDidStateChange: vscode.EventEmitter<ProblemCollectorEvent>;

	constructor(problemMatchers: ProblemMatcher[], protected markerService: IMarkerService, fileService?: IFileService) {
		this.matchers = Object.create(null);
		this.bufferLength = 1;
		problemMatchers.map(elem => createLineMatcher(elem, fileService)).forEach((matcher) => {
			let length = matcher.matchLength;
			if (length > this.bufferLength) {
				this.bufferLength = length;
			}
			let value = this.matchers[length];
			if (!value) {
				value = [];
				this.matchers[length] = value;
			}
			value.push(matcher);
		});
		this.buffer = [];
		this.activeMatcher = null;
		this._numberOfMatches = 0;
		this._maxMarkerSeverity = undefined;
		this.applyToByOwner = new Map<string, ApplyToKind>();
		for (let problemMatcher of problemMatchers) {
			let current = this.applyToByOwner.get(problemMatcher.owner);
			if (current === undefined) {
				this.applyToByOwner.set(problemMatcher.owner, problemMatcher.applyTo);
			} else {
				this.applyToByOwner.set(problemMatcher.owner, this.mergeApplyTo(current, problemMatcher.applyTo));
			}
		}
		this.resourcesToClean = new Map<string, Map<string, vscode.Uri>>();
		this.markers = new Map<string, Map<string, Map<string, IMarkerData>>>();
		this.deliveredMarkers = new Map<string, Map<string, number>>();

		this._onDidStateChange = new vscode.EventEmitter();
	}

	public get onDidStateChange(): vscode.Event<ProblemCollectorEvent> {
		return this._onDidStateChange.event;
	}

	public async processLine(line: string): Promise<void> {
		if (this.tail) {
			const oldTail = this.tail;
			this.tail = oldTail.then(() => {
				return this.processLineInternal(line);
			});
		} else {
			this.tail = this.processLineInternal(line);
		}
	}

	protected abstract processLineInternal(line: string): Promise<void>;

	public dispose() {
	}

	public get numberOfMatches(): number {
		return this._numberOfMatches;
	}

	public get maxMarkerSeverity(): MarkerSeverity | undefined {
		return this._maxMarkerSeverity;
	}

	protected tryFindMarker(line: string): ProblemMatch | null {
		let result: ProblemMatch | null = null;
		if (this.activeMatcher) {
			result = this.activeMatcher.next(line);
			if (result) {
				this.captureMatch(result);
				return result;
			}
			this.clearBuffer();
			this.activeMatcher = null;
		}
		if (this.buffer.length < this.bufferLength) {
			this.buffer.push(line);
		} else {
			let end = this.buffer.length - 1;
			for (let i = 0; i < end; i++) {
				this.buffer[i] = this.buffer[i + 1];
			}
			this.buffer[end] = line;
		}

		result = this.tryMatchers();
		if (result) {
			this.clearBuffer();
		}
		return result;
	}

	protected async shouldApplyMatch(result: ProblemMatch): Promise<boolean> {
		return true;
		// switch (result.description.applyTo) {
		// 	case ApplyToKind.allDocuments:
		// 		return true;
		// 	case ApplyToKind.openDocuments:
		// 		return !!this.openModels[(await result.resource).toString()];
		// 	case ApplyToKind.closedDocuments:
		// 		return !this.openModels[(await result.resource).toString()];
		// 	default:
		// 		return true;
		// }
	}

	private mergeApplyTo(current: ApplyToKind, value: ApplyToKind): ApplyToKind {
		if (current === value || current === ApplyToKind.allDocuments) {
			return current;
		}
		return ApplyToKind.allDocuments;
	}

	private tryMatchers(): ProblemMatch | null {
		this.activeMatcher = null;
		let length = this.buffer.length;
		for (let startIndex = 0; startIndex < length; startIndex++) {
			let candidates = this.matchers[length - startIndex];
			if (!candidates) {
				continue;
			}
			for (const matcher of candidates) {
				let result = matcher.handle(this.buffer, startIndex);
				if (result.match) {
					this.captureMatch(result.match);
					if (result.continue) {
						this.activeMatcher = matcher;
					}
					return result.match;
				}
			}
		}
		return null;
	}

	private captureMatch(match: ProblemMatch): void {
		this._numberOfMatches++;
		if (this._maxMarkerSeverity === undefined || match.marker.severity > this._maxMarkerSeverity) {
			this._maxMarkerSeverity = match.marker.severity;
		}
	}

	private clearBuffer(): void {
		if (this.buffer.length > 0) {
			this.buffer = [];
		}
	}

	protected recordResourcesToClean(owner: string): void {
		let resourceSetToClean = this.getResourceSetToClean(owner);
		this.markerService.read({ owner: owner }).forEach(marker => resourceSetToClean.set(marker.resource.toString(), marker.resource));
	}

	protected recordResourceToClean(owner: string, resource: vscode.Uri): void {
		this.getResourceSetToClean(owner).set(resource.toString(), resource);
	}

	protected removeResourceToClean(owner: string, resource: string): void {
		let resourceSet = this.resourcesToClean.get(owner);
		if (resourceSet) {
			resourceSet.delete(resource);
		}
	}

	private getResourceSetToClean(owner: string): Map<string, vscode.Uri> {
		let result = this.resourcesToClean.get(owner);
		if (!result) {
			result = new Map<string, vscode.Uri>();
			this.resourcesToClean.set(owner, result);
		}
		return result;
	}

	protected cleanAllMarkers(): void {
		this.resourcesToClean.forEach((value, owner) => {
			this._cleanMarkers(owner, value);
		});
		this.resourcesToClean = new Map<string, Map<string, vscode.Uri>>();
	}

	protected cleanMarkers(owner: string): void {
		let toClean = this.resourcesToClean.get(owner);
		if (toClean) {
			this._cleanMarkers(owner, toClean);
			this.resourcesToClean.delete(owner);
		}
	}

	private _cleanMarkers(owner: string, toClean: Map<string, vscode.Uri>): void {
		let uris: vscode.Uri[] = [];
		// let applyTo = this.applyToByOwner.get(owner);
		// toClean.forEach((uri, uriAsString) => {
		// 	if (
		// 		applyTo === ApplyToKind.allDocuments ||
		// 		(applyTo === ApplyToKind.openDocuments && this.openModels[uriAsString]) ||
		// 		(applyTo === ApplyToKind.closedDocuments && !this.openModels[uriAsString])
		// 	) {
		// 		uris.push(uri);
		// 	}
		// });
		this.markerService.remove(owner, uris);
	}

	protected recordMarker(marker: IMarkerData, owner: string, resourceAsString: string): void {
		let markersPerOwner = this.markers.get(owner);
		if (!markersPerOwner) {
			markersPerOwner = new Map<string, Map<string, IMarkerData>>();
			this.markers.set(owner, markersPerOwner);
		}
		let markersPerResource = markersPerOwner.get(resourceAsString);
		if (!markersPerResource) {
			markersPerResource = new Map<string, IMarkerData>();
			markersPerOwner.set(resourceAsString, markersPerResource);
		}
		let key = IMarkerData.makeKeyOptionalMessage(marker, false);
		let existingMarker;
		if (!markersPerResource.has(key)) {
			markersPerResource.set(key, marker);
		} else if (((existingMarker = markersPerResource.get(key)) !== undefined) && existingMarker.message.length < marker.message.length) {
			// Most likely https://github.com/microsoft/vscode/issues/77475
			// Heuristic dictates that when the key is the same and message is smaller, we have hit this limitation.
			markersPerResource.set(key, marker);
		}
	}

	protected reportMarkers(): void {
		this.markers.forEach((markersPerOwner, owner) => {
			let deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
			markersPerOwner.forEach((markers, resource) => {
				this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markers, deliveredMarkersPerOwner);
			});
		});
	}

	protected deliverMarkersPerOwnerAndResource(owner: string, resource: string): void {
		let markersPerOwner = this.markers.get(owner);
		if (!markersPerOwner) {
			return;
		}
		let deliveredMarkersPerOwner = this.getDeliveredMarkersPerOwner(owner);
		let markersPerResource = markersPerOwner.get(resource);
		if (!markersPerResource) {
			return;
		}
		this.deliverMarkersPerOwnerAndResourceResolved(owner, resource, markersPerResource, deliveredMarkersPerOwner);
	}

	private deliverMarkersPerOwnerAndResourceResolved(owner: string, resource: string, markers: Map<string, IMarkerData>, reported: Map<string, number>): void {
		if (markers.size !== reported.get(resource)) {
			let toSet: IMarkerData[] = [];
			markers.forEach(value => toSet.push(value));
			this.markerService.changeOne(owner, vscode.Uri.parse(resource), toSet);
			reported.set(resource, markers.size);
		}
	}

	private getDeliveredMarkersPerOwner(owner: string): Map<string, number> {
		let result = this.deliveredMarkers.get(owner);
		if (!result) {
			result = new Map<string, number>();
			this.deliveredMarkers.set(owner, result);
		}
		return result;
	}

	protected cleanMarkerCaches(): void {
		this._numberOfMatches = 0;
		this._maxMarkerSeverity = undefined;
		this.markers.clear();
		this.deliveredMarkers.clear();
	}

	public done(): void {
		this.reportMarkers();
		this.cleanAllMarkers();
	}
}

export const enum ProblemHandlingStrategy {
	Clean
}

export class StartStopProblemCollector extends AbstractProblemCollector implements IProblemMatcher {
	private owners: string[];

	private currentOwner: string | undefined;
	private currentResource: string | undefined;

	constructor(problemMatchers: ProblemMatcher[], markerService: IMarkerService, _strategy: ProblemHandlingStrategy = ProblemHandlingStrategy.Clean, fileService?: IFileService) {
		super(problemMatchers, markerService, fileService);
		let ownerSet: { [key: string]: boolean; } = Object.create(null);
		problemMatchers.forEach(description => ownerSet[description.owner] = true);
		this.owners = Object.keys(ownerSet);
		this.owners.forEach((owner) => {
			this.recordResourcesToClean(owner);
		});
	}

	protected async processLineInternal(line: string): Promise<void> {
		let markerMatch = this.tryFindMarker(line);
		if (!markerMatch) {
			return;
		}

		let owner = markerMatch.description.owner;
		try {
			let resource = await markerMatch.resource;
			let resourceAsString = resource.toString();
			this.removeResourceToClean(owner, resourceAsString);
			let shouldApplyMatch = await this.shouldApplyMatch(markerMatch);
			if (shouldApplyMatch) {
				this.recordMarker(markerMatch.marker, owner, resourceAsString);
				if (this.currentOwner !== owner || this.currentResource !== resourceAsString) {
					if (this.currentOwner && this.currentResource) {
						this.deliverMarkersPerOwnerAndResource(this.currentOwner, this.currentResource);
					}
					this.currentOwner = owner;
					this.currentResource = resourceAsString;
				}
			}

		} catch (e) {
			console.error('processLineInrternal err', e);
		}
	}
}
