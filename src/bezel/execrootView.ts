import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import { ViewName } from './constants';
import { TreeView } from './treeView';
import { BazelInfo, BzlClient } from './bzl';

/**
 * Renders a view of the current bazel workspace.
 */
export class ExecRootView extends TreeView<FileChangeItem> {
  private items: FileChangeItem[] = [];
  private watcher: chokidar.FSWatcher | undefined;

  constructor(private client: BzlClient) {
    super(ViewName.ExecRoot);
  }

  protected async getRootItems(): Promise<FileChangeItem[] | undefined> {
    return this.items;
  }

  public async reset() {
    const info = await this.client.lang.bazelInfo(['bazel-bin']);
    const dir = info.bazelBin;
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
