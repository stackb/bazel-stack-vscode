'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import * as grpc from '@grpc/grpc-js';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { LanguageClient } from 'vscode-languageclient';
import { BzlServerClient } from '../../bzl/client';
import { createWorkspaceServiceClient, loadBzlProtos, platformBinaryName } from '../../bzl/configuration';
import { BzlFeatureName } from '../../bzl/feature';
import { BzlRepositoryListView, RepositoryItem } from '../../bzl/view/repositories';
import { GitHubReleaseAssetDownloader } from '../../download';
import { ListWorkspacesRequest } from '../../proto/build/stack/bezel/v1beta1/ListWorkspacesRequest';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { WorkspaceServiceClient } from '../../proto/build/stack/bezel/v1beta1/WorkspaceService';
import fs = require('fs');
import os = require('os');
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import getPort = require('get-port');

const keepTmpDownloadDir = true;

tmp.setGracefulCleanup();

describe(BzlFeatureName, function () {
	this.timeout(60 * 1000); // for download

	let downloadDir: string;
	let client: LanguageClient;

	before(async () => {
		const properties: any = packageJson.contributes.configuration.properties;
		const owner = properties["feature.bzl.server.github-owner"].default as string;
		const repo = properties["feature.bzl.server.github-repo"].default as string;
		const release = properties["feature.bzl.server.github-release"].default as string;
		const command = properties["feature.bzl.server.command"].default as string[];

		downloadDir = path.join(os.tmpdir(), BzlFeatureName, owner, repo);

		const downloader = new GitHubReleaseAssetDownloader({
			owner: owner,
			repo: repo,
			releaseTag: release,
			name: platformBinaryName("bzl"),
		}, downloadDir, true);

		const executable = downloader.getFilepath();
		if (!fs.existsSync(executable)) {
			await downloader.download();
		}

		client = new BzlServerClient(executable, command.concat(["--base_dir", downloadDir])).getLanguageClientForTesting();
		client.start();
		await client.onReady();
	});

	after(async () => {
		if (client) {
			await client.stop();
		}
		if (!keepTmpDownloadDir) {
			fs.rmdirSync(downloadDir, {
				recursive: true,
			});
		}
	});

	it.only('InitializeResult', () => {
		let expected = {
			capabilities: {
			}
		};
		// This demonstrates that we can download, install, launch bzl and get an
		// LSP initialization result.
		expect(client.initializeResult).eql(expected);
	});

	describe("Repositories", () => {
		type repositoryTest = {
			d: string, // test description
			input: Workspace[], // mock Workspaces object to be returned by mock WorkspaceClient
			check: (provider: vscode.TreeDataProvider<RepositoryItem>) => void, // a function to make assertions about what the tree looks like
		};

		const proto = loadBzlProtos(bzlProtoPath);
		const fakeHttpServerAddress = `locahost:2900`;
		
		const cases: repositoryTest[] = [
			{
				d: "tree should be empty when no repos are reported",
				input: [],
				check: ( provider: vscode.TreeDataProvider<RepositoryItem>) => {
					const items = provider.getChildren(undefined);
					expect(items).to.have.length(0);
				},
			}
		];

		// rpc List(ListWorkspacesRequest) returns (ListWorkspacesResponse) {}

		cases.forEach((tc) => {
			it(tc.d, async () => {
				const address = `locahost:${await getPort()}`;

				const server = new grpc.Server();
				server.addService(proto.build.stack.bezel.v1beta1.WorkspaceService.service, {
					list: (req: ListWorkspacesRequest, callback: any) => {
						callback(null, tc.input);
					},
				});
				
				server.bind(address, grpc.ServerCredentials.createInsecure());
				server.start();
		
				const workspaceServiceClient: WorkspaceServiceClient = createWorkspaceServiceClient(proto, address);
				const provider = new BzlRepositoryListView(fakeHttpServerAddress, workspaceServiceClient);
				tc.check(provider);
			});
		});
	});
	
});
