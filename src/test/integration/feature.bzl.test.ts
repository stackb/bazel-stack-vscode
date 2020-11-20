'use strict';

// Adapted from
// https://github.com/microsoft/vscode-languageserver-node/blob/master/client-node-tests/src/integration.test.ts

import * as grpc from '@grpc/grpc-js';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import * as vscode from 'vscode';
import { BzlServer } from '../../bzl/client';
import { BzlServerConfiguration, loadBzlProtos, loadLicenseProtos, setServerAddresses, setServerExecutable } from '../../bzl/configuration';
import { BzlFeatureName } from '../../bzl/feature';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { ProtoGrpcType } from '../../proto/bzl';
import { ProtoGrpcType as LicenseProtoGrpcType } from '../../proto/license';

import fs = require('graceful-fs');
import os = require('os');
import tmp = require('tmp');
import path = require('path');

const keepTmpDownloadDir = true;

export const licenseProtos: LicenseProtoGrpcType = makeLicenseProtos();

tmp.setGracefulCleanup();

describe(BzlFeatureName, function () {
	this.timeout(120 * 1000);

	let downloadDir: string;
	let server: BzlServer;
	let serverConfig: BzlServerConfiguration;
	let proto: ProtoGrpcType;

	before(async () => {
		const properties: any = require('../../../package').contributes.configuration.properties;
		downloadDir = path.join(os.tmpdir(), BzlFeatureName);

		serverConfig = {
			protofile: path.join(__dirname, '..', '..', '..', 'proto', 'bzl.proto'),
			address: '',
			executable: '',
			owner: properties['bsv.bzl.server.github-owner'].default as string,
			repo: properties['bsv.bzl.server.github-repo'].default as string,
			releaseTag: properties['bsv.bzl.server.github-release'].default as string,
			command: properties['bsv.bzl.server.command'].default as string[],
			remotes: [],
		};

		await setServerExecutable(serverConfig, downloadDir);
		await setServerAddresses(serverConfig);

		proto = loadBzlProtos(serverConfig.protofile);
		const onDidServerDoNotRestart = new vscode.EventEmitter<string>();
		server = new BzlServer(
			onDidServerDoNotRestart,
			serverConfig.executable,
			serverConfig.command.concat(['--base_dir', downloadDir]));
		server.start();
		await server.onReady();
	});

	after(async () => {
		if (server) {
			server.dispose();
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
			expect(server.getLanguageClientForTesting().initializeResult).eql(expected);
		});
	});

	describe('Configuration', () => {
		it('setServerAddresses', async () => {
			const grpcConfig = {
				protofile: path.join(__dirname, '..', '..', '..', 'proto', 'bzl.proto'),
				address: 'localhost:9090',
				executable: '',
				owner: '',
				repo: '',
				releaseTag: '',
				command: ['serve'],
				remotes: [],
			};

			await setServerAddresses(grpcConfig);

			expect(grpcConfig.command).eql([
				'serve',
				'--address=localhost:9090',
			]);
		});
	});

});

export function createLicensesServiceServer(address: string, status: grpc.status, license?: License): Promise<grpc.Server> {
	return new Promise<grpc.Server>((resolve, reject) => {
		const server = new grpc.Server();
		server.addService(licenseProtos.build.stack.license.v1beta1.Licenses.service, {
			// @ts-ignore
			renew: (req: RenewLicenseRequest, callback: (err: grpc.ServiceError | null, resp?: RenewLicenseResponse) => void) => {
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
					license: license,
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

export function makeLicenseProtos(): LicenseProtoGrpcType {
	const protofile = path.join(__dirname, '..', '..', '..', 'proto', 'license.proto');
	return loadLicenseProtos(protofile);
}
