/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Event } from './event';
import Severity from './severity';
// import { URI } from './uri';

export interface IMarkerService {
	readonly _serviceBrand: undefined;

	getStatistics(): MarkerStatistics;

	changeOne(owner: string, resource: vscode.Uri, markers: IMarkerData[]): void;

	changeAll(owner: string, data: IResourceMarker[]): void;

	remove(owner: string, resources: vscode.Uri[]): void;

	read(filter?: { owner?: string; resource?: vscode.Uri; severities?: number, take?: number; }): IMarker[];

	readonly onMarkerChanged: Event<readonly vscode.Uri[]>;
}

/**
 *
 */
export interface IRelatedInformation {
	resource: vscode.Uri;
	message: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
}

export const enum MarkerTag {
	Unnecessary = 1,
	Deprecated = 2
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
	_displayStrings[MarkerSeverity.Error] =  'Error';
	_displayStrings[MarkerSeverity.Warning] = 'Warning';
	_displayStrings[MarkerSeverity.Info] = 'Info';

	export function toString(a: MarkerSeverity): string {
		return _displayStrings[a] || '';
	}

	export function fromSeverity(severity: Severity): MarkerSeverity {
		switch (severity) {
			case Severity.Error: return MarkerSeverity.Error;
			case Severity.Warning: return MarkerSeverity.Warning;
			case Severity.Info: return MarkerSeverity.Info;
			case Severity.Ignore: return MarkerSeverity.Hint;
		}
	}

	export function toSeverity(severity: MarkerSeverity): Severity {
		switch (severity) {
			case MarkerSeverity.Error: return Severity.Error;
			case MarkerSeverity.Warning: return Severity.Warning;
			case MarkerSeverity.Info: return Severity.Info;
			case MarkerSeverity.Hint: return Severity.Ignore;
		}
	}

	export function toThemeIconName(severity: MarkerSeverity): string {
		switch (severity) {
			case MarkerSeverity.Error: return 'error';
			case MarkerSeverity.Warning: return 'warning';
			case MarkerSeverity.Info: return 'info';
			case MarkerSeverity.Hint: return 'comment';
		}
	}

	export function toDiagnosticSeverity(value: MarkerSeverity): vscode.DiagnosticSeverity | undefined {
		switch (value) {
			case MarkerSeverity.Warning: return vscode.DiagnosticSeverity.Warning;
			case MarkerSeverity.Error: return vscode.DiagnosticSeverity.Error;
			case MarkerSeverity.Info: return vscode.DiagnosticSeverity.Information;
			case MarkerSeverity.Hint: return vscode.DiagnosticSeverity.Hint;
			default:
				return undefined;
		}
	}

}

/**
 * A structure defining a problem/warning/etc.
 */
export interface IMarkerData {
	code?: string | { value: string; target: vscode.Uri };
	severity: MarkerSeverity;
	message: string;
	source?: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
	relatedInformation?: IRelatedInformation[];
	tags?: MarkerTag[];
}

export interface IResourceMarker {
	resource: vscode.Uri;
	marker: IMarkerData;
}

export interface IMarker {
	owner: string;
	resource: vscode.Uri;
	severity: MarkerSeverity;
	code?: string | { value: string; target: vscode.Uri };
	message: string;
	source?: string;
	startLineNumber: number;
	startColumn: number;
	endLineNumber: number;
	endColumn: number;
	relatedInformation?: IRelatedInformation[];
	tags?: MarkerTag[];
}

export interface MarkerStatistics {
	errors: number;
	warnings: number;
	infos: number;
	unknowns: number;
}

export namespace IMarkerData {
	const emptyString = '';
	export function makeKey(markerData: IMarkerData): string {
		return makeKeyOptionalMessage(markerData, true);
	}

	export function makeKeyOptionalMessage(markerData: IMarkerData, useMessage: boolean): string {
		let result: string[] = [emptyString];
		if (markerData.source) {
			result.push(markerData.source.replace('¦', '\\¦'));
		} else {
			result.push(emptyString);
		}
		if (markerData.code) {
			if (typeof markerData.code === 'string') {
				result.push(markerData.code.replace('¦', '\\¦'));
			} else {
				result.push(markerData.code.value.replace('¦', '\\¦'));
			}
		} else {
			result.push(emptyString);
		}
		if (markerData.severity !== undefined && markerData.severity !== null) {
			result.push(MarkerSeverity.toString(markerData.severity));
		} else {
			result.push(emptyString);
		}

		// Modifed to not include the message as part of the marker key to work around
		// https://github.com/microsoft/vscode/issues/77475
		if (markerData.message && useMessage) {
			result.push(markerData.message.replace('¦', '\\¦'));
		} else {
			result.push(emptyString);
		}
		if (markerData.startLineNumber !== undefined && markerData.startLineNumber !== null) {
			result.push(markerData.startLineNumber.toString());
		} else {
			result.push(emptyString);
		}
		if (markerData.startColumn !== undefined && markerData.startColumn !== null) {
			result.push(markerData.startColumn.toString());
		} else {
			result.push(emptyString);
		}
		if (markerData.endLineNumber !== undefined && markerData.endLineNumber !== null) {
			result.push(markerData.endLineNumber.toString());
		} else {
			result.push(emptyString);
		}
		if (markerData.endColumn !== undefined && markerData.endColumn !== null) {
			result.push(markerData.endColumn.toString());
		} else {
			result.push(emptyString);
		}
		result.push(emptyString);
		return result.join('¦');
	}
}

