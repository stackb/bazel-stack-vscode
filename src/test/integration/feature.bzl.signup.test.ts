'use strict';
import * as grpc from '@grpc/grpc-js';
import { fail } from 'assert';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { createLicensesClient } from '../../bzl/configuration';
import { BzlFeatureName } from '../../bzl/feature';
import { GitHubOAuthFlow } from '../../bzl/view/signup/githubOAuthFlow';
import { PaymentCardInput, PaymentCVVInput, PaymentZipInput } from '../../bzl/view/signup/payment';
import { RenewLicenseFlow } from '../../bzl/view/signup/renewLicenseFlow';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { createLicensesServiceServer, licenseProtos } from './feature.bzl.license.test';
import tmp = require('tmp');
import path = require('path');
import vscode = require('vscode');
import getPort = require('get-port');

type validationTestCase = {
	d: string,
	input: string,
	output: string,
};

describe(BzlFeatureName + '.signup', function () {
	this.timeout(60 * 1000); 

	before(async () => {
	});

	after(async () => {
	});

	describe('PaymentCardInput', () => {
		const cases: validationTestCase[] = [
			{
				d: 'empty input should be incomplete',
				input: '',
				output: 'Incomplete card number',
			},
			{
				d: 'garbage should be invalid',
				input: 'foo',
				output: 'Invalid card number',
			},
			{
				d: 'incomplete visa should be incomplete',
				input: '4242',
				output: 'Incomplete visa number',
			},
			{
				d: 'test visa should be ok',
				input: '4242424242424242',
				output: '',
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const input = new PaymentCardInput();
				const output = await input.validate(tc.input);
				expect(output).to.eq(tc.output);
			});
		});
	});


	describe('PaymentCVVInput', () => {
		const cases: validationTestCase[] = [
			{
				d: 'empty input should be incomplete',
				input: '',
				output: 'Invalid or incomplete CVV number',
			},
			{
				d: 'garbage should be invalid',
				input: 'foo',
				output: 'Invalid or incomplete CVV number',
			},
			{
				d: 'valid cvv should be ok',
				input: '123',
				output: '',
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const input = new PaymentCVVInput();
				const output = await input.validate(tc.input);
				expect(output).to.eq(tc.output);
			});
		});
	});

	describe('PaymentZipInput', () => {
		const cases: validationTestCase[] = [
			{
				d: 'empty input should be incomplete',
				input: '',
				output: 'Invalid zip code',
			},
			{
				d: 'garbage should be invalid',
				input: 'foo',
				output: 'Invalid zip code',
			},
			{
				d: 'valid zip should be ok',
				input: '80201',
				output: '',
			},
		];

		cases.forEach(tc => {
			it(tc.d, async () => {
				const input = new PaymentZipInput();
				const output = await input.validate(tc.input);
				expect(output).to.eq(tc.output);
			});
		});
	});	

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
			const flow = new GitHubOAuthFlow('https://build.bzl.io/github_login');
			const state = 'abc123';
			const expectedJwt = '12345';
			const promise = flow.login(state, 30, /* open external url */ false);
			let uri = await flow.getExternalCallbackUri();
			uri = uri.with({ query: `state=${state}&jwt=${expectedJwt}`});
			flow.uriHandler.fire(uri);
			const actualJwt = await promise;
			expect(actualJwt).to.eq(expectedJwt);
			flow.dispose();
		});
		
	});

	describe.only('LicenseRetrievalFlow', () => {

		it('FAILED_PRECONDITION triggers registration flow', async () => {
			const address = `localhost:${await getPort()}`;
			const server = await createLicensesServiceServer(address, grpc.status.FAILED_PRECONDITION);
			server.start();
			const licenseClient: LicensesClient =  createLicensesClient(licenseProtos, address);
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
			const address = `localhost:${await getPort()}`;
			const server = await createLicensesServiceServer(address, grpc.status.RESOURCE_EXHAUSTED);
			server.start();
			const licenseClient: LicensesClient =  createLicensesClient(licenseProtos, address);
			let registrationFlowCalled = false;
			const flow = new RenewLicenseFlow(licenseClient, 'fake-jwt-token', async () => {
			}, async () => {
				registrationFlowCalled = true;
			}, async () => {});
			try {
				await flow.get();
			} catch (e) {
			}
			expect(registrationFlowCalled).to.be.true;
			server.forceShutdown();
		});

		it('RESOURCE_EXHAUSTED triggers registration flow', async () => {
			const address = `localhost:${await getPort()}`;
			const server = await createLicensesServiceServer(address, grpc.status.RESOURCE_EXHAUSTED);
			server.start();
			const licenseClient: LicensesClient =  createLicensesClient(licenseProtos, address);
			let registrationFlowCalled = false;
			const flow = new RenewLicenseFlow(licenseClient, 'fake-jwt-token', async () => {
			}, async () => {
				registrationFlowCalled = true;
			}, async () => {});
			try {
				await flow.get();
			} catch (e) {
			}
			expect(registrationFlowCalled).to.be.true;
			server.forceShutdown();
		});

		it('OK triggers success flow', async () => {
			const address = `localhost:${await getPort()}`;
			const server = await createLicensesServiceServer(address, grpc.status.OK, {});
			server.start();
			const licenseClient: LicensesClient =  createLicensesClient(licenseProtos, address);
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
