import * as vscode from 'vscode';
import { API } from './api';
import { BazelDocFeature } from './bazeldoc/feature';
import { BazelrcFeature } from './bazelrc/feature';
import { BazelStackVSCodeAPI } from 'bazel-stack-vscode-api';
import { BezelFeature } from './bezel/feature';
import { BuildifierFeature } from './buildifier/feature';
import { BuiltInCommands, Telemetry, CommandName, openExtensionSetting } from './constants';
import { Container } from './container';

const api = new API();

export function activate(ctx: vscode.ExtensionContext): BazelStackVSCodeAPI {
  try {
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
  } catch (err) {
    console.log('Activation err', err);
    throw err;
  }
}

export function deactivate() {
  Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionDeactivate);
  Container.dispose();
}

