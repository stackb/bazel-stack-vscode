import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { WorkspaceServiceClient } from "../proto/build/stack/bezel/v1beta1/WorkspaceService";
import { LicensesClient } from "../proto/build/stack/license/v1beta1/Licenses";
import { createBzlConfiguration, createLicensesClient, createWorkspaceServiceClient, loadBzlProtos, loadLicenseProtos } from "./configuration";
import { BzlLicenseStatus } from "./view/license";
import { BazelRepositoryListView } from "./view/repositories";

export const BzlFeatureName = "feature.bzl";

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private licensesClient: LicensesClient | undefined;
    private workspaceServiceClient: WorkspaceServiceClient | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);

        const licenseClient = this.licensesClient = createLicensesClient(
            loadLicenseProtos(cfg.license.protofile), 
            cfg.license.address);
        const license = new BzlLicenseStatus(cfg.license, licenseClient);
        this.disposables.push(license);

        const workspaceServiceClient = this.workspaceServiceClient = createWorkspaceServiceClient(
            loadBzlProtos(cfg.server.protofile), 
            cfg.server.address);
            
        const repositories = new BazelRepositoryListView(workspaceServiceClient);
        this.disposables.push(repositories);
    }

    public deactivate() {
        this.dispose();
    }

    public dispose() {
        if (this.licensesClient) {
            this.licensesClient.close();
            delete (this.licensesClient);
        }
        if (this.workspaceServiceClient) {
            this.workspaceServiceClient.close();
            delete (this.workspaceServiceClient);
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
