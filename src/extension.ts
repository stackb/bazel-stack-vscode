import * as vscode from 'vscode';
import { BazelDocGroupHover } from "./bazelDocGroupHover";

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.languages.registerHoverProvider(
			{ scheme: 'file', language: 'bazel' }, 
			new BazelDocGroupHover(),
		),
	);
}

export function deactivate() {}
