import * as grpc from '@grpc/grpc-js';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { PromiseAdapter, promiseFromEvent } from '../../common/utils';
import { MultiStepInput } from '../../multiStepInput';
import { License } from '../../proto/build/stack/license/v1beta1/License';
import { LicensesClient } from '../../proto/build/stack/license/v1beta1/Licenses';
import { RenewLicenseResponse } from '../../proto/build/stack/license/v1beta1/RenewLicenseResponse';
import { CustomersClient } from '../../proto/build/stack/nucleate/v1beta/Customers';
import fetch = require('node-fetch');

const AUTH_RELAY_SERVER = 'stg-170465.bzl.io';

interface LicenseStatus {
    license: License | undefined
    status: grpc.ServiceError | undefined
}

class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
    public handleUri(uri: vscode.Uri) {
        this.fire(uri);
    }
}


/**
 * Controls the multistep input flow of signup and subscription creation.
 */
export class BzlSignup implements vscode.Disposable {
    private readonly commandStart = 'feature.bzl.signup.start';

    private _statusBarItem: vscode.StatusBarItem | undefined;

    private disposables: vscode.Disposable[] = [];
    private title = 'Bzl Signup';
    private githubUsername = '';
    private totalSteps = 3;
    private invalidGithubUsername: string = '';
    private uriHandler = new UriEventHandler();

    /**
     * JWT token allows us to make authorized requests to required gRPC apis.
     */
    private jwt: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1OTk0MjQzODAsImhhbmRsZSI6ImdpdGh1Yi5jb20vcGNqIn0.VYEmwH6zqRw0wKGxyGnGd6xLhBhG4Q4lwhbN9i9RKXQ';

    /**
     * The chosen login method.
     */
    private loginMethod: vscode.QuickPickItem | undefined;

    constructor(
        private licensesClient: LicensesClient,
        private customers: CustomersClient
    ) {
        this.disposables.push(vscode.commands.registerCommand(this.commandStart, this.handleCommandStart, this));
        this.disposables.push(vscode.window.registerUriHandler(this.uriHandler));
        this.disposables.push(this.uriHandler);
    }

    async handleCommandStart(): Promise<any> {
        await this.collectLoginMethod();
        if (!this.loginMethod) {
            return;
        }
        switch (this.loginMethod.label) {
            case 'GitHub':
                await this.signupGithub();
                break;
            case 'Email':
                await this.signupEmail();
                break;
        }
    }

    async signupGithub(): Promise<void> {
        try {
            await this.getJwtToken();
        } catch (e) {
            vscode.window.showErrorMessage(`Unable to obtain login credentials: ${e}`);
            return;
        }

        try {
            const licenseText = await this.getLicenseKey();
            const config = vscode.workspace.getConfiguration('feature.bzl.license');
            await config.update('token', licenseText.trim(), vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(config.get<string>('token') || '');
        } catch (e) {
            vscode.window.showErrorMessage(`Unable to obtain license: ${e}`);
        }
    }

    async getJwtToken(): Promise<string> {
        if (this.jwt) {
            return Promise.resolve(this.jwt);
        }
        return this.jwt = await this.login('user:email');
    }

    getGrpcMetadata(): grpc.Metadata {
        const md = new grpc.Metadata();
        md.add('Authorization', `Bearer: ${this.jwt}`);
        return md;
    }

    getLicenseStatus(): Promise<LicenseStatus> {
        return new Promise<LicenseStatus>((resolve, reject) => {
            this.licensesClient.Renew({}, this.getGrpcMetadata(), async (err?: grpc.ServiceError, resp?: RenewLicenseResponse) => {
                resolve({ license: resp?.license, status: err });
            });
        });
    }

    async getLicenseKey(): Promise<string> {
        // @ts-ignore
        return fetch('https://stg-get.bzl.io/linux_amd64/license.key', {
            method: 'GET',
            headers: {
                // 'Authorization': 'Bearer2 ' + this.jwt,
                'Host': 'stg-get.bzl.io'
            }
        }).then((res: any) => {
            const text = res.text();
            if (res.ok) {
                return text;
            }
        }).catch((err: any) => {
            console.log('error: ', err);
        });
    }

    async signupEmail(): Promise<void> {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://build.bzl.io/bzl/register'));
    }

    private updateStatusBarItem(isStart?: boolean) {
        if (isStart && !this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this._statusBarItem.text = '$(mark-github) Signing in to github.com...';
            // this._statusBarItem.command = 'github.provide-token';
            this._statusBarItem.show();
        }

        if (!isStart && this._statusBarItem) {
            this._statusBarItem.dispose();
            this._statusBarItem = undefined;
        }
    }

    async collectInputs(): Promise<void> {
        // if (this.currentGithubUsername) {
        // 	await MultiStepInput.run(input => this.pickCurrentOrNewGithubUsername(input));
        // 	return;
        // }

        return MultiStepInput.run(input => this.inputGithubUsername(input));
    }

    public async collectLoginMethod(): Promise<void> {
        return MultiStepInput.run(input => this.pickLoginMethod(input));
    }

    async inputGithubUsername(input: MultiStepInput): Promise<any> {
        this.githubUsername = '';
        this.githubUsername = await input.showInputBox({
            title: this.title,
            step: 1,
            totalSteps: this.totalSteps,
            value: this.githubUsername,
            prompt: 'Enter your GitHub username',
            validate: name => this.validateGithubUsername(name, this.invalidGithubUsername),
            shouldResume: this.shouldResume,
        });

        try {
            vscode.window.showInformationMessage(`github username: ${this.githubUsername}`);

            // const customer = this.get();

        } catch (err) {
            if (err.statusCode === 401) {
                vscode.window.showErrorMessage('Invalid github username, please try again.');
                return (nextInput: MultiStepInput) => this.inputGithubUsername(nextInput);
            }
            throw err;
        }
    }

    async pickLoginMethod(input: MultiStepInput): Promise<void> {
        const items: vscode.QuickPickItem[] = [
            createQuickPickItem('GitHub', 'Login via GitHub (OAuth)', 'You\'ll will be prompted by GitHub to permit access to your username and email address'),
            createQuickPickItem('Email', 'Login via Email Address', 'Use traditional login username/password flow'),
        ];

        const pick = await input.showQuickPick({
            title: this.title,
            step: 1,
            totalSteps: this.totalSteps,
            placeholder: 'Select an authorization method',
            items: items,
            activeItem: this.loginMethod ? this.loginMethod : items[0],
            shouldResume: this.shouldResume,
        });

        this.loginMethod = pick;
    }

    public async login(scopes: string = ''): Promise<string> {
        this.updateStatusBarItem(true);

        const state = uuid();
        const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://StackBuild.bazel-stack-vscode/did-authenticate`));

        const uri = vscode.Uri.parse(`https://${AUTH_RELAY_SERVER}/github_login?redirect_uri=${encodeURIComponent(callbackUri.toString())}&scope=${scopes}&state=${state}&responseType=code`);
        await vscode.env.openExternal(uri);

        return Promise.race([
            promiseFromEvent(this.uriHandler.event, extractJWTFromCallbackURI(state)),
            timeoutMessage(30, 'GitHub OAuth cancelled (timeout)'),
        ]).finally(() => {
            this.updateStatusBarItem(false);
        });
    }


    async validateGithubUsername(username: string, invalidUsername: string) {
        if (username === invalidUsername) {
            return 'Invalid username';
        }
    }

    shouldResume(): Promise<boolean> {
        // Required by multiStepInput
        // Could show a notification with the option to resume.
        //eslint-disable-next-line @typescript-eslint/no-empty-function
        return new Promise<boolean>(() => { });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}

const extractJWTFromCallbackURI: (state: string) => PromiseAdapter<vscode.Uri, string> = (state) => async (uri, resolve, reject) => {
    // Logger.info('Exchanging code for token...');
    const query = parseQuery(uri);

    if (query.state !== state) {
        reject('Mismatched state token');
        return;
    }

    if (query.error) {
        reject(`${query.error}: ${query.error_description}`);
        return;
    }

    if (!query.jwt) {
        reject('JWT token query param missing');
        return;
    }

    resolve(query.jwt);
};

function parseQuery(uri: vscode.Uri): any {
    return uri.query.split('&').reduce((prev: any, current) => {
        const queryString = current.split('=');
        prev[queryString[0]] = queryString[1];
        return prev;
    }, {});
}


function createQuickPickItem(label: string, description: string, detail: string): vscode.QuickPickItem {
    return {
        label: label,
        description: description,
        detail: detail,
    };
}

function timeoutMessage(secs: number, message: string): Promise<string> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(message);
        }, secs * 1000);
    });
}