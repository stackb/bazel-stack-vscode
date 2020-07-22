import * as vscode from "vscode";

export interface IExtensionFeature {
    readonly name: string
    activate(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): any
    deactivate(): any
}
