import * as vscode from 'vscode';
import { API } from './api';
import { BazelDocFeature } from './bazeldoc/feature';
import { BazelrcFeature } from './bazelrc/feature';
import { BazelStackVSCodeAPI } from 'bazel-stack-vscode-api';
import { BezelFeature } from './bezel/feature';
import { BuildifierFeature } from './buildifier/feature';
import { BuiltInCommands, Telemetry, CommandName } from './constants';
import { Container } from './container';

const api = new API();

export function activate(ctx: vscode.ExtensionContext): BazelStackVSCodeAPI {
  Container.initialize(ctx);

  ctx.subscriptions.push(
    vscode.commands.registerCommand(CommandName.OpenSetting, openExtensionSetting)
  );

  ctx.subscriptions.push(new BazelDocFeature());
  ctx.subscriptions.push(new BazelrcFeature());
  ctx.subscriptions.push(new BuildifierFeature());
  ctx.subscriptions.push(new BezelFeature(api));

  Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionActivate);

  return api;
}

export function deactivate() {
  Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionDeactivate);
  Container.dispose();
}

/**
 * Options for the OpenSetting command
 */
type OpenSettingCommandOptions = {
  // The query string
  q: string;
};

async function openExtensionSetting(options: OpenSettingCommandOptions): Promise<any> {
  return vscode.commands.executeCommand(BuiltInCommands.OpenSettings, options?.q);
}
