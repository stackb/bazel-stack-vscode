import * as vscode from 'vscode';

export interface IExtensionFeature {
    // The name of the feature
    readonly name: string
    // init is called for all features, regardless of enabled status.
    init(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any>
    // activate is called only when the feature is enabled upon activation
    activate(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any>
    // deactivate is called only when the feature is enabled upon deactivation
    deactivate(): any
}

export function warn(feature: IExtensionFeature, msg: string) {
    vscode.window.showWarningMessage(`${feature.name}:  ${msg}`);
}

export function info(feature: IExtensionFeature, msg: string) {
    vscode.window.showInformationMessage(`${feature.name}:  ${msg}`);
}

export function fail(feature: IExtensionFeature, msg: string): Promise<any> {
    return Promise.reject(`${feature.name}: ${msg}`);
}