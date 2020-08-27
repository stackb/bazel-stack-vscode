'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import * as grpc from '@grpc/grpc-js';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { BzlServerClient } from '../../bzl/client';
import { BzlGrpcServerConfiguration, BzlHttpServerConfiguration, createExternalWorkspaceServiceClient, createPackageServiceClient, createWorkspaceServiceClient, loadBzlProtos, setServerAddresses, setServerExecutable } from '../../bzl/configuration';
import { contextValues } from '../../bzl/constants';
import { BzlFeatureName } from '../../bzl/feature';
import { BzlPackageListView, Node } from '../../bzl/view/packages';
import { BzlRepositoryListView, RepositoryItem } from '../../bzl/view/repositories';
import { BzlWorkspaceListView, WorkspaceItem } from '../../bzl/view/workspaces';
import { ExternalListWorkspacesRequest } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesRequest';
import { ExternalListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ExternalListWorkspacesResponse';
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { ExternalWorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspaceService';
import { LabelKind, _build_stack_bezel_v1beta1_LabelKind_Type } from '../../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListPackagesRequest } from '../../proto/build/stack/bezel/v1beta1/ListPackagesRequest';
import { ListPackagesResponse } from '../../proto/build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesRequest } from '../../proto/build/stack/bezel/v1beta1/ListRulesRequest';
import { ListRulesResponse } from '../../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { ListWorkspacesRequest } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesRequest';
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Package } from '../../proto/build/stack/bezel/v1beta1/Package';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { ProtoGrpcType } from '../../proto/bzl';
import fs = require('fs');
import os = require('os');
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import getPort = require('get-port');

const fakeHttpServerAddress = 'locahost:2900';
const keepTmpDownloadDir = true;
let proto: ProtoGrpcType;

tmp.setGracefulCleanup();

describe(BzlFeatureName, function () {
	this.timeout(60 * 1000); // for download

	let downloadDir: string;
	let client: BzlServerClient;
	let grpcServerConfig: BzlGrpcServerConfiguration;
	let httpServerConfig: BzlHttpServerConfiguration;

	before(async () => {

		const properties: any = require('../../../package').contributes.configuration.properties;
		downloadDir = path.join(os.tmpdir(), BzlFeatureName);

		grpcServerConfig = {
			protofile: path.join(__dirname, '..', '..', '..', 'proto', 'bzl.proto'),
			address: '',
			executable: '',
			owner: properties['feature.bzl.server.github-owner'].default as string,
			repo: properties['feature.bzl.server.github-repo'].default as string,
			releaseTag: properties['feature.bzl.server.github-release'].default as string,
			command: properties['feature.bzl.server.command'].default as string[],
		};

		httpServerConfig = {
			address: '',
		};

		await setServerExecutable(grpcServerConfig, downloadDir);
		await setServerAddresses(grpcServerConfig, httpServerConfig);

		proto = loadBzlProtos(grpcServerConfig.protofile);

		client = new BzlServerClient(
			grpcServerConfig.executable,
			grpcServerConfig.command.concat(['--base_dir', downloadDir]));
		client.start();
		await client.onReady();
	});

	after(async () => {
		if (client) {
			client.dispose();
		}
		if (!keepTmpDownloadDir) {
			fs.rmdirSync(downloadDir, {
				recursive: true,
			});
		}
	});

	describe('LSP', () => {
		it('InitializeResult', () => {
			let expected = {
				capabilities: {}
			};
			// This demonstrates that we can download, install, launch bzl and get an
			// LSP initialization result.
			expect(client.getLanguageClientForTesting().initializeResult).eql(expected);
		});
	});

	describe('Repositories', () => {
		type repositoryTest = {
			d: string, // test description
			status: grpc.status,
			resp?: Workspace[], // mock Workspaces object to be returned by mock WorkspaceClient
			check: (provider: vscode.TreeDataProvider<RepositoryItem>) => Promise<void>, // a function to make assertions about what the tree looks like
		};

		const cases: repositoryTest[] = [
			{
				d: 'gRPC error sets context status',
				resp: [],
				status: grpc.status.UNAVAILABLE,
				check: async (provider: vscode.TreeDataProvider<RepositoryItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
					const contextKey = 'bazel-stack-vscode:bzl-repositories:status';
					const value = contextValues.get(contextKey);
					expect(value).to.eq('UNAVAILABLE');
				},
			},
			{
				d: 'tree should be empty when no results',
				resp: [],
				status: grpc.status.OK,
				check: async (provider: vscode.TreeDataProvider<RepositoryItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
				},
			},
			{
				d: 'tree should contain a RepositoryItem for a result',
				status: grpc.status.OK,
				resp: [{
					cwd: '/path/to/cwd',
					outputBase: '/path/to/ob',
					name: 'some_name',
				}],
				check: async (provider: vscode.TreeDataProvider<RepositoryItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.length(1);
					expect(items![0].collapsibleState).to.eq(vscode.TreeItemCollapsibleState.None);
					expect(items![0].contextValue).to.eq('repository');
					expect(items![0].label).to.eq('@some_name');
					expect(items![0].tooltip).to.eq('@some_name /path/to/cwd');
					expect(items![0].command).to.eql({
						command: 'vscode.openFolder',
						title: 'Open Bazel Repository Folder',
						arguments: [vscode.Uri.file('/path/to/cwd')],
					});
				},
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const address = `localhost:${await getPort()}`;
				const server = await createWorkspaceServiceServer(address, tc.status, tc.resp);
				server.start();
				const workspaceServiceClient: WorkspaceServiceClient =  createWorkspaceServiceClient(proto, address);
				const provider = new BzlRepositoryListView(fakeHttpServerAddress, workspaceServiceClient);
				await tc.check(provider);
				server.forceShutdown();
				provider.dispose();
			});
		});
	});


	describe('Workspaces', () => {
		type workspaceTest = {
			d: string, // test description
			status: grpc.status,
			workspace?: Workspace,
			resp?: ExternalWorkspace[],
			check: (provider: vscode.TreeDataProvider<WorkspaceItem>) => Promise<void>, // a function to make assertions about what the tree looks like
		};

		const cases: workspaceTest[] = [
			{
				d: 'gRPC error sets context status',
				workspace: {},
				resp: [],
				status: grpc.status.UNAVAILABLE,
				check: async (provider: vscode.TreeDataProvider<WorkspaceItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
					const contextKey = 'bazel-stack-vscode:bzl-workspaces:status';
					const value = contextValues.get(contextKey);
					expect(value).to.eq('UNAVAILABLE');
				},
			},
			{
				d: 'tree should be empty when no workspace is defined',
				status: grpc.status.OK,
				check: async (provider: vscode.TreeDataProvider<WorkspaceItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
				},
			},
			{
				d: 'tree should be empty when no results are returned (status OK)',
				workspace: {},
				resp: [],
				status: grpc.status.OK,
				check: async (provider: vscode.TreeDataProvider<WorkspaceItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
				},
			},
			{
				d: 'tree contains 2 items: default workspace and custom item for my_id',
				status: grpc.status.OK,
				workspace: {
					cwd: '/required/by/absolute/path/calculation',
				},
				resp: [{
					id: 'my_id',
					name: 'my_name',
					ruleClass: 'my_ruleClass',
					relativeLocation: 'my/relative/location',
				}],
				check: async (provider: vscode.TreeDataProvider<WorkspaceItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.length(2);

					// Default workspace item is always included
					expect(items![0].collapsibleState).to.eq(vscode.TreeItemCollapsibleState.None);
					expect(items![0].contextValue).to.eq('workspace');
					expect(items![0].label).to.eq('DEFAULT');
					expect(items![0].tooltip).to.eq('workspace');
					expect(items![0].command).to.eql({
						command: 'bzl-workspace.select',
						title: 'Select external workspace',
						arguments: ['DEFAULT'],
					});

					expect(items![1].collapsibleState).to.eq(vscode.TreeItemCollapsibleState.None);
					expect(items![1].contextValue).to.eq('workspace');
					expect(items![1].label).to.eq('@my_name');
					expect(items![1].tooltip).to.eq('my_ruleClass /required/by/absolute/path/calculation/my/relative/location');
					expect(items![1].command).to.eql({
						command: 'bzl-workspace.select',
						title: 'Select external workspace',
						arguments: ['@my_name'],
					});
				},
			}
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const address = `localhost:${await getPort()}`;
				const server = await createExternalWorkspaceServiceServer(address, tc.status, tc.resp);
				server.start();
				const externalWorkspaceClient: ExternalWorkspaceServiceClient = createExternalWorkspaceServiceClient(proto, address);
				const workspaceChanged = new vscode.EventEmitter<Workspace | undefined>();
				const provider = new BzlWorkspaceListView(fakeHttpServerAddress, externalWorkspaceClient, workspaceChanged);
				if (tc.workspace) {
					workspaceChanged.fire(tc.workspace);
				}
				await tc.check(provider);
				server.forceShutdown();
				provider.dispose();
			});
		});
	});


	describe('Packages', () => {
		type packageTest = {
			d: string, // test description
			status: grpc.status,
			workspace?: Workspace,
			external?: ExternalWorkspace,
			packages?: Package[],
			rules?: LabelKind[],
			rootCheck: (provider: vscode.TreeDataProvider<Node>) => Promise<Node | undefined>, 
			childCheck?: (provider: vscode.TreeDataProvider<Node>, child: Node) => Promise<void>, 
		};

		const cases: packageTest[] = [
			{
				d: 'gRPC error sets context status',
				workspace: {},
				packages: [],
				status: grpc.status.UNAVAILABLE,
				rootCheck: async (provider: vscode.TreeDataProvider<Node>): Promise<Node | undefined> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.lengthOf(0);
					const contextKey = 'bazel-stack-vscode:bzl-packages:status';
					const value = contextValues.get(contextKey);
					expect(value).to.eq('UNAVAILABLE');
					return undefined;
				},
			},
			{
				d: 'tree should be empty when no workspace is defined',
				status: grpc.status.OK,
				rootCheck: async (provider: vscode.TreeDataProvider<Node>): Promise<Node | undefined> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
					return undefined;
				},
			},
			{
				d: 'tree should be empty when no results are returned (status OK)',
				workspace: {},
				packages: [],
				status: grpc.status.OK,
				rootCheck: async (provider: vscode.TreeDataProvider<Node>): Promise<Node | undefined> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.lengthOf(0);
					return undefined;
				},
			},
			{
				d: 'tree renders nodes ',
				status: grpc.status.OK,
				workspace: {
					cwd: '/required/by/absolute/path/calculation',
				},
				packages: [{
					dir: '',
					name: ':',
				}],
				rules: [{
					label: '//:a',
					location: 'BUILD',
					type: _build_stack_bezel_v1beta1_LabelKind_Type.RULE,
					kind: 'genrule',
				}],
				rootCheck: async (provider: vscode.TreeDataProvider<Node>): Promise<Node | undefined> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.length(1);
					const item = items![0];

					expect(item.collapsibleState).to.eq(vscode.TreeItemCollapsibleState.Expanded);
					expect(item.contextValue).to.eq('package');
					expect(item.label).to.eq('');
					expect(item.tooltip).to.eq('ROOT build file');
					expect(item.command.command).to.eq('bzl-package.select');
					expect(item.command.title).to.eq('Select Target');

					return item;
				},
				childCheck: async (provider: vscode.TreeDataProvider<Node>, child: Node): Promise<void> => {
					let items = await provider.getChildren(child);
					expect(items).to.have.length(0);

					// simulate select package command
					await vscode.commands.executeCommand('bzl-package.select', child);
					
					// node should now have rules nodes attached
					items = await provider.getChildren(child);
					expect(items).to.have.length(1);

					const item = items![0];

					expect(item.collapsibleState).to.eq(vscode.TreeItemCollapsibleState.None);
					expect(item.contextValue).to.eq('rule');
					expect(item.label).to.eq(':a');
					expect(item.tooltip).to.eq('genrule //:a');
					expect(item.command.command).to.eq('bzl-package.select');
					expect(item.command.title).to.eq('Select Target');
				},
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const address = `localhost:${await getPort()}`;
				const server = await createPackageServiceServer(address, tc.status, tc.packages, tc.rules);
				server.start();
				const packageClient: PackageServiceClient = createPackageServiceClient(proto, address);
				const workspaceChanged = new vscode.EventEmitter<Workspace | undefined>();
				const externalWorkspaceChanged = new vscode.EventEmitter<ExternalWorkspace | undefined>();
				const provider = new BzlPackageListView(fakeHttpServerAddress, packageClient, workspaceChanged, externalWorkspaceChanged);
				if (tc.workspace) {
					workspaceChanged.fire(tc.workspace);
				}
				const child = await tc.rootCheck(provider);
				if (child && tc.childCheck) {
					await tc.childCheck(provider, child);
				}
				server.forceShutdown();
				provider.dispose();
			});
		});
	});
});

function createWorkspaceServiceServer(address: string, status: grpc.status, workspaces?: Workspace[]): Promise<grpc.Server> {
	return new Promise<grpc.Server>((resolve, reject) => {
		const server = new grpc.Server();
		server.addService(proto.build.stack.bezel.v1beta1.WorkspaceService.service, {
			list: (req: ListWorkspacesRequest, callback: (err: grpc.ServiceError | null, resp?: ListWorkspacesResponse) => void) => {
				if (status !== grpc.status.OK) {
					callback({
						code: status,
						details: 'no details',
						metadata: new grpc.Metadata(),
						name: 'no name',
						message: 'no message',
					});
					return;
				}
				callback(null, {
					workspace: workspaces,
				});
			},
		});
		server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (e, port) => {
			if (e) {
				reject(e);
				return;
			}
			resolve(server);
		});
	});
}

function createExternalWorkspaceServiceServer(address: string, status: grpc.status, externals?: ExternalWorkspace[]): Promise<grpc.Server> {
	return new Promise<grpc.Server>((resolve, reject) => {
		const server = new grpc.Server();
		server.addService(proto.build.stack.bezel.v1beta1.ExternalWorkspaceService.service, {
			// @ts-ignore: not sure why this is necessary here
			listExternal: (req: ExternalListWorkspacesRequest, callback: (err: grpc.ServiceError | null, resp?: ExternalListWorkspacesResponse) => void) => {
				if (status !== grpc.status.OK) {
					callback({
						code: status,
						details: 'no details',
						metadata: new grpc.Metadata(),
						name: 'no name',
						message: 'no message',
					});
					return;
				}
				callback(null, {
					workspace: externals,
				});
			},
		});
		server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (e, port) => {
			if (e) {
				reject(e);
				return;
			}
			resolve(server);
		});
	});
}


function createPackageServiceServer(address: string, status: grpc.status, packages?: Package[], rules?: LabelKind[]): Promise<grpc.Server> {
	return new Promise<grpc.Server>((resolve, reject) => {
		const server = new grpc.Server();
		server.addService(proto.build.stack.bezel.v1beta1.PackageService.service, {
			// @ts-ignore
			listPackages: (req: ListPackagesRequest, callback: (err: grpc.ServiceError | null, resp?: ListPackagesResponse) => void) => {
				if (status !== grpc.status.OK) {
					callback({
						code: status,
						details: 'no details',
						metadata: new grpc.Metadata(),
						name: 'no name',
						message: 'no message',
					});
					return;
				}
				callback(null, {
					package: packages,
				});
			},
			// @ts-ignore
			listRules: (req: ListRulesRequest, callback: (err: grpc.ServiceError | null, resp?: ListRulesResponse) => void) => {
				if (status !== grpc.status.OK) {
					callback({
						code: status,
						details: 'no details',
						metadata: new grpc.Metadata(),
						name: 'no name',
						message: 'no message',
					});
					return;
				}
				callback(null, {
					rule: rules,
				});
			},
		});
		server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (e, port) => {
			if (e) {
				reject(e);
				return;
			}
			resolve(server);
		});
	});
}