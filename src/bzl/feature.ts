import * as vscode from 'vscode';
import { IExtensionFeature } from '../common';
import { BuildEventProtocolDiagnostics } from './bepdiagnostics';
import { BzlClient, Closeable } from './bzlclient';
import { BzlServerProcess } from './client';
import { BzlServerCommandRunner } from './commandrunner';
import {
    BzlConfiguration,

    createAuthServiceClient,
    createBzlConfiguration,



    createLicensesClient,

    createPlansClient,
    createSubscriptionsClient,

    loadAuthProtos,
    loadBzlProtos,
    loadLicenseProtos,
    loadNucleateProtos
} from './configuration';
import { EmptyView } from './view/emptyview';
import { BuildEventProtocolView } from './view/events';
import { BzlHelp } from './view/help';
import { BzlCommandHistoryView } from './view/history';
import { BzlLicenseView } from './view/license';
import { BzlPackageListView } from './view/packages';
import { BzlRepositoryListView } from './view/repositories';
import { BzlServerView } from './view/server';
import { BzlSignup } from './view/signup';
import { BzlWorkspaceListView } from './view/workspaces';

export const BzlFeatureName = 'feature.bzl';

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

        const command = cfg.server.command.concat(['--license_token', token]);
        const server = this.add(new BzlServerProcess(cfg.server.executable, command));
        server.start();
        await server.onReady();

        const bzlProto = loadBzlProtos(cfg.server.protofile);
        const bzlClient = this.add(new BzlClient(bzlProto, cfg.server.address));
        const onDidBzlClientChange = this.add(new vscode.EventEmitter<BzlClient>());

        const commandRunner = this.add(new BzlServerCommandRunner(
            cfg.commandTask, 
            onDidBzlClientChange.event,
        ));

        this.add(new BuildEventProtocolDiagnostics(
            cfg.commandTask.problemMatcherRegistry,
            commandRunner.onDidRunCommand.event,
            commandRunner.onDidReceiveBazelBuildEvent.event,
        ));

        this.add(new BuildEventProtocolView(
            onDidBzlClientChange.event,
            commandRunner.onDidReceiveBazelBuildEvent.event,
        ));

        const repositoryListView = this.add(new BzlRepositoryListView(
            onDidBzlClientChange.event,
        ));

        this.add(new BzlCommandHistoryView(
            onDidBzlClientChange.event,
            repositoryListView.onDidChangeCurrentRepository,
            commandRunner.onDidRunCommand,
            commandRunner,
        ));

        const workspaceListView = this.add(new BzlWorkspaceListView(
            onDidBzlClientChange.event,
            repositoryListView.onDidChangeCurrentRepository,
        ));

        this.add(new BzlPackageListView(
            onDidBzlClientChange.event,
            commandRunner,
            repositoryListView.onDidChangeCurrentRepository,
            workspaceListView.onDidChangeCurrentExternalWorkspace,
        ));

        this.add(new BzlServerView(
            bzlProto,
            onDidBzlClientChange,
        ));
        
        new BzlHelp('repositories', ctx.asAbsolutePath, this.disposables);
        new BzlHelp('workspaces', ctx.asAbsolutePath, this.disposables);
        new BzlHelp('packages', ctx.asAbsolutePath, this.disposables);

        const metadata = await bzlClient.getMetadata();
        console.debug(`Connected to bzl ${metadata.version}`);
        onDidBzlClientChange.fire(bzlClient);
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

    protected add<T extends vscode.Disposable>(disposable: T): T {
        this.disposables.push(disposable);
        return disposable;
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
