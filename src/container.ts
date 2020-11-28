import * as vscode from 'vscode';
import TelemetryReporter from 'vscode-extension-telemetry';
import { ITelemetry } from './common';
import { AIKey, ExtensionID, Telemetry } from './constants';
import path = require('path');
import protobuf = require('protobufjs');

export class Container {
    private static _context: vscode.ExtensionContext;
    private static _telemetry: TelemetryReporter;

    public static buildEventType: Promise<protobuf.Type>;
    public static debugEventType: Promise<protobuf.Type>;
    public static debugRequestType: Promise<protobuf.Type>;

    static initialize(context: vscode.ExtensionContext) {
        Container._context = context;
        this.initializeTelemetry(context);
        this.initializeBuildEventStreamTypes(context);
        this.initializeStarlarkDebuggingTypes(context);
    }

    private static initializeBuildEventStreamTypes(context: vscode.ExtensionContext) {
        const protoPath = path.join(context.extensionPath, 'proto', 'build_event_stream.proto');
        this.buildEventType = protobuf.load(protoPath).then(root => root.lookupType('build_event_stream.BuildEvent'));
    }

    private static initializeStarlarkDebuggingTypes(context: vscode.ExtensionContext) {
        const protoPath = path.join(context.extensionPath, 'proto', 'starlark_debugging.proto');
        this.debugEventType = protobuf.load(protoPath).then(root => root.lookupType('starlark_debugging.DebugEvent'));
        this.debugRequestType = protobuf.load(protoPath).then(root => root.lookupType('starlark_debugging.DebugRequest'));
    }

    private static initializeTelemetry(context: vscode.ExtensionContext) {
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
