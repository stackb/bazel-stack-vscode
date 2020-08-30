import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { PromiseAdapter, promiseFromEvent } from '../../common/utils';
import { MultiStepInput } from '../../multiStepInput';
import { CustomersClient } from '../../proto/build/stack/nucleate/v1beta/Customers';

const AUTH_RELAY_SERVER = 'stg-170465.bzl.io';

class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
	public handleUri(uri: vscode.Uri) {
		this.fire(uri);
	}
}

export const uriHandler = new UriEventHandler;

/**
 * Controls the multistep input flow of signup and subscription creation.
 */
export class BzlSignup implements vscode.Disposable {
    private readonly commandStart = 'feature.bzl.signup.start';

    private _statusBarItem: vscode.StatusBarItem | undefined;

    private disposables: vscode.Disposable[] = [];
    private title = 'Bzl Signup';
    private githubUsername = '';
    private totalSteps = 1;
    private invalidGithubUsername: string = '';

    constructor(
        private customers: CustomersClient
    ) {
        this.disposables.push(vscode.commands.registerCommand(this.commandStart, this.handleCommandStart, this));
    }

    async handleCommandStart(): Promise<any> {
        return this.login('repo:user');
        // return this.collectInputs();
    }

    private updateStatusBarItem(isStart?: boolean) {
		if (isStart && !this._statusBarItem) {
			this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
			this._statusBarItem.text = '$(mark-github) Signing in to github.com...';
			this._statusBarItem.command = 'github.provide-token';
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

	shouldResume(): Promise<boolean> {
		// Required by multiStepInput
		// Could show a notification with the option to resume.
		//eslint-disable-next-line @typescript-eslint/no-empty-function
		return new Promise<boolean>(() => {});
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

    public async login(scopes: string = ''): Promise<string> {
		this.updateStatusBarItem(true);

		const state = uuid();
		const callbackUri = await vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://StackBuild.bazel-stack-vscode/did-authenticate`));

        const uri = vscode.Uri.parse(`https://${AUTH_RELAY_SERVER}/authorize/?callbackUri=${encodeURIComponent(callbackUri.toString())}&scope=${scopes}&state=${state}&responseType=code&authServer=https://github.com`);
        await vscode.env.openExternal(uri);

		return Promise.race([
			promiseFromEvent(uriHandler.event, exchangeCodeForToken(state)),
		]).finally(() => {
			this.updateStatusBarItem(false);
		});
	}


	async validateGithubUsername(username: string, invalidUsername: string) {
		if (username === invalidUsername) {
			return 'Invalid username';
		}
	}

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}

const exchangeCodeForToken: (state: string) => PromiseAdapter<vscode.Uri, string> =
	(state) => async (uri, resolve, reject) => {
		// Logger.info('Exchanging code for token...');
		const query = parseQuery(uri);
		const code = query.code;

		if (query.state !== state) {
			reject('Received mismatched state');
			return;
		}

		try {
			const result = await fetch(`https://${AUTH_RELAY_SERVER}/token?code=${code}&state=${state}`, {
				method: 'POST',
				headers: {
					Accept: 'application/json'
				}
			});

			if (result.ok) {
				const json = await result.json();
				// Logger.info('Token exchange success!');
				resolve(json.access_token);
			} else {
				reject(result.statusText);
			}
		} catch (ex) {
			reject(ex);
		}
	};

function parseQuery(uri: vscode.Uri) {
	return uri.query.split('&').reduce((prev: any, current) => {
		const queryString = current.split('=');
		prev[queryString[0]] = queryString[1];
		return prev;
	}, {});
}
