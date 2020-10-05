import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';

export interface IExtensionFeature {
    // The name of the feature
    readonly name: string
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


/**
 * This is used to test the 'setContext' functionality.  When gRPC errors occur
 * we set a context value EXTENSION_NAME:ENDPOINT_NAME.STATUS_CODE_NAME and use
 * in 'when' expressions to display different welcome views.  There does not
 * appear to be a 'getContext' command however, so to test this functionality we
 * save it on this singleton map also.
 */
export const contextValues: Map<string, string> = new Map();

export function getContextGrpcStatusKey(extensionName: string, viewId: string): string {
    return `${extensionName}:${viewId}:status`;
}

export function setContextGrpcStatusValue(extensionName: string, viewId: string, err?: grpc.ServiceError): Thenable<unknown> {
    const codeName = err ? grpc.status[err.code] : grpc.status[grpc.status.OK];
    const key = getContextGrpcStatusKey(extensionName, viewId);
    contextValues.set(key, codeName);
    return vscode.commands.executeCommand('setContext', key, codeName);
}

export function clearContextGrpcStatusValue(extensionName: string, viewId: string): Thenable<unknown> {
    const key = getContextGrpcStatusKey(extensionName, viewId);
    contextValues.delete(key);
    return vscode.commands.executeCommand('setContext', key, undefined);
}

export function getContextGrpcStatusValue(extensionName: string, viewId: string): string | undefined {
    const key = getContextGrpcStatusKey(extensionName, viewId);
    return contextValues.get(key);
}
