import * as vscode from "vscode";

import { IExtensionFeature } from "../common";
import { createStarlarkLSPConfiguration } from "./configuration";
import { StardocLSPClient } from "./client";
  
export class StarlarkLSPFeature implements IExtensionFeature {
    public readonly name = "feature.starlark.lsp";

    private client: StardocLSPClient | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createStarlarkLSPConfiguration(config);
        const client = this.client = new StardocLSPClient(ctx, cfg);
        client.start();
    }

    public deactivate() {
        if (this.client) {
            this.client.dispose();
            delete (this.client);
        }
    }
}
