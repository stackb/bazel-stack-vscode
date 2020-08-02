import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { BazelrcCodelens } from "./codelens";
import { createBazelrcConfiguration } from "./configuration";
import { BazelFlagHover } from "./flaghover";

export const BazelrcFeatureName = "feature.bazelrc";

export class BazelrcFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BazelrcFeatureName;

    private disposables: vscode.Disposable[] = [];

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBazelrcConfiguration(ctx, config);
        this.disposables.push(new BazelrcCodelens(ctx, cfg));

        const flagHover = new BazelFlagHover(cfg.flag);
        await flagHover.load();

        this.disposables.push(flagHover);
    }

    public deactivate() {
        this.dispose();
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
