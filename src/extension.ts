import * as vscode from 'vscode';
import { API } from './api';
import { BazelDocFeature } from './bazeldoc/feature';
import { BazelrcFeature } from './bazelrc/feature';
import { BazelStackVSCodeAPI } from 'bazel-stack-vscode-api';
import { BzlFeature } from './bezel/feature';
import { Telemetry, CommandName, openExtensionSetting } from './constants';
import { Container } from './container';
import path = require('path');
import { ConfigurationContext, ConfigurationPropertyMap } from './common';

const api = new API();

export function activate(ctx: vscode.ExtensionContext): BazelStackVSCodeAPI {
  try {
    const packageJsonPath = path.join(ctx.extensionUri.fsPath, 'package.json');
    const packageJSON = require(packageJsonPath);
    const properties = packageJSON['contributes']['configuration']['properties'] as ConfigurationPropertyMap;
    const configCtx = new ConfigurationContext(
      ctx.extensionUri,
      ctx.globalStorageUri,
      ctx.workspaceState,
      properties,
    );

    Container.initialize(configCtx);

    ctx.subscriptions.push(
      vscode.commands.registerCommand(CommandName.OpenSetting, openExtensionSetting)
    );


    ctx.subscriptions.push(new BazelDocFeature());
    ctx.subscriptions.push(new BazelrcFeature(configCtx));
    ctx.subscriptions.push(new BzlFeature(api, ctx, configCtx));

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
