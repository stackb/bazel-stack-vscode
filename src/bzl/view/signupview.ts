import * as vscode from 'vscode';


/**
 * Renders a view for bzl signup.
 */
export class BzlSignupView implements vscode.Disposable {
    private readonly viewId = 'bzl-signup';
    private static readonly viewType = 'bzl-signup';

    private disposables: vscode.Disposable[] = [];
    private panel: vscode.WebviewPanel;

    constructor(
        extensionUri: vscode.Uri
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        this.panel = vscode.window.createWebviewPanel(
            BzlSignupView.viewType,
            'Bzl Signup',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
            }
        );
        this.disposables.push(this.panel);
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}