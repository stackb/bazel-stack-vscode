import * as vscode from 'vscode';

export const ExtensionID = 'stackbuild.bazel-stack-vscode';
export const ExtensionName = 'bazel-stack-vscode';
export const AIKey = '7193a682-d12f-49a5-a515-ef00ab3f0992';

export enum Telemetry {
  ExtensionActivate = 'ext.activate',
  ExtensionDeactivate = 'ext.deactivate',
  BzlRunTask = 'bzl.runTask',
  BzlEventBuildStarted = 'bzl.event.started',
}

export enum CommandName {
  OpenSetting = 'bsv.openExtensionSetting',
}

export enum BuiltInCommands {
  SetContext = 'setContext',
  ClosePanel = 'workbench.action.closePanel',
  Open = 'vscode.open',
  OpenSettings = 'workbench.action.openSettings',
  RevealFileInOS = 'revealFileInOS',
}

export function setCommandContext(key: string, value: any) {
  return vscode.commands.executeCommand(BuiltInCommands.SetContext, key, value);
}
