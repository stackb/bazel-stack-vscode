import * as vscode from 'vscode';
import { BuiltInCommands } from '../../constants';
import { FileName } from '../constants';
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
		disposables.push(vscode.commands.registerCommand(name, this.handleCommand, this));
	}

	async handleCommand(): Promise<void> {
		const uri = vscode.Uri.file(this.asAbsolutePath(path.join(FileName.HelpDir, this.name + '.md')));
		return vscode.commands.executeCommand(BuiltInCommands.MarkdownPreview, uri, undefined, {
			locked: true,
		});
	}

}
