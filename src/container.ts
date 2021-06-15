import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ITelemetry } from './common';
import { AIKey, ExtensionID, Telemetry } from './constants';
import path = require('path');

export class Container {
    private static _context: vscode.ExtensionContext;
    private static _telemetry: TelemetryReporter;

    static initialize(context: vscode.ExtensionContext) {
        Container._context = context;

        const packageJSON = vscode.extensions.getExtension(ExtensionID)?.packageJSON;
        const version = packageJSON.version;

        Container._telemetry = new TelemetryReporter(ExtensionID, version, AIKey);
        context.subscriptions.push(Container._telemetry);

        Container.telemetry.sendTelemetryEvent(Telemetry.ExtensionActivate);
    }

    public static get context(): vscode.ExtensionContext {
        return Container._context;
    }

    static get telemetry(): ITelemetry {
        return Container._telemetry;
    }

    static media(name: MediaIconName): vscode.Uri {
        return vscode.Uri.file(path.join(Container._context.extensionPath, 'media', name));
    }

    static protofile(name: string): vscode.Uri {
        return vscode.Uri.file(path.join(Container._context.extensionPath, 'proto', name));
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
}
