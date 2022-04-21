import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ConfigurationContext, ITelemetry } from './common';
import { AIKey, ExtensionID, Telemetry } from './constants';
import path = require('path');
import ILogger from './vendor/microsoft/vscode-file-downloader/logging/ILogger';

export class Container {
  private static _configCtx: ConfigurationContext;
  private static _telemetry: TelemetryReporter;

  static initialize(configCtx: ConfigurationContext, disposables: vscode.Disposable[]) {
    this._configCtx = configCtx;

    const packageJSON = vscode.extensions.getExtension(ExtensionID)?.packageJSON;
    const version = packageJSON.version;

    Container._telemetry = new TelemetryReporter(ExtensionID, version, AIKey);
    disposables.push(Container._telemetry);

    Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionActivate);
  }

  static get logger(): ILogger {
    return Container._configCtx.logger;
  }

  static get telemetry(): ITelemetry {
    return Container._telemetry;
  }

  static media(name: MediaIconName): vscode.Uri {
    return vscode.Uri.file(path.join(this._configCtx.extensionUri.fsPath, 'media', name));
  }

  static dispose() {
    Container._telemetry.dispose();
  }
}

export enum MediaIconName {
  BazelIcon = 'bazel-icon.svg',
  BazelWireframe = 'bazel-wireframe.svg',
  Workspace = 'workspace.svg',
  WorkspaceGray = 'workspace-gray.svg',
  Package = 'package.svg',
  PackageGray = 'package-gray.svg',
  StackBuild = 'stackb.svg',
  StackBuildBlue = 'stackb-blue.svg',
}
