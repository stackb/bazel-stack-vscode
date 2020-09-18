import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { IExtensionFeature } from '../common';
import { ApplicationServiceClient } from '../proto/build/stack/bezel/v1beta1/ApplicationService';
import { Metadata } from '../proto/build/stack/bezel/v1beta1/Metadata';
import { BzlServerClient } from './client';
import {
    BzlConfiguration,
    createApplicationServiceClient,
    createAuthServiceClient,
    createBzlConfiguration,
    createExternalWorkspaceServiceClient,
    createLicensesClient,
    createPackageServiceClient,
    createPlansClient,
    createSubscriptionsClient,
    createWorkspaceServiceClient,
    loadAuthProtos,
    loadBzlProtos,
    loadLicenseProtos,
    loadNucleateProtos
} from './configuration';
import { EmptyView } from './view/emptyview';
import { BzlHelp } from './view/help';
import { BzlLicenseView } from './view/license';
import { BzlPackageListView } from './view/packages';
import { BzlRepositoryListView } from './view/repositories';
import { BzlServerView } from './view/server';
import { BzlSignup } from './view/signup';
import { BzlWorkspaceListView } from './view/workspaces';

export const BzlFeatureName = 'feature.bzl';

interface Closeable {
    close(): void;
}

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private closeables: Closeable[] = [];

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx.asAbsolutePath.bind(ctx), ctx.globalStoragePath, config);

        this.setupLicenseView(ctx, cfg);

        const token = config.get<string>('license.token');
        if (token) {
            await this.setupServer(ctx, cfg, token);
        } else {
            new EmptyView('bzl-repositories', this.disposables);
            new EmptyView('bzl-workspaces', this.disposables);
            new EmptyView('bzl-packages', this.disposables);
        }
    }

    async setupServer(ctx: vscode.ExtensionContext, cfg: BzlConfiguration, token: string) {
        const bzlProto = loadBzlProtos(cfg.grpcServer.protofile);

        const applicationServiceClient = createApplicationServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(applicationServiceClient);

        const command = cfg.grpcServer.command.concat(['--license_token', token]);
        const server = new BzlServerClient(cfg.grpcServer.executable, command);
        this.disposables.push(server);

        server.start();
        await server.onReady();

        const metadata = await this.fetchMetadata(applicationServiceClient);
        console.debug(`Connected to bzl ${metadata.version}`);

        const externalWorkspaceServiceClient = createExternalWorkspaceServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(externalWorkspaceServiceClient);

        const workspaceServiceClient = createWorkspaceServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(workspaceServiceClient);

        const packageServiceClient = createPackageServiceClient(bzlProto, cfg.grpcServer.address);
        this.closeables.push(packageServiceClient);

        const repositoryListView = new BzlRepositoryListView(
            cfg.httpServer.address,
            workspaceServiceClient,
        );
        this.disposables.push(repositoryListView);

        const workspaceListView = new BzlWorkspaceListView(
            cfg.httpServer.address,
            externalWorkspaceServiceClient,
            repositoryListView.onDidChangeCurrentRepository,
        );
        this.disposables.push(workspaceListView);

        this.disposables.push(new BzlPackageListView(
            cfg.grpcServer.executable,
            cfg.httpServer.address,
            packageServiceClient,
            repositoryListView.onDidChangeCurrentRepository,
            workspaceListView.onDidChangeCurrentExternalWorkspace,
        ));

        this.disposables.push(new BzlServerView(
            cfg.grpcServer,
            cfg.httpServer,
            applicationServiceClient,
        ));

        new BzlHelp('repositories', ctx.asAbsolutePath, this.disposables);
        new BzlHelp('workspaces', ctx.asAbsolutePath, this.disposables);
        new BzlHelp('packages', ctx.asAbsolutePath, this.disposables);
    }

    setupLicenseView(ctx: vscode.ExtensionContext, cfg: BzlConfiguration) {

        const licenseProto = loadLicenseProtos(cfg.license.protofile);
        const authProto = loadAuthProtos(cfg.auth.protofile);
        const nucleateProto = loadNucleateProtos(cfg.nucleate.protofile);

        const authClient = createAuthServiceClient(authProto, cfg.auth.address);
        this.closeables.push(authClient);

        const licenseClient = createLicensesClient(licenseProto, cfg.license.address);
        this.closeables.push(licenseClient);

        const subscriptionsClient = createSubscriptionsClient(nucleateProto, cfg.nucleate.address);
        this.closeables.push(subscriptionsClient);

        const plansClient = createPlansClient(nucleateProto, cfg.nucleate.address);
        this.closeables.push(licenseClient);

        this.disposables.push(new BzlSignup(ctx.extensionPath, cfg.license, authClient, licenseClient, plansClient, subscriptionsClient));
        this.disposables.push(new BzlLicenseView(cfg.license.token, licenseClient));
    }

    public deactivate() {
        this.dispose();

        // Even when deactivated/disposed we need to provide view implementations
        // declared in the package.json to avoid the 'no tree view with id ...' error.
        new EmptyView('bzl-repositories', this.disposables);
        new EmptyView('bzl-workspaces', this.disposables);
        new EmptyView('bzl-packages', this.disposables);
        new EmptyView('bzl-license', this.disposables);
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

    private async fetchMetadata(client: ApplicationServiceClient): Promise<Metadata> {
        return new Promise<Metadata>((resolve, reject) => {
            const deadline = new Date();
            deadline.setSeconds(deadline.getSeconds() + 30);
            client.GetMetadata({}, new grpc.Metadata({ waitForReady: true }), { deadline: deadline }, (err?: grpc.ServiceError, resp?: Metadata) => {
                if (err) {
                    reject(`could not rpc application metadata: ${err}`);
                    return;
                }
                resolve(resp);
            });
        });
    }
}
