import * as vscode from "vscode";

import { IExtensionFeature } from "../common";
import { BazelDocConfiguration, builtInGroups } from "./configuration";
import { BazelDocGroupHover } from "./hover";

export class BazelDocFeature implements IExtensionFeature {
    public readonly name = "feature.bazeldoc";

    private cfg: BazelDocConfiguration | undefined;
    private hover: BazelDocGroupHover | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
            verbose: config.get<number>("verbose", 0),
            groups: builtInGroups,
        };

        if (cfg.baseUrl.endsWith('/')) {
            cfg.baseUrl = cfg.baseUrl.slice(0, -1);
        }

        this.hover = new BazelDocGroupHover(cfg);

        if (cfg.verbose > 0) {
            this.info(`activated.`);
        }
    }
    
    info(msg: string) {
        vscode.window.showInformationMessage(`${this.name}:  ${msg}`);
    }

    public deactivate() {
        if (this.hover) {
            this.hover.dispose();
            delete(this.hover);
        }
        if (this.cfg && this.cfg.verbose > 0) {
            this.info(`deactivated.`);
        }
    }
}
