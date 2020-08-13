import * as vscode from "vscode";

/**
 * Base class for a view that interacts with a gRPC endpoint and produces tree
 * output.  All such views have a refresh command.
 */
export abstract class GrpcTreeDataProvider<T> implements vscode.Disposable, vscode.TreeDataProvider<T> {

    protected view: vscode.TreeView<T>;
    protected disposables: vscode.Disposable[] = [];
    protected _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<T | undefined>();
    readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event;

    constructor(
        protected name: string,
    ) {
        const view = this.view = vscode.window.createTreeView(this.name, {
            treeDataProvider: this,
        })
        this.disposables.push(view);
        this.disposables.push(vscode.commands.registerCommand(name + '.refresh', this.refresh, this));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getTreeItem(element: T): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: T): Promise<T[] | undefined> {
        if (element) {
            return [];
        }
        return this.getRootItems();
    }
    
    protected abstract async getRootItems(): Promise<T[] | undefined>;

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}