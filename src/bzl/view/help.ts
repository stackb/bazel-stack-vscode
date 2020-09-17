import * as vscode from 'vscode';
import path = require('path');


/**
 * Render a help markdown preview.
 */
export class BzlHelp {

	constructor(
		private readonly name: string,
		private readonly asAbsolutePath: (rel: string) => string,
		disposables: vscode.Disposable[],
	) {
		disposables.push(vscode.commands.registerCommand(`feature.bzl.help.${name}`, this.handleCommand, this));
	}

	async handleCommand(): Promise<void> {
		const uri = vscode.Uri.file(this.asAbsolutePath(path.join('help', this.name + '.md')));
		return vscode.commands.executeCommand('markdown.showPreview', uri, undefined, {
			locked: true,
		});
	}

}
