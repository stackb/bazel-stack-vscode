import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { PromiseAdapter } from '../../common/utils';
import { AuthServiceClient } from '../../proto/build/stack/auth/v1beta1/AuthService';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { CreateSubscriptionRequest } from '../../proto/build/stack/nucleate/v1beta/CreateSubscriptionRequest';
import { Plan } from '../../proto/build/stack/nucleate/v1beta/Plan';
import { PlansClient } from '../../proto/build/stack/nucleate/v1beta/Plans';
import { Subscription } from '../../proto/build/stack/nucleate/v1beta/Subscription';
import { SubscriptionsClient } from '../../proto/build/stack/nucleate/v1beta/Subscriptions';
import { LicenseServerConfiguration } from '../configuration';
import { CreateSubscriptionFlow } from './signup/createSubscriptionFlow';
import { GitHubOAuthFlow } from './signup/githubOAuthFlow';
import { JumbotronPanel, Message, Tab } from './signup/jumbotronPanel';
import { ListPlansFlow } from './signup/listPlansFlow';
import { LoginAuthFlow } from './signup/loginAuthFlow';
import { RenewLicenseFlow, saveLicenseToken } from './signup/renewLicenseFlow';
import valid = require('card-validator');
import path = require('path');

const AUTH_RELAY_SERVER_BASE_URL = 'https://stg-170465.bzl.io/github_login';
// const AUTH_RELAY_SERVER_BASE_URL = 'https://build.bzl.io/github_login';

interface Card {
	number: string
	year: string
	month: string
	cvv: string
	zip: string
};

const tabs = new Map<string, Tab>([
	['get-started', {
		name: 'get-started',
		label: 'Get Started',
		href: 'command:feature.bzl.signup.start',
	}],
	['github-auth', {
		name: 'github-auth',
		label: '1 - Authorization',
		href: 'command:feature.bzl.signup.github',
	}],
	['email-auth', {
		name: 'email-auth',
		label: '1 - Authorization',
		href: 'command:feature.bzl.signup.email',
	}],
	['select-plan', {
		name: 'select-plan',
		label: '2 - Select Plan',
		href: 'command:feature.bzl.signup.plan',
	}],
	['payment', {
		name: 'payment',
		label: '3 - Payment Details',
		href: 'command:feature.bzl.signup.payment',
	}],
	['confirm', {
		name: 'confirm',
		label: '4 - Review & Confirm',
		href: 'command:feature.bzl.signup.confirm',
	}],
]);

function getTabs(names: string[]): Tab[] {
	return names.map(name => {
		const tab = tabs.get(name);
		if (!tab) {
			throw new Error(`unknown tab ${name}`);
		}
		return tab;
	});
}

/**
 * Controls the multistep input flow of signup and subscription creation.
 */
export class BzlSignup implements vscode.Disposable {
	private readonly commandStart = 'feature.bzl.signup.start';

	private disposables: vscode.Disposable[] = [];
	private getStarted: BzlGetStarted | undefined;

	constructor(
        private readonly extensionPath: string,
		private cfg: LicenseServerConfiguration,
		private authClient: AuthServiceClient,
		private licensesClient: LicensesClient,
		private plansClient: PlansClient,
		private subscriptionsClient: SubscriptionsClient
	) {
		this.disposables.push(vscode.commands.registerCommand(this.commandStart, this.handleCommandSignupStart, this));
	}

	handleCommandSignupStart(): Promise<void> {
		if (!this.getStarted || this.getStarted.wasDisposed) {
			this.getStarted = new BzlGetStarted(
				this.extensionPath,
				this.authClient,
				this.licensesClient,
				this.plansClient,
				this.subscriptionsClient,
			);
		}

		return this.getStarted.handleCommandSignupStart();
	}

	public dispose() {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
	}

}



/**
 * Controls the multistep input flow of signup and subscription creation.
 */
export class BzlGetStarted implements vscode.Disposable {
	public wasDisposed = false;

	private disposables: vscode.Disposable[] = [];
	private jwt: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAzMDcyNzMsImhhbmRsZSI6ImdpdGh1Yi5jb20vcGNqIn0.6lgk1_ZvZS3nnoyBbYnMgFO14g6xWB4Oj6PLV76PVRE';
	private panel: JumbotronPanel;
	private githubOAuth = new GitHubOAuthFlow(AUTH_RELAY_SERVER_BASE_URL);
	private loginAuth: LoginAuthFlow;
	private selectedAuthMethod: string | undefined;
	private plans: Plan[] | undefined;
	private selectedPlan: Plan | undefined;
	private selectedCard: Card | undefined;

	constructor(
        private readonly extensionPath: string,
		private authClient: AuthServiceClient,
		private licensesClient: LicensesClient,
		private plansClient: PlansClient,
		private subscriptionsClient: SubscriptionsClient
	) {
		this.panel = new JumbotronPanel(extensionPath, 'bzlSignup', 'Bzl: Get Started', vscode.ViewColumn.One);
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.github', this.signupGithub, this));
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.github.oauth', this.tryGithubOauth, this));
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.email', this.signupEmail, this));
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.plan', this.trySelectPlan, this));
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.payment', this.tryCollectPaymentDetails, this));
		this.disposables.push(vscode.commands.registerCommand('feature.bzl.signup.confirm', this.tryConfirm, this));
		this.disposables.push(this.panel);
		this.disposables.push(this.githubOAuth);
		this.loginAuth = new LoginAuthFlow(this.authClient);
		this.disposables.push(this.loginAuth);
	}

	async handleCommandSignupStart(): Promise<void> {
		await this.panel.render({
			heading: '<a href="https://stack.build" style="color: var(--vscode-editor-foreground)">Stack.Build</a>',
			subheading: '<a href="https://build.bzl.io" style="color: var(--vscode-editor-foreground)">Premium Bazel</a>',
			image: {
				url: 'https://user-images.githubusercontent.com/50580/93263024-644f5d80-f762-11ea-936d-aeed0c5788a9.gif',
			},
			lead: '<p>Sign-Up to get the most out your vscode+bazel experience.</p>'
				+ '<p style="margin-top: 3rem">Get Started via GitHub or Email</p>',
			buttons: [
				{
					label: 'Login with GitHub',
					href: 'command:feature.bzl.signup.github',
				},
				{
					label: 'Login with Email',
					href: 'command:feature.bzl.signup.email',
				},
			],
			features: [
				{
					heading: 'Repository Explorer',
					text: 'Discover and switch between bazel repos on your workstation',
					href: 'https://user-images.githubusercontent.com/50580/93265314-b2199500-f765-11ea-903e-b00600a1f2df.gif',
				},
				{
					heading: 'Workspace Explorer',
					text: 'Get to know your dependencies.'
						+ '<ul style="margin-top: 1.5rem">'
						+ '<li>See all external dependencies.</li>'
						+ '<li>Jump to declaration (file location)</li></ul>',
					href: 'https://user-images.githubusercontent.com/50580/93004991-e4c75180-f509-11ea-9343-71f7286978b1.png',
				},
				{
					heading: 'Package Explorer',
					text: 'Quickly navigate the bazel graph.'
						+ '<ul style="margin-top: 1.5rem">'
						+ '<li>List all packages.</li>'
						+ '<li>List all rules in a package.</li>'
						+ '<li>Build & test directly within vscode.</li>'
						+ '<li>Link to Bzl browser.</li>'
						+ '</ul>',
					href: 'https://user-images.githubusercontent.com/50580/93004991-e4c75180-f509-11ea-9343-71f7286978b1.png',
				},
			],
		});

	}

	async signupGithub(): Promise<void> {
		await this.panel.render({
			tabs: getTabs(['get-started', 'github-auth', 'select-plan', 'payment', 'confirm']),
			activeTab: 'github-auth',
			heading: 'Step 1',
			subheading: 'Login',
			image: {
				url: 'https://opendatascience.com/wp-content/uploads/2019/08/8-Trending-GitHub-Projects-for-Summer-2019-640x300.jpg',
			},
			lead: `
			<p>
				Grant access to your name and email address via GitHub OAuth.
			</p>
			<p>
				Clicking the <b>Authorize</b> button will redirect you to an external (GitHub) URL.
			</p>
			<p>
				 Once confirmed, you'll be redirected back into vscode.
			</p>
			`,
			buttons: [
				{
					label: 'Authorize',
					href: 'command:feature.bzl.signup.github.oauth',
				}
			],
		});
	}

	async tryGithubOauth(): Promise<void> {
		this.selectedAuthMethod = 'github-auth';
		try {
			let jwt = this.jwt;
			if (!jwt) {
				jwt = this.jwt = await this.githubOAuth.getJwt();
			}
			return this.tryListPlans(jwt);
		} catch (message) {
			vscode.window.showErrorMessage(`could not complete github oAuth flow: ${message}`);
		}
	}

	async tryRenewLicense(jwt: string = this.jwt): Promise<any> {
		await this.panel.render({
			heading: 'Checking',
			subheading: 'Subscription',
			lead: '<p>Getting your subscription details...</p>',
		});

		const flow = new RenewLicenseFlow(this.licensesClient, jwt,
			() => this.tryListPlans(jwt),
			() => this.tryListPlans(jwt),
			(license, token) => this.saveToken(license, token),
		);
		return flow.get();
	}

	async saveToken(license: License, token: string): Promise<void> {
		const imageUri = this.panel.asWebviewUri(['media', 'bazel-icon.svg']);

		await new Promise<void>((resolve, reject) => {
			this.panel.render({
				heading: '',
				subheading: 'Success',
				image: {
					url: license.avatarUrl || imageUri!.toString(),
					size: '30%',
				},
				lead: `
				<p>
					Subscription <b>${license.subscriptionName}</b> confirmed for <b>${license.name}</b>!
				</p>
				<p>
					Activate the extension to finish.
				</p>
				`,
				buttons: [
					{
						label: 'Activate',
						href: '#',
						onclick: async () => {
							resolve();
						}
					},
				],
			});
		});

		await saveLicenseToken(license, token);
		await vscode.commands.executeCommand('workbench.view.extension.bazel-explorer');
		this.dispose();
	}

	async tryListPlans(jwt: string = this.jwt): Promise<any> {
		const flow = new ListPlansFlow(
			this.plansClient,
			jwt,
			(plans: Plan[]) => {
				this.plans = plans;
				return this.trySelectPlan(jwt, plans);
			});
		return flow.get();
	}

	async trySelectPlan(jwt: string = this.jwt, plans: Plan[] | undefined = this.plans): Promise<any> {
		if (!plans) {
			return this.tryListPlans(jwt);
		}

		const plan = this.selectedPlan = await new Promise<Plan>((resolve, reject) => {
			this.panel.render({
				tabs: getTabs(['get-started', this.selectedAuthMethod || 'github-auth', 'select-plan', 'payment', 'confirm']),
				activeTab: 'select-plan',
				heading: 'Step 2',
				subheading: 'Select a Plan',
				lead: '<p>Choose a plan that fits you best.</p>',
				cards: plans.map(plan => {
					return {
						name: plan.name!,
						image: 'https://user-images.githubusercontent.com/50580/78734937-bfa13800-7906-11ea-8e94-f76af76a65ea.png',
						description: plan.description!,
						detail: formatPlanAmount(plan.amount, plan.interval),
						onclick: async (name: string): Promise<void> => {
							resolve(plan);
						}
					};
				}),
			});
		});

		return this.tryCollectPaymentDetails(jwt, plan);
	}

	static extractPlanName: () => PromiseAdapter<string, string> = () => async (name, resolve, reject) => {
		resolve(name);
	};

	async tryCollectPaymentDetails(jwt: string = this.jwt, plan: Plan | undefined = this.selectedPlan): Promise<any> {
		if (!plan) {
			return this.trySelectPlan(jwt);
		}

		const card = this.selectedCard = await new Promise((resolve, reject) => {
			this.panel.render({
				tabs: getTabs(['get-started', this.selectedAuthMethod || 'github-auth', 'select-plan', 'payment', 'confirm']),
				activeTab: 'payment',
				heading: 'Step 3',
				subheading: 'Payment',
				// previewImageUrl: 'https://user-images.githubusercontent.com/50580/93004991-e4c75180-f509-11ea-9343-71f7286978b1.png',
				lead: `
				<p>
					Enter your payment card details.
				</p>
				`,
				form: {
					name: 'payment',
					inputs: [
						{
							label: 'Credit Card Number',
							type: 'text',
							name: 'number',
							placeholder: 'Enter card number',
							required: true,
							display: 'inline-block',
							value: this.selectedCard?.number,
							size: 25,
							maxlength: 16,
							pattern: '\\d+',
							onchange: async (value: string) => {
								const result = valid.number(value);
								if (result.isValid) {
									return '';
								}
								return (result.isPotentiallyValid ? 'Incomplete ' : 'Invalid ') + (result.card ? result.card.type : 'card') + ' number';
							},
						},
						{
							label: 'Expiration Month',
							type: 'select',
							display: 'inline-block',
							name: 'month',
							value: this.selectedCard?.month,
							newrow: true,
							required: true,
							options: [
								{
									value: '1',
									label: 'January (01)',
								},
								{
									value: '2',
									label: 'February (02)',
								},
								{
									value: '3',
									label: 'March (03)',
								},
								{
									value: '4',
									label: 'April (04)',
								},
								{
									value: '5',
									label: 'May (05)',
								},
								{
									value: '6',
									label: 'June (06)',
								},
								{
									value: '7',
									label: 'July (07)',
								},
								{
									value: '8',
									label: 'August (08)',
								},
								{
									value: '9',
									label: 'September (09)',
								},
								{
									value: '11',
									label: 'October (10)',
								},
								{
									value: '11',
									label: 'November (11)',
								},
								{
									value: '12',
									label: 'December (12)',
								},
							],
						},
						{
							label: 'Year',
							type: 'select',
							display: 'inline-block',
							name: 'year',
							value: this.selectedCard?.year,
							required: true,
							options: ['2020', '2021', '2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030'].map(label => {
								return { label: label, value: label };
							}),
						},
						{
							label: 'CVV',
							type: 'text',
							name: 'cvv',
							placeholder: 'CVV',
							newrow: true,
							display: 'inline-block',
							value: this.selectedCard?.cvv,
							required: true,
							maxlength: 3,
							size: 3,
							onchange: async (value: string) => {
								const validation = valid.cvv(value);
								if (validation.isValid) {
									return '';
								}
								return 'Invalid or incomplete CVV number';
							},
						},
						{
							label: 'Zip Code',
							type: 'text',
							name: 'zip',
							display: 'inline-block',
							placeholder: '5-digit ZIP',
							pattern: '\\d\\d\\d\\d\\d',
							size: 10,
							value: this.selectedCard?.zip,
							maxlength: 5,
							required: true,
						},
					],
					buttons: [
						{
							label: 'Submit',
							type: 'submit',
						},
					],
					onsubmit: async (message: Message) => {
						const formdata = message.data;
						if (!formdata) {
							return false;
						}
						const number = formdata['number'];
						const cvv = formdata['cvv'];
						const zip = formdata['zip'];
						const month = formdata['month'];
						const year = formdata['year'];
						resolve({ number, cvv, zip, year, month });
						return true;
					}
				}
			});
		});
		
		return this.tryConfirm(jwt, plan, card);
	}

	async tryConfirm(
		jwt: string = this.jwt,
		plan: Plan | undefined = this.selectedPlan,
		card: Card | undefined = this.selectedCard): Promise<any> {

		if (!plan) {
			return this.trySelectPlan(jwt);
		}
		if (!card) {
			return this.tryCollectPaymentDetails(jwt, plan);
		}

		const confirmed: boolean = await new Promise<boolean>((resolve, reject) => {
			this.panel.render({
				tabs: getTabs(['get-started', this.selectedAuthMethod || 'github-auth', 'select-plan', 'payment', 'confirm']),
				activeTab: 'confirm',
				heading: 'Review',
				subheading: 'Subscription',
				image: {
					url: 'https://user-images.githubusercontent.com/50580/93263024-644f5d80-f762-11ea-936d-aeed0c5788a9.gif',
				},
				lead: `
				<p>
					Confirm your subscription:
					<ul>
						<li><b>${plan.description}</b></li>
						<li>${formatPlanAmount(plan.amount, plan.interval)}</li>
						<li>Card ending in <code>${card.number.slice(-4)}</code></li>
						<li>14-day free trial</li>
						<li><emphasis>Cancel anytime without penalty</emphasis></li>
					</ul>
				</p>
				`,
				buttons: [
					{
						label: 'Subscribe',
						href: '#',
						onclick: async () => {
							resolve(true);
						}
					},
				],
			});
		});

		if (!confirmed) {
			return this.handleCommandSignupStart();
		}

		const req: CreateSubscriptionRequest = {
			planId: plan.id,
			paymentSource: {
				number: card.number,
				expYear: card.year,
				expMonth: card.month,
				cvc: card.cvv,
				addressZip: card.zip,
			},
		};

		const subscription = new CreateSubscriptionFlow(
			this.subscriptionsClient,
			jwt,
			req,
			async (status: grpc.ServiceError): Promise<void> => {
				vscode.window.showInformationMessage(status.message);
				return this.tryRenewLicense(jwt);
			},
			async (sub: Subscription): Promise<void> => {
				vscode.window.showInformationMessage(`Subscription '${sub.name}' successfully created`);
				return this.tryRenewLicense(jwt);
			},
		);

		return subscription.get();
	}

	async signupEmail(): Promise<void> {
		// if (this.jwt) {
		//     return this.tryRenewLicense(this.jwt);
		// }

		const form: { email: string, password: string } = await new Promise((resolve, reject) => {
			this.panel.render({
				tabs: getTabs(['get-started', 'email-auth', 'select-plan', 'payment', 'confirm']),
				activeTab: 'email-auth',
				heading: 'Step 1',
				subheading: 'Login',
				// previewImageUrl: 'https://user-images.githubusercontent.com/50580/93004991-e4c75180-f509-11ea-9343-71f7286978b1.png',
				lead: `
				<p>
					Login using your username/password.
				</p>
				`,
				// <p style="margin-top: 3rem">
				//     Not yet registered?
				// </p>

				form: {
					name: 'login',
					inputs: [
						{
							label: 'Email',
							type: 'email',
							name: 'email',
							placeholder: 'Enter your email address',
							size: 30,
							required: true,
						},
						{
							label: 'Password',
							name: 'password',
							type: 'password',
							placeholder: 'Enter your password',
							size: 30,
							required: true,
						},
					],
					buttons: [
						{
							label: 'Submit',
							type: 'submit',
						},
					],
					onsubmit: async (message: Message) => {
						const formdata = message.data;
						if (!formdata) {
							return false;
						}
						const email = formdata['email'];
						const password = formdata['password'];
						resolve({ email, password });
						return true;
					}

				},
			});
		});

		try {
			this.selectedAuthMethod = 'email-auth';
			this.jwt = await this.loginAuth.login(form.email, form.password);
			return this.tryRenewLicense(this.jwt);
		} catch (message) {
			vscode.window.showErrorMessage(`could not complete login auth flow: ${message}`);
			this.signupEmail();
		}
	}

	async signupManual(): Promise<void> {
		this.panel.render({
			heading: 'Manual',
			subheading: 'Configuration',
			// previewImageUrl: 'https://user-images.githubusercontent.com/50580/93004991-e4c75180-f509-11ea-9343-71f7286978b1.png',
			lead: `
			<p>
				Already signed up?  Copy the value in the text file <code>~/.bzl/license.key</code> into your extension settings.
			</p>
			`,
			buttons: [
				{
					label: 'Open Extension Settings',
					href: 'command:bsv.openExtensionSetting?%7B%22q%22%3A%22feature.bzl.license.token%22%7D',
				}
			],
		});
	}

	public dispose() {
		for (const disposable of this.disposables) {
			disposable.dispose();
		}
		this.disposables.length = 0;
		this.wasDisposed = true;
	}

}

function formatPlanAmount(amount: Long | string | number | undefined, interval: string | undefined): string {
	if (amount === undefined) {
		return '?';
	}
	if (typeof amount === 'string') {
		return amount;
	}
	if (typeof amount === 'number') {
		return `$${amount / 100}.00 / ${interval}`;
	}
	return `$${amount.low / 100}.00 / ${interval}`;
}
