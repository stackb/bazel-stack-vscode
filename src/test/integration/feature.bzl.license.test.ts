'use strict';

import * as grpc from '@grpc/grpc-js';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { createLicensesClient, loadLicenseProtos } from '../../bzl/configuration';
import { contextValues } from '../../bzl/constants';
import { BzlFeatureName } from '../../bzl/feature';
import { BzlLicenseView, LicenseItem } from '../../bzl/view/license';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { LicenseStatusRequest } from '../../proto/build/stack/license/v1beta1/LicenseStatusRequest';
import { LicenseStatusResponse } from '../../proto/build/stack/license/v1beta1/LicenseStatusResponse';
import { ProtoGrpcType } from '../../proto/license';
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import getPort = require('get-port');

const fakeToken = 'abc123';
const keepTmpDownloadDir = true;
let proto: ProtoGrpcType;

tmp.setGracefulCleanup();

describe(BzlFeatureName + '-License', function () {
	this.timeout(60 * 1000); // for download

	before(async () => {

		const properties: any = require('../../../package').contributes.configuration.properties;
		const protofile = path.join(__dirname, '..', '..', '..', 'proto', 'license.proto');

		proto = loadLicenseProtos(protofile);
	});

	after(async () => {
	});

	describe('License', () => {
		type licenseTest = {
			d: string, // test description
			status: grpc.status,
			license: License, // mock object to be returned gRPC server
			check: (provider: vscode.TreeDataProvider<LicenseItem>) => Promise<void>, // a function to make assertions about what the tree looks like
		};

		const cases: licenseTest[] = [
			{
				d: 'gRPC error sets context status',
				license: {},
				status: grpc.status.UNAVAILABLE,
				check: async (provider: vscode.TreeDataProvider<LicenseItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.lengthOf(0);
					const contextKey = 'bazel-stack-vscode:bzl-license:status';
					const value = contextValues.get(contextKey);
					expect(value).to.eq('UNAVAILABLE');
				},
			},
			{
				d: 'renders expected license items',
				status: grpc.status.OK,		
				license: {
					name: 'my_name',
					email: 'a@b.c',
					expiresAt: {
						seconds: new Date().getSeconds(),
					},
					subscriptionName: 'sub_name',
				},
				check: async (provider: vscode.TreeDataProvider<LicenseItem>): Promise<void> => {
					const items = await provider.getChildren(undefined);
					expect(items).to.have.length(4);
					const nameItem = items![0];
					const emailItem = items![1];
					const subItem = items![2];
					const expItem = items![3];

					expect(nameItem.label).to.eq('Name');
					expect(emailItem.label).to.eq('Email');
					expect(subItem.label).to.eq('Subscription');
					expect(expItem.label).to.eq('Exp');

					expect(nameItem.description).to.eq('my_name');
					expect(emailItem.description).to.eq('a@b.c');
					expect(subItem.description).to.eq('sub_name');
					expect(expItem.description).to.eq('1969-12-31');
				},
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const address = `localhost:${await getPort()}`;
				const server = await createLicensesServiceServer(address, tc.status, tc.license);
				server.start();
				const licenseClient: LicensesClient =  createLicensesClient(proto, address);
				const provider = new BzlLicenseView(fakeToken, licenseClient);
				await tc.check(provider);
				server.forceShutdown();
				provider.dispose();
			});
		});
	});
});

function createLicensesServiceServer(address: string, status: grpc.status, license: License): Promise<grpc.Server> {
	return new Promise<grpc.Server>((resolve, reject) => {
		const server = new grpc.Server();
		server.addService(proto.build.stack.license.v1beta1.Licenses.service, {
			// @ts-ignore
			status: (req: LicenseStatusRequest, callback: (err: grpc.ServiceError | null, resp?: LicenseStatusResponse) => void) => {
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
