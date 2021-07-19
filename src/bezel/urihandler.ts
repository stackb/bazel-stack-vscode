import * as vscode from 'vscode';
import { CommandName } from './constants';

export class UriHandler implements vscode.UriHandler {
  constructor(disposables: vscode.Disposable[]) {
    disposables.push(vscode.window.registerUriHandler(this));
  }

  public async handleUri(uri: vscode.Uri) {
    // bring the bazel view into focus
    await vscode.commands.executeCommand('workbench.view.extension.bazel-explorer');
    switch (uri.path) {
      case '/login':
        return this.login(uri);
    }
  }

  private async login(uri: vscode.Uri): Promise<void> {
    const query = parseQuery(uri);
    const token = query['token'];
    const release = query['release'];
    if (!(token && release)) {
      return;
    }
    return vscode.commands.executeCommand(CommandName.Login, release, token);
  }
}

function parseQuery(uri: vscode.Uri): { [key: string]: string } {
  return uri.query.split('&').reduce((prev: any, current) => {
    const queryString = current.split('=');
    prev[queryString[0]] = queryString[1];
    return prev;
  }, {});
}
