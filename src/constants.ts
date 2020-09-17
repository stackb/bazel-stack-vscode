import * as vscode from 'vscode';

export const ExtensionName = 'bazel-stack-vscode';

export enum BuiltInCommands {
	SetContext = 'setContext',
    OpenSettings = 'workbench.action.openSettings',
    Open = 'vscode.open',
    OpenFolder = 'vscode.openFolder'
}

export enum CustomCommands {
    OpenExtensionSetting = 'bsv.openExtensionSetting'
}

export function setCommandContext(key: string, value: any) {
	return vscode.commands.executeCommand(BuiltInCommands.SetContext, key, value);
}

