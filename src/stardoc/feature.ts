import * as vscode from "vscode";

import { IExtensionFeature, info } from "../common";
import { StardocConfiguration, builtInGroups } from "./configuration";
import { StardocHover } from "./hover";
import { StardocModulesServer } from "./moduleinfo/server";
import { createModulesClient } from "../proto/stardoc_output/index";
import { ModulesClient } from '../proto/stardoc_output/Modules';

export const StardocFeatureName = "feature.stardoc";

export class StardocFeature implements IExtensionFeature {
    public readonly name = StardocFeatureName;

    private cfg: StardocConfiguration | undefined;
    private hover: StardocHover | undefined;
    private server: StardocModulesServer | undefined;
    private client: ModulesClient | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
            verbose: config.get<number>("verbose", 0),
            groups: builtInGroups,
        };

        if (cfg.baseUrl.endsWith('/')) {
            cfg.baseUrl = cfg.baseUrl.slice(0, -1);
        }

        this.server = new StardocModulesServer(cfg);

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
    }

    async start(cfg: StardocConfiguration) {
        const server = this.server;
        if (!server) {
            throw new Error(`server must exist before starting client`);
        }
        const client = this.client = createModulesClient(server.address);
        this.hover = new StardocHover(cfg, client);
    }

    public deactivate() {
        if (this.hover) {
            this.hover.dispose();
            delete(this.hover);
        }
        if (this.cfg && this.cfg.verbose > 0) {
            info(this, `deactivated.`);
        }
    }
}
