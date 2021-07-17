import * as vscode from 'vscode';

/**
 * Base class for a view that produces tree output.  All such views have a
 * refresh command.
 */
export abstract class TreeView<T> implements vscode.Disposable, vscode.TreeDataProvider<T> {
  view: vscode.TreeView<T>;
  disposables: vscode.Disposable[] = [];
  _onDidChangeTreeData: vscode.EventEmitter<T | undefined> = new vscode.EventEmitter<
    T | undefined
  >();
  readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event;

  constructor(protected name: string) {
    const view = (this.view = vscode.window.createTreeView(this.name, {
      treeDataProvider: this,
    }));
    this.disposables.push(view);
    this.registerCommands();
  }

  protected abstract getRootItems(): Promise<T[] | undefined>;

  protected registerCommands() {
    const refreshCommandName = this.name + '.refresh';
    this.disposables.push(
      vscode.commands.registerCommand(refreshCommandName, this.handleCommandRefresh, this)
    );
  }

  protected handleCommandRefresh() {
    this.refresh();
  }

  protected addCommand(name: string, command: (...args: any) => any) {
    this.disposables.push(vscode.commands.registerCommand(name, command, this));
  }

  protected addDisposable<T extends vscode.Disposable>(d: T): T {
    this.disposables.push(d);
    return d;
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

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
