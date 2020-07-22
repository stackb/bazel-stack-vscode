import * as vscode from "vscode";

export interface ExtensionModule {
    name: string
    activate(context: vscode.ExtensionContext): any
    deactivate(): any
    configure(config: vscode.WorkspaceConfiguration): any
}