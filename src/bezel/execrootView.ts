import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import { ViewName } from './constants';
import { BazelInfoResponse, BezelLSPClient } from './lsp';
import { TreeView } from './treeView';

/**
 * Renders a view of the current bazel workspace.
 */
export class ExecRootView extends TreeView<FileChangeItem> {
  private info: BazelInfoResponse | undefined;
  private items: FileChangeItem[] = [];
  private watcher: chokidar.FSWatcher | undefined;

  constructor(private client: BezelLSPClient) {
    super(ViewName.ExecRoot);
  }

  protected async getRootItems(): Promise<FileChangeItem[] | undefined> {
    return this.items;
  }

  public async reset() {
    const dir = this.client?.info?.bazelBin;
    if (!dir) {
      return;
    }
    if (this.watcher) {
      await this.watcher.close();
    }

    this.items.length = 0;

    this.watcher = chokidar.watch(dir).on('all', (event: string, filename: string) => {
      if (!filename) {
        return;
      }

      switch (event) {
        case 'addDir':
          return;
      }
      const name = filename.slice(dir.length + 1);
      this.items.push(new FileChangeItem(event, name));
      this.refresh();
    });

    this.refresh();
  }
}

class FileChangeItem extends vscode.TreeItem {
  constructor(label: string, filename: string) {
    super(label);
    this.description = filename;
    this.iconPath = vscode.ThemeIcon.File;
  }
}
