import * as vscode from 'vscode';
import { BuiltInCommands } from '../constants';
import { CommandName } from './constants';

export abstract class Settings<T> extends vscode.TreeItem implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  private cfg: Promise<T> | undefined;
  private _onDidConfigurationChange: vscode.EventEmitter<T> = new vscode.EventEmitter();
  public onDidConfigurationChange: vscode.Event<T> = this._onDidConfigurationChange.event;
  private _onDidConfigurationError: vscode.EventEmitter<Error> = new vscode.EventEmitter();
  public onDidConfigurationError: vscode.Event<Error> = this._onDidConfigurationError.event;

  constructor(
    private section: string,
  ) {
    super('Settings');
    this.description = section;
    this.iconPath = new vscode.ThemeIcon('gear');
    this.tooltip = section;
    this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
    this.command = {
      title: 'Edit settings',
      command: BuiltInCommands.OpenSettings,
      arguments: [section],
    };

    this.disposables.push(this._onDidConfigurationChange);
    this.disposables.push(this._onDidConfigurationError);

    this.disposables.push(vscode.workspace.onDidChangeConfiguration(async e => {
      if (e.affectsConfiguration(section)) {
        return this.reconfigure(section);
      }
    }));
  }

  protected async reconfigure(section: string): Promise<T> {
    console.log(`reconfiguring ${section}...`);
    try {
      this.description = 'Loading...';
      this.iconPath = new vscode.ThemeIcon('gear~spin');
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

      const config = vscode.workspace.getConfiguration(section);
      if (!config) {
        throw new Error(`error: configuration section "${section}" not found.`);
      }
      const cfg = await this.configure(config);
      this.cfg = Promise.resolve(cfg);
      this._onDidConfigurationChange.fire(cfg);
      this.description = section;
      this.iconPath = new vscode.ThemeIcon('gear');
      return this.cfg;
    } catch (e) {
      this.iconPath = new vscode.ThemeIcon('warning');
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;

      const msg = `could not configure "${section}": ${e.message}`;
      // vscode.window.showWarningMessage(msg);
      this._onDidConfigurationError.fire(e);
      this.description = e.message;
      return this.cfg = Promise.reject(msg);
    }
  }

  protected abstract configure(config: vscode.WorkspaceConfiguration): Promise<T>;

  public async get(): Promise<T> {
    console.log(`get configuration for ${this.section}...`);
    if (!this.cfg) {
      console.log(`!get reconfiguration for ${this.section}...`);
      this.cfg = this.reconfigure(this.section);
    }
    return this.cfg;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    const items: vscode.TreeItem[] = [];
    const cfg = await this.get();
    for (const k of Object.keys(cfg)) {
      if (k.startsWith('_')) {
        continue;
      }
      // @ts-ignore
      const v: any = cfg[k];
      const item = new vscode.TreeItem(k);
      item.description = Array.isArray(v) ? v.join(' ') : String(v);
      item.tooltip = `${k} = ${this.description}`;
      item.iconPath = new vscode.ThemeIcon('debug-breakpoint-unverified');
      item.command = {
        title: 'Copy',
        command: CommandName.CopyToClipboard,
        arguments: [v],
      }
      items.push(item);
    }

    return items;
  }

  // async getChildrenConfig(): Promise<vscode.TreeItem[] | undefined> {
  //   const items: vscode.TreeItem[] = [];
  //   // const cfg = this.get();
  //   // const config = vscode.workspace.getConfiguration(this.section);
  //   for (const k of Object.keys(config)) {
  //     switch (k) {
  //       case 'has': case 'get': case 'update': case 'inspect':
  //         break;
  //       default:
  //         const v = config.get(k);
  //         const item = new vscode.TreeItem(k);
  //         item.description = String(v);
  //         item.tooltip = `${v} = ${v} (${typeof v})`;
  //         item.iconPath = new vscode.ThemeIcon('debug-breakpoint-unverified');
  //         item.command = {
  //           title: 'Open setting',
  //           command: BuiltInCommands.OpenSettings,
  //           arguments: [this.section + '.' + k],
  //         }
  //         items.push(item);
  //     }
  //   }

  //   return items;
  // }

  dispose() {
    this.disposables.forEach(d => d.dispose());
    this.disposables.length = 0;
  }
}

