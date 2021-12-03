import * as vscode from 'vscode';
import { State } from 'vscode-languageclient';

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
  OpenFolder = 'vscode.openFolder',
  OpenSettings = 'workbench.action.openSettings',
  Reload = 'workbench.action.reloadWindow',
  RevealFileInOS = 'revealFileInOS',
  FocusTerminal = 'workbench.action.terminal.focus',
}

export function setCommandContext(key: string, value: any) {
  return vscode.commands.executeCommand(BuiltInCommands.SetContext, key, value);
}

/**
 * Options for the OpenSetting command
 */
type OpenSettingCommandOptions = {
  // The query string
  q: string;
};

export async function openExtensionSetting(options: OpenSettingCommandOptions): Promise<any> {
  return vscode.commands.executeCommand(BuiltInCommands.OpenSettings, options?.q);
}
