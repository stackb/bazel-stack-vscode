import * as vscode from 'vscode';
import { CommandName } from '../constants';

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

        });
        // this.disposables.push(vscode.window.registerTreeDataProvider(name,
        // this)); // need this?
        this.disposables.push(view);
        this.registerCommands();
    }

    protected registerCommands() {
        const refreshCommandName = this.name + CommandName.RefreshSuffix;
        this.disposables.push(vscode.commands.registerCommand(refreshCommandName, this.handleCommandRefresh, this));
    }

    protected handleCommandRefresh() {
        this.refresh();
    }
    
    protected addCommand(name: string, command: (...args: any) => any) {
        this.disposables.push(vscode.commands.registerCommand(name, command, this));
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

    public getTreeItem(element: T): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: T): Promise<T[] | undefined> {
        if (!this.disposables.length) {
            return [];
        }
        if (element) {
            return [];
        }
        return this.getRootItems();
    }

    protected abstract async getRootItems(): Promise<T[] | undefined>;

    public dispose() {
        vscode.commands.executeCommand(this.name + CommandName.RefreshSuffix);

        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}
