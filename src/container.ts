import * as vscode from 'vscode';
import path = require('path');

export class Container {
    private static _context: vscode.ExtensionContext;
    static initialize(context: vscode.ExtensionContext) {
        Container._context = context;
    }

    get context(): vscode.ExtensionContext {
        return Container._context;
    }

    static media(name: MediaIconName): string {
        return path.join(Container._context.extensionPath, 'media', name);
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
