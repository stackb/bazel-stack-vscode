
import { v4 as uuid } from 'uuid';
import * as vscode from 'vscode';
import { utils } from 'vscode-common';

export class GitHubOAuthFlow implements vscode.Disposable {
    private _statusBarItem: vscode.StatusBarItem | undefined;
    private disposables: vscode.Disposable[] = [];
    private jwt: string = '';

    constructor(
        /**
         * The base URL for the external webserver we call to process the github
         * callback and then redirect back to here.
         */
        private baseUrl: string,
        private uriHandler: UriEventHandler = new UriEventHandler(),
    ) {
		if (!baseUrl) {
			throw new Error('GithubOAuth baseUrl is required');
		}

        this.disposables.push(vscode.window.registerUriHandler(this.uriHandler));
        this.disposables.push(this.uriHandler);
    }

    async getJwt(): Promise<string> {
        if (!this.jwt) {
            this.jwt = await this.login();
        }
        return this.jwt;
    }

    public async getExternalCallbackUri(): Promise<vscode.Uri> {
        return vscode.env.asExternalUri(vscode.Uri.parse(`${vscode.env.uriScheme}://StackBuild.bazel-stack-vscode/did-authenticate`));
    }

    public async login(state: string = uuid(), timeoutSeconds = 60 * 10 /* 10min */, openExternalUrl = true): Promise<string> {
        this.updateStatusBarItem(true);

        const callbackUri = await this.getExternalCallbackUri();

        const uri = vscode.Uri.parse(`${this.baseUrl}?redirect_uri=${encodeURIComponent(callbackUri.toString())}&state=${state}&responseType=code`);
        if (openExternalUrl) {
            await vscode.env.openExternal(uri);
        }

        return Promise.race([
            utils.promiseFromEvent(this.uriHandler.event, GitHubOAuthFlow.extractJWTFromCallbackURI(state)),
            GitHubOAuthFlow.timeoutMessage(timeoutSeconds, 'GitHub OAuth cancelled (timeout)'),
        ]).finally(() => {
            this.updateStatusBarItem(false);
        });
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

    static timeoutMessage(secs: number, message: string): Promise<string> {
        return new Promise((_, reject) => {
            setTimeout(() => {
                reject(message);
            }, secs * 1000);
        });
    }    

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

    static extractJWTFromCallbackURI: (state: string) => utils.PromiseAdapter<vscode.Uri, string> = (state) => async (uri, resolve, reject) => {
        const query = GitHubOAuthFlow.parseQuery(uri);
    
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
    
    static parseQuery(uri: vscode.Uri): any {
        return uri.query.split('&').reduce((prev: any, current) => {
            const queryString = current.split('=');
            prev[queryString[0]] = queryString[1];
            return prev;
        }, {});
    }
    
}

export class UriEventHandler extends vscode.EventEmitter<vscode.Uri> implements vscode.UriHandler {
    public handleUri(uri: vscode.Uri) {
        this.fire(uri);
    }
}
