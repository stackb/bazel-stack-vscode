import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { LicensesClient } from "../proto/build/stack/license/v1beta1/Licenses";
import { createBzlConfiguration, createLicensesClient, loadProtos } from "./configuration";
import { BzlLicenseStatus } from "./view/license";

export const BzlFeatureName = "feature.bzl";

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private licensesClient: LicensesClient | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);
        const proto = loadProtos(cfg.license.protofile);
        const client = this.licensesClient = createLicensesClient(proto, cfg.license.server);
        const license = new BzlLicenseStatus(cfg.license, client);
        this.disposables.push(license);
    }

    public deactivate() {
        this.dispose();
    }

    public dispose() {
        if (this.licensesClient) {
            this.licensesClient.close();
            delete (this.licensesClient);
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
