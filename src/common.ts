import * as vscode from 'vscode';

export interface IExtensionFeature {
    readonly name: string
    activate(context: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any>
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