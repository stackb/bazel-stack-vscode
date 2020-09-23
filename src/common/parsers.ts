/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export const enum ValidationState {
	OK = 0,
	Info = 1,
	Warning = 2,
	Error = 3,
	Fatal = 4
}

export class ValidationStatus {
	private _state: ValidationState;

	constructor() {
		this._state = ValidationState.OK;
	}

	public get state(): ValidationState {
		return this._state;
	}

	public set state(value: ValidationState) {
		if (value > this._state) {
			this._state = value;
		}
	}

	public isOK(): boolean {
		return this._state === ValidationState.OK;
	}

	public isFatal(): boolean {
		return this._state === ValidationState.Fatal;
	}
}

export interface IProblemReporter {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	fatal(message: string): void;
	status: ValidationStatus;
}

export abstract class Parser {

	private _problemReporter: IProblemReporter;

	constructor(problemReporter: IProblemReporter) {
		this._problemReporter = problemReporter;
	}

	public reset(): void {
		this._problemReporter.status.state = ValidationState.OK;
	}

	public get problemReporter(): IProblemReporter {
		return this._problemReporter;
	}

	public info(message: string): void {
		this._problemReporter.info(message);
	}

	public warn(message: string): void {
		this._problemReporter.warn(message);
	}

	public error(message: string): void {
		this._problemReporter.error(message);
	}

	public fatal(message: string): void {
		this._problemReporter.fatal(message);
	}
}

export interface IOutputChannel {

	// /**
	//  * Identifier of the output channel.
	//  */
	// id: string;

	// /**
	//  * Label of the output channel to be displayed to the user.
	//  */
	// label: string;

	// /**
	//  * URI of the output channel.
	//  */
	// uri: URI;

	/**
	 * Appends output to the channel.
	 */
	append(output: string): void;

	// /**
	//  * Update the channel.
	//  */
	// update(): void;

	// /**
	//  * Clears all received output for this channel.
	//  */
	// clear(till?: number): void;

	// /**
	//  * Disposes the output channel.
	//  */
	// dispose(): void;
}

export class ProblemReporter implements IProblemReporter {

	private _validationStatus: ValidationStatus;

	constructor(private _outputChannel: IOutputChannel) {
		this._validationStatus = new ValidationStatus();
	}

	public info(message: string): void {
		this._validationStatus.state = ValidationState.Info;
		this._outputChannel.append(message + '\n');
	}

	public warn(message: string): void {
		this._validationStatus.state = ValidationState.Warning;
		this._outputChannel.append(message + '\n');
	}

	public error(message: string): void {
		this._validationStatus.state = ValidationState.Error;
		this._outputChannel.append(message + '\n');
	}

	public fatal(message: string): void {
		this._validationStatus.state = ValidationState.Fatal;
		this._outputChannel.append(message + '\n');
	}

	public get status(): ValidationStatus {
		return this._validationStatus;
	}
}
