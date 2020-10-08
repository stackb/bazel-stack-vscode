'use strict';

import * as grpc from '@grpc/grpc-js';
import { fail } from 'assert';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import { createLicensesClient } from '../../bzl/configuration';
import { BzlFeatureName } from '../../bzl/feature';
import { GitHubOAuthFlow, UriEventHandler } from '../../bzl/view/signup/githubOAuthFlow';
import { RenewLicenseFlow } from '../../bzl/view/signup/renewLicenseFlow';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { createLicensesServiceServer, licenseProtos } from './feature.bzl.test';
import portfinder = require('portfinder');

describe(BzlFeatureName + '.signup', function () {
	this.timeout(60 * 1000);

	describe('GitHubOAuthFlow', () => {

		it('Should timeout if no callback uri provided', async () => {
			const flow = new GitHubOAuthFlow('https://build.bzl.io/github_login');
			const state = 'abc123';
			const promise = flow.login(state, 0.1, /* open external url */ false);
			try {
				await promise;
				fail('should not reach here');
			} catch (message) {
				expect(message).to.eq('GitHub OAuth cancelled (timeout)');
			}
			flow.dispose();
		});

		it('Should retrieve jwt from the callback uri', async () => {
			const uriHandler = new UriEventHandler();
			const flow = new GitHubOAuthFlow('https://build.bzl.io/github_login', uriHandler);
			const state = 'abc123';
			const expectedJwt = '12345';
			const promise = flow.login(state, 30, /* open external url */ false);
			let uri = await flow.getExternalCallbackUri();
			uri = uri.with({ query: `state=${state}&jwt=${expectedJwt}` });
			uriHandler.fire(uri);
			const actualJwt = await promise;
			expect(actualJwt).to.eq(expectedJwt);
			flow.dispose();
		});

	});

	describe('LicenseRetrievalFlow', () => {

		it('FAILED_PRECONDITION triggers registration flow', async () => {
			const address = `localhost:${await portfinder.getPortPromise()}`;
			const server = await createLicensesServiceServer(address, grpc.status.FAILED_PRECONDITION);
			server.start();
			const licenseClient: LicensesClient = createLicensesClient(licenseProtos, address);
			let registrationFlowCalled = false;
			const flow = new RenewLicenseFlow(licenseClient, 'fake-jwt-token', async () => {
				registrationFlowCalled = true;
			}, async () => {
			}, async () => {
			});
			try {
				await flow.get();
			} catch (e) {
			}
			expect(registrationFlowCalled).to.be.true;
			server.forceShutdown();
		});

		it('RESOURCE_EXHAUSTED triggers registration flow', async () => {
			const address = `localhost:${await portfinder.getPortPromise()}`;
			const server = await createLicensesServiceServer(address, grpc.status.RESOURCE_EXHAUSTED);
			server.start();
			const licenseClient: LicensesClient = createLicensesClient(licenseProtos, address);
			let expiredLicenseFlowCalled = false;
			const flow = new RenewLicenseFlow(licenseClient, 'fake-jwt-token', async () => {
			}, async () => {
				expiredLicenseFlowCalled = true;
			}, async () => { });
			try {
				await flow.get();
			} catch (e) {
			}
			expect(expiredLicenseFlowCalled).to.be.true;
			server.forceShutdown();
		});

		it('OK triggers success flow', async () => {
			const address = `localhost:${await portfinder.getPortPromise()}`;
			const server = await createLicensesServiceServer(address, grpc.status.OK, {});
			server.start();
			const licenseClient: LicensesClient = createLicensesClient(licenseProtos, address);
			let successFlowCalled = false;
			const flow = new RenewLicenseFlow(licenseClient, 'fake-jwt-token', async () => {
			}, async () => {
			}, async () => {
				successFlowCalled = true;
			});
			try {
				await flow.get();
			} catch (e) {
			}
			expect(successFlowCalled).to.be.true;
			server.forceShutdown();
		});

	});


});
