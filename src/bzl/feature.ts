import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { ExternalWorkspaceServiceClient } from "../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService";
import { PackageServiceClient } from "../proto/build/stack/bezel/v1beta1/PackageService";
import { WorkspaceServiceClient } from "../proto/build/stack/bezel/v1beta1/WorkspaceService";
import { LicensesClient } from "../proto/build/stack/license/v1beta1/Licenses";
import { createBzlConfiguration, createExternalWorkspaceServiceClient, createLicensesClient, createPackageServiceClient, createWorkspaceServiceClient, loadBzlProtos, loadLicenseProtos } from "./configuration";
import { BzlLicenseStatus as BzlLicenseView } from "./view/license";
import { BazelPackageListView } from "./view/packages";
import { BazelRepositoryListView } from "./view/repositories";
import { BazelRuleListView } from "./view/rules";
import { BazelWorkspaceListView } from "./view/workspaces";

export const BzlFeatureName = "feature.bzl";

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private licensesClient: LicensesClient | undefined;
    private externalWorkspaceServiceClient: ExternalWorkspaceServiceClient | undefined;
    private workspaceServiceClient: WorkspaceServiceClient | undefined;
    private packageServiceClient: PackageServiceClient | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);
        const licenseProto = loadLicenseProtos(cfg.license.protofile);
        const bzlProto = loadBzlProtos(cfg.grpcServer.protofile);

        const licenseClient = this.licensesClient = createLicensesClient(
            licenseProto, cfg.license.address);
        const externalWorkspaceServiceClient = this.externalWorkspaceServiceClient = createExternalWorkspaceServiceClient(
            bzlProto,
            cfg.grpcServer.address);
        const workspaceServiceClient = this.workspaceServiceClient = createWorkspaceServiceClient(
            bzlProto,
            cfg.grpcServer.address);
        const packageServiceClient = this.packageServiceClient = createPackageServiceClient(
            bzlProto,
            cfg.grpcServer.address);

        const licenseView = new BzlLicenseView(cfg.license, licenseClient);
        const repositoryListView = new BazelRepositoryListView(cfg.httpServer, workspaceServiceClient);
        const workspaceListView = new BazelWorkspaceListView(
            cfg.httpServer,
            externalWorkspaceServiceClient,
            repositoryListView.getCurrentRepository.bind(repositoryListView),
            repositoryListView.onDidChangeCurrentRepository,
        );
        const packageListView = new BazelPackageListView(
            cfg.httpServer,
            packageServiceClient,
            repositoryListView.getCurrentRepository.bind(repositoryListView),
            repositoryListView.onDidChangeCurrentRepository,
            workspaceListView.getCurrentExternalWorkspace.bind(workspaceListView),
            workspaceListView.onDidChangeCurrentWorkspace,
        );
        const ruleListView = new BazelRuleListView(
            cfg.httpServer,
            packageServiceClient,
            repositoryListView.getCurrentRepository.bind(repositoryListView),
            repositoryListView.onDidChangeCurrentRepository,
            workspaceListView.getCurrentExternalWorkspace.bind(workspaceListView),
            workspaceListView.onDidChangeCurrentWorkspace,
        );

        this.disposables.push(licenseView);
        this.disposables.push(repositoryListView);
        this.disposables.push(workspaceListView);
        this.disposables.push(packageListView);
        this.disposables.push(ruleListView);
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
        if (this.packageServiceClient) {
            this.packageServiceClient.close();
            delete (this.packageServiceClient);
        }
        if (this.externalWorkspaceServiceClient) {
            this.externalWorkspaceServiceClient.close();
            delete (this.externalWorkspaceServiceClient);
        }
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
