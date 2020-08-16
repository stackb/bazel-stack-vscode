'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import * as grpc from '@grpc/grpc-js';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { BzlServerClient } from '../../bzl/client';
import { BzlGrpcServerConfiguration, BzlHttpServerConfiguration, createWorkspaceServiceClient, loadBzlProtos, setServerAddresses, setServerExecutable } from '../../bzl/configuration';
import { contextValues } from '../../bzl/constants';
import { BzlFeatureName } from '../../bzl/feature';
import { BzlRepositoryListView, RepositoryItem } from '../../bzl/view/repositories';
import { ListWorkspacesRequest } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesRequest';
import { ListWorkspacesResponse } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesResponse';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { WorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/WorkspaceService';
import { ProtoGrpcType } from '../../proto/bzl';
import fs = require('fs');
import os = require('os');
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import getPort = require('get-port');

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

	// it('InitializeResult', () => {
	// 	let expected = {
	// 		capabilities: {}
	// 	};
	// 	// This demonstrates that we can download, install, launch bzl and get an
	// 	// LSP initialization result.
	// 	expect(client.getLanguageClientForTesting().initializeResult).eql(expected);
	// });

	describe('Repositories', () => {
		type repositoryTest = {
			d: string, // test description
			status: grpc.status,
			resp?: Workspace[], // mock Workspaces object to be returned by mock WorkspaceClient
			check: (provider: vscode.TreeDataProvider<RepositoryItem>) => Promise<void>, // a function to make assertions about what the tree looks like
		};

		const fakeHttpServerAddress = 'locahost:2900';

		const cases: repositoryTest[] = [
			{
				d: 'Unavailable -> sets context value',
				resp: [],
				status: grpc.status.UNAVAILABLE,
				check: async (provider: vscode.TreeDataProvider<RepositoryItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
					const contextKey = 'bazel-stack-vscode:bzl-repositories:/build.stack.bezel.v1beta1.WorkspaceService/List:status';
					const value = contextValues.get(contextKey);
					expect(value).to.eq('UNAVAILABLE');
				},
			},
			{
				d: 'OK empty -> tree should be empty',
				resp: [],
				status: grpc.status.OK,
				check: async (provider: vscode.TreeDataProvider<RepositoryItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.be.undefined;
				},
			},
			{
				d: 'OK single result -> single node',
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
			}
		];

		cases.forEach(tc => {
			it.only(tc.d, async () => {
				const address = `localhost:${await getPort()}`;
				const server = await createWorkspaceServiceServer(address, tc.status, tc.resp);
				server.start();
				const workspaceServiceClient: WorkspaceServiceClient = createWorkspaceServiceClient(proto, address);
				const provider = new BzlRepositoryListView(fakeHttpServerAddress, workspaceServiceClient, {
					skipCommandRegistration: true,
				});
				await tc.check(provider);
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