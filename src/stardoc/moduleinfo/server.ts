import * as vscode from "vscode";
import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as fs from 'fs';
import { StardocConfiguration } from "../configuration";
import { createModulesServer, decodeStardocModuleFromFile } from "../../proto/stardoc_output/index";
import { ModulesHandlers } from '../../proto/stardoc_output/Modules';
import { GetModuleInfoRequest } from '../../proto/stardoc_output/GetModuleInfoRequest';
import { ModuleInfo, ModuleInfo__Output } from '../../proto/stardoc_output/ModuleInfo';

const BazelToolsWorkspaceName = '@bazel_tools';
const Latest = 'latest';

/**
 * A server implementation that provides modules from serialized moduleinfo files.
 */
export class StardocModulesServer implements vscode.Disposable, ModulesHandlers {

    private disposables: vscode.Disposable[] = [];
    private server: grpc.Server;

    /**
     * The set of infos already loaded, keyed by module
     */
    private infos: Map<string, ModuleInfo> = new Map();

    constructor(
        private cfg: StardocConfiguration
    ) {
        this.server = createModulesServer("localhost:50056", {
            "getModuleInfo": this.GetModuleInfo.bind(this),
        });
    }

    public start() {
        this.server.start();
    }

    public GetModuleInfo(
        call: grpc.ServerUnaryCall<GetModuleInfoRequest, ModuleInfo__Output>,
        callback: grpc.sendUnaryData<ModuleInfo__Output>): void {

        const request = call.request;
        if (!request?.module_name) {
            callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: `GetModuleInfoRequest module_name is mandatory`
            }, null);
            return;
        }

        const key = getRelativeModuleInfoFilename(request);
        let info = this.infos.get(key);
        if (!info) {
            const filename = getAbsoluteModuleInfoFilename(request);
            if (!fs.existsSync(filename)) {
                callback({
                    code: grpc.status.NOT_FOUND,
                    message: `Module not found: ${key}`
                }, null);
                return;
            }
            info = decodeStardocModuleFromFile(filename);
            this.infos.set(key, info);
        }

        callback({
            code: grpc.status.OK,
        }, info as ModuleInfo__Output);
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }

}

function getAbsoluteModuleInfoFilename(info: GetModuleInfoRequest): string {
    return path.join(__dirname, 'moduleinfo', getRelativeModuleInfoFilename(info));
}

function getRelativeModuleInfoFilename(info: GetModuleInfoRequest): string {
    let name = path.join(
        info.workspace_name || BazelToolsWorkspaceName,
        info.release_name || Latest,
        `${info.module_name}.moduleinfo`,
    );
    if (name.startsWith("@")) {
        name = name.slice(1);
    }
    return name;
}
