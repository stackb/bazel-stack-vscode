import * as vscode from "vscode";

import { IExtensionFeature, info } from "../common";
import { StardocConfiguration, builtInGroups } from "./configuration";
import { StardocHover } from "./hover";

export const StardocFeatureName = "feature.bazeldoc";

export class StardocFeature implements IExtensionFeature {
    public readonly name = StardocFeatureName;

    private cfg: StardocConfiguration | undefined;
    private hover: StardocHover | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
            verbose: config.get<number>("verbose", 0),
            groups: builtInGroups,
        };

        if (cfg.baseUrl.endsWith('/')) {
            cfg.baseUrl = cfg.baseUrl.slice(0, -1);
        }

        this.hover = new StardocHover(cfg);

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
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
