import * as vscode from 'vscode';
import { StarlarkDocGroupHover } from "./starlarkDocGroupHover";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ scheme: 'file', language: 'starlark' }, 
			new StarlarkDocGroupHover(),
		),
	);
}

export function deactivate() {}
