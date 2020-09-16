import * as vscode from 'vscode';

/**
 * Renders an empty view.  Used as a placeholder when a view is deactivated.
 */
export class EmptyView implements vscode.TreeDataProvider<any> {
    constructor(
        viewId: string,
        disposables: vscode.Disposable[],
    ) {
        disposables.push(vscode.window.registerTreeDataProvider(viewId, this));
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: any): Promise<any[] | undefined> {
        return undefined;
    }
}

