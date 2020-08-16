import { status } from '@grpc/grpc-js';
import { commands } from 'vscode';
import { ExtensionName } from '../constants';

export enum EndpointNames {
	WorkspaceServiceList = '/build.stack.bezel.v1beta1.WorkspaceService/List',
}

/**
 * This is used to test the 'setContext' functionality.  When gRPC errors occur
 * we set a context value EXTENSION_NAME:ENDPOINT_NAME.STATUS_CODE_NAME and use
 * in 'when' expressions to display different welcome views.  There does not
 * appear to be a 'getContext' command however, so to test this functionality we
 * save it on this singleton map also.
 */
export const contextValues: Map<string,string> = new Map();

export function getContextGrpcStatusKey(viewId: string, endpointName: string): string {
    return `${ExtensionName}:${viewId}:${endpointName}:status`;
}

export function setContextGrpcStatusValue(viewId: string, endpointName: string, code: status): Thenable<unknown> {
    const codeName = status[code];
    const key = getContextGrpcStatusKey(viewId, endpointName);
    contextValues.set(key, codeName);
    return commands.executeCommand('setContext', key, codeName);
}

export function clearContextGrpcStatusValue(viewId: string, endpointName: string): Thenable<unknown> {
    const key = getContextGrpcStatusKey(viewId, endpointName);
    contextValues.delete(key);
    return commands.executeCommand('setContext', key, undefined);
}

export function getContextGrpcStatusValue(viewId: string, endpointName: string): string | undefined {
    const key = getContextGrpcStatusKey(viewId, endpointName);
    return contextValues.get(key);
}
