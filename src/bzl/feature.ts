import * as vscode from "vscode";
import { IExtensionFeature } from "../common";
import { ProtoGrpcType as BzlProtoGrpcType } from "../proto/bzl";
// import { BzlServeProcess } from "./serve";
import { BzlServerClient } from "./client";
import { BzlConfiguration, createApplicationServiceClient, createBzlConfiguration, createExternalWorkspaceServiceClient, createLicensesClient, createPackageServiceClient, createWorkspaceServiceClient, loadBzlProtos, loadLicenseProtos } from "./configuration";
import { BzlLicenseStatus as BzlLicenseView } from "./view/license";
import { BzlPackageListView } from "./view/packages";
import { BzlRepositoryListView } from "./view/repositories";
import { BzlWorkspaceListView } from "./view/workspaces";

export const BzlFeatureName = "feature.bzl";

interface Closeable {
    close(): void;
}

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private closeables: Closeable[] = [];

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);

        const bzlProto = loadBzlProtos(cfg.grpcServer.protofile);

        const applicationServiceClient = createApplicationServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(applicationServiceClient);

        const server = new BzlServerClient(cfg.grpcServer, applicationServiceClient);
        this.disposables.push(server);
    
        await server.start();

        this.setupAfterReady(cfg, bzlProto);
    }

    setupAfterReady(cfg: BzlConfiguration, bzlProto: BzlProtoGrpcType) {

        const licenseProto = loadLicenseProtos(cfg.license.protofile);

        const licenseClient = createLicensesClient(licenseProto, cfg.license.address);
        this.closeables.push(licenseClient);

        const licenseView = new BzlLicenseView(cfg.license, licenseClient);
        this.disposables.push(licenseView);

        const externalWorkspaceServiceClient = createExternalWorkspaceServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(externalWorkspaceServiceClient);

        const workspaceServiceClient = createWorkspaceServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(workspaceServiceClient);

        const packageServiceClient = createPackageServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(packageServiceClient);

        const repositoryListView = new BzlRepositoryListView(cfg.httpServer, workspaceServiceClient);
        this.disposables.push(repositoryListView);

        const workspaceListView = new BzlWorkspaceListView(
            cfg.httpServer,
            externalWorkspaceServiceClient,
            repositoryListView.onDidChangeCurrentRepository,
        );
        this.disposables.push(workspaceListView);

        const packageListView = new BzlPackageListView(
            cfg.httpServer,
            packageServiceClient,
            repositoryListView.onDidChangeCurrentRepository,
            workspaceListView.onDidChangeCurrentExternalWorkspace,
        );
        this.disposables.push(packageListView);
    }

    public deactivate() {
        this.dispose();
    }

    public dispose() {
        for (const closeable of this.closeables) {
            closeable.close();
        }
        this.closeables.length = 0;
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}
