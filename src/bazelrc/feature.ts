import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { BazelrcCodelens } from "./codelens";
import { createBazelrcConfiguration } from "./configuration";
import { BazelFlagSupport } from "./flags";

export const BazelrcFeatureName = "feature.bazelrc";

export class BazelrcFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BazelrcFeatureName;

    private disposables: vscode.Disposable[] = [];

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBazelrcConfiguration(ctx, config);
        this.disposables.push(new BazelrcCodelens(cfg.run.executable));

        const flags = new BazelFlagSupport(cfg.flag);
        await flags.load();

        this.disposables.push(flags);
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
