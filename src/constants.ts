import * as vscode from 'vscode';

export const ExtensionName = 'bazel-stack-vscode';

export enum BuiltInCommands {
	SetContext = 'setContext',
    OpenSettings = 'workbench.action.openSettings',
    Open = 'vscode.open',
    OpenFolder = 'vscode.openFolder',
    RevealFileInOS = 'revealFileInOS',
    MarkdownPreview = 'markdown.showPreview',
}

export function setCommandContext(key: string, value: any) {
	return vscode.commands.executeCommand(BuiltInCommands.SetContext, key, value);
}

export function platformBinaryName(toolName: string) {
    if (process.platform === 'win32') {
        return toolName + '.exe';
    }
    if (process.platform === 'darwin') {
        return toolName + '.mac';
    }
    return toolName;
}
