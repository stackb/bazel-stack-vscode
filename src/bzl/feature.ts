import path = require('path');
import fs = require('fs');
import findUp = require('find-up');
import * as vscode from 'vscode';
import { API } from '../api';
import { IExtensionFeature } from '../common';
import { BzlClient } from './client';
import { CodeSearch } from './codesearch/codesearch';
import { BzlServerCommandRunner } from './commandrunner';
import { BzlConfiguration, BzlServerConfiguration, createBzlConfiguration } from './configuration';
import { ConfigSection, Server, ViewName } from './constants';
import { Closeable } from './grpcclient';
import { createAuthServiceClient, createLicensesClient, createPlansClient, createSubscriptionsClient, loadAuthProtos, loadBzlProtos, loadCodesearchProtos, loadLicenseProtos, loadNucleateProtos } from './proto';
import { BzlLicenseRenewer } from './renewer';
import { BzlServer } from './server';
import { EmptyView } from './view/emptyview';
import { BuildEventProtocolView } from './view/events';
import { BzlCommandHistoryView } from './view/history';
import { BzlAccountView } from './view/license';
import { BzlPackageListView } from './view/packages';
import { BzlRepositoryListView } from './view/repositories';
import { BzlServerView } from './view/server';
import { BzlSignup } from './view/signup';
import { BzlWorkspaceListView } from './view/workspaces';

export const BzlFeatureName = 'bsv.bzl';

export class BzlFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BzlFeatureName;

    private disposables: vscode.Disposable[] = [];
    private closeables: Closeable[] = [];
    private client: BzlClient | undefined;
    private server: BzlServer | undefined;
    private onDidBzlClientChange = new vscode.EventEmitter<BzlClient>();
    private onDidServerDoNotRestart = new vscode.EventEmitter<string>();
    private onDidBzlLicenseExpire = new vscode.EventEmitter<void>();
    private onDidBzlLicenseTokenChange = new vscode.EventEmitter<string>();

    constructor(private api: API) {
        this.add(this.onDidBzlClientChange);
        this.add(this.onDidServerDoNotRestart);
        this.add(this.onDidBzlLicenseExpire);
        this.add(this.onDidBzlLicenseTokenChange);
    }

    /**
     * @override
     */
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);

        await this.setupBazelActivityPanel(ctx, cfg);
    }

    async setupBazelActivityPanel(ctx: vscode.ExtensionContext, cfg: BzlConfiguration) {
        const workspaceRoot = findWorkspaceRoot();
    }

    /**
     * @override
     */
    async activate2(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = await createBzlConfiguration(ctx, config);
        this.setupStackBuildActivity(ctx, cfg);

        const token = config.get<string>(ConfigSection.LicenseToken);
        if (!token) {
            new EmptyView(ViewName.Repository, this.disposables);
            new EmptyView(ViewName.Workspace, this.disposables);
            new EmptyView(ViewName.Package, this.disposables);
            new EmptyView(ViewName.History, this.disposables);
            new EmptyView(ViewName.BEP, this.disposables);
            return;
        }

        this.onDidBzlLicenseTokenChange.event(async (newToken) => {
            // This only occurs when the license is renewed.  The update will
            // trigger re-activation of the feature
            if (token !== newToken) {
                await config.update(ConfigSection.LicenseToken, newToken, vscode.ConfigurationTarget.Global);
            }
        });

        cfg.server.command.push(Server.LicenseTokenFlag);
        cfg.server.command.push(token);

        return this.setupBazelActivity(ctx, cfg);
    }

    async setupBazelActivity(ctx: vscode.ExtensionContext, cfg: BzlConfiguration) {
        const onDidRequestRestart = new vscode.EventEmitter<void>();
        this.add(onDidRequestRestart.event(() => {
            this.restartServer(cfg.server, 0);
        }));

        const bzlProto = loadBzlProtos(cfg.server.protofile);
        const codesearchProto = loadCodesearchProtos(cfg.codesearch.codesearchProtofile);
        this.client = this.add(new BzlClient(cfg.server.executable, bzlProto, codesearchProto, cfg.server.address, onDidRequestRestart));

        const commandRunner = this.add(new BzlServerCommandRunner(
            cfg.commandTask,
            this.onDidBzlClientChange.event,
        ));

        this.add(new BuildEventProtocolView(
            this.api,
            this.onDidBzlClientChange.event,
            commandRunner.onDidReceiveBazelBuildEvent.event,
        ));

        const repositoryListView = this.add(new BzlRepositoryListView(
            this.onDidBzlClientChange.event,
        ));

        this.add(new BzlCommandHistoryView(
            this.onDidBzlClientChange.event,
            repositoryListView.onDidChangeCurrentRepository.event,
            commandRunner.onDidRunCommand.event,
            commandRunner,
            this.api,
        ));

        const workspaceListView = this.add(new BzlWorkspaceListView(
            this.onDidBzlClientChange.event,
            repositoryListView.onDidChangeCurrentRepository.event,
        ));

        this.add(new BzlPackageListView(
            commandRunner,
            this.onDidBzlClientChange.event,
            repositoryListView.onDidChangeCurrentRepository.event,
            workspaceListView.onDidChangeCurrentExternalWorkspace.event,
        ));

        this.add(new BzlServerView(
            bzlProto,
            codesearchProto,
            cfg.server.remotes,
            this.onDidBzlClientChange,
        ));

        this.add(new CodeSearch(
            this.api,
            cfg.codesearch,
            repositoryListView.onDidChangeCurrentRepository.event,
            this.onDidBzlClientChange.event,
        ));

        this.add(this.onDidServerDoNotRestart.event(msg => {
            // Expect this string if the server dies three times and is not
            // restarted.
            if (msg.indexOf('Please obtain a new license') !== -1) {
                this.onDidBzlLicenseExpire.fire();
            }
        }));

        return this.tryConnectServer(cfg.server, 0);
    }

    async tryConnectServer(cfg: BzlServerConfiguration, attempts: number): Promise<void> {
        if (attempts > 3) {
            return Promise.reject(`could not connect to bzl: too many failed attempts to ${cfg.address}.  Server will not be restarted.`);
        }
        try {
            const metadata = await this.client!.waitForReady();
            this.onDidBzlClientChange.fire(this.client!);
            console.debug(`Connected to bzl ${metadata.version} at ${cfg.address}`);
        } catch (e) {
            console.log('bzl server connect error', e);
            return this.restartServer(cfg, ++attempts);
        }
    }

    async restartServer(cfg: BzlServerConfiguration, attempts: number): Promise<void> {
        if (this.server) {
            this.server.dispose();
            this.server = undefined;
        }

        const server = this.server = this.add(
            new BzlServer(
                this.onDidServerDoNotRestart, cfg.executable, cfg.command));

        server.start();
        await server.onReady();

        console.debug(`Started bzl (${cfg.executable})`);

        return this.tryConnectServer(cfg, attempts);
    }

    setupStackBuildActivity(ctx: vscode.ExtensionContext, cfg: BzlConfiguration) {

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
        this.disposables.push(new BzlAccountView(this.onDidBzlLicenseTokenChange, licenseClient));
        this.disposables.push(new BzlLicenseRenewer(this.onDidBzlLicenseExpire, this.onDidBzlLicenseTokenChange, licenseClient));

        this.onDidBzlLicenseTokenChange.fire(cfg.license.token);
    }

    public deactivate() {
        this.dispose();

        // Even when deactivated/disposed we need to provide view implementations
        // declared in the package.json to avoid the 'no tree view with id ...' error.
        new EmptyView(ViewName.Repository, this.disposables);
        new EmptyView(ViewName.Workspace, this.disposables);
        new EmptyView(ViewName.Package, this.disposables);
        new EmptyView(ViewName.BEP, this.disposables);
        new EmptyView(ViewName.History, this.disposables);
        new EmptyView(ViewName.Account, this.disposables);
        new EmptyView(ViewName.Server, this.disposables);
    }

    protected add<T extends vscode.Disposable>(disposable: T): T {
        this.disposables.push(disposable);
        return disposable;
    }

    /**
     * @override
     */
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

async function findWorkspaceRoot(): Promise<string | undefined> {
    return findUp('WORKSPACE');
}