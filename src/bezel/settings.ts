import * as vscode from 'vscode';
import { BuiltInCommands } from '../constants';
import { Container } from '../container';

function getConfigurationProperties(prefix: string): Map<string, ConfigurationProperty> {
  const matched = new Map<string, ConfigurationProperty>();
  const filename = Container.file('package.json').fsPath;
  const packageJSON = require(filename);
  const properties = packageJSON['contributes']['configuration']['properties'] as { [key: string]: ConfigurationProperty };
  Object.keys(properties).forEach(k => {
    if (!k.startsWith(prefix)) {
      return;
    }
    const property = properties[k];
    const parts = k.split('.');
    const name = parts.pop()!;
    matched.set(name, {
      key: k,
      type: property.type,
      name: name,
      value: property.default,
      description: property.description,
    });
  });
  return matched;
}

export abstract class Settings<T> extends vscode.TreeItem implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  private cfg: Promise<T> | undefined;
  private props: Map<string, ConfigurationProperty>;
  private _onDidConfigurationChange: vscode.EventEmitter<T> = new vscode.EventEmitter();
  public onDidConfigurationChange: vscode.Event<T> = this._onDidConfigurationChange.event;
  private _onDidConfigurationError: vscode.EventEmitter<Error> = new vscode.EventEmitter();
  public onDidConfigurationError: vscode.Event<Error> = this._onDidConfigurationError.event;

  constructor(
    private section: string,
  ) {
    super('Settings');
    this.props = getConfigurationProperties(section);
    this.description = section;
    this.iconPath = new vscode.ThemeIcon('gear');
    this.tooltip = new vscode.MarkdownString(
      `### Settings for "${section}"
      
      Click to open the VSCode settings and update the configuration items as desired.

      Changes should be reflected automatically, you should not need to reload the window.
      `,
    );
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
    console.log(`- Configuring ${section}...`);
    try {
      this.description = 'Loading...';
      this.iconPath = new vscode.ThemeIcon('gear~spin');
      this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;

      const config = vscode.workspace.getConfiguration(section);
      if (!config) {
        throw new Error(`error: configuration section "${section}" not found.`);
      }
      const cfg = await this.configure(config);

      this.props.forEach(p => {
        // @ts-ignore
        p.value = cfg[p.name];
      });

      this._onDidConfigurationChange.fire(cfg);
      this.description = section;
      this.iconPath = new vscode.ThemeIcon('gear');
      return this.cfg = Promise.resolve(cfg);
    } catch (e) {
      this.iconPath = new vscode.ThemeIcon('warning');
      this.collapsibleState = vscode.TreeItemCollapsibleState.None;

      const msg = `could not configure "${section}": ${e.message}`;
      this._onDidConfigurationError.fire(e);
      this.description = e.message;
      return this.cfg = Promise.reject(msg);
    }
  }

  protected abstract configure(config: vscode.WorkspaceConfiguration): Promise<T>;

  public async get(): Promise<T> {
    if (!this.cfg) {
      this.cfg = this.reconfigure(this.section);
    }
    return this.cfg;
  }

  async getChildren(): Promise<vscode.TreeItem[] | undefined> {
    return Array.from(this.props.values()).map(p => {
      const item = new vscode.TreeItem(p.name);
      item.description = formatValue(p.value, p.default);
      item.tooltip = p.description;
      item.iconPath = new vscode.ThemeIcon(getThemeIconNameForPropertyType(p.type));
      item.command = {
        title: 'Edit Setting',
        command: BuiltInCommands.OpenSettings,
        arguments: [p.key],
      };
      return item;
    });
  }

  // async getChildren(): Promise<vscode.TreeItem[] | undefined> {
  //   const items: vscode.TreeItem[] = [];
  //   const cfg = await this.get();
  //   for (const k of Object.keys(cfg)) {
  //     if (k.startsWith('_')) {
  //       continue;
  //     }
  //     // @ts-ignore
  //     const v: any = cfg[k];
  //     const item = new vscode.TreeItem(k);
  //     item.description = Array.isArray(v) ? v.join(' ') : String(v);
  //     item.tooltip = `${k} = ${this.description}`;
  //     item.iconPath = new vscode.ThemeIcon('debug-breakpoint-unverified');
  //     // item.command = {
  //     //   title: 'Copy',
  //     //   command: CommandName.CopyToClipboard,
  //     //   arguments: [v],
  //     // };
  //     this.command = {
  //       title: 'Edit Setting',
  //       command: BuiltInCommands.OpenSettings,
  //       arguments: [this.section+'.'+k],
  //     };

  //     items.push(item);
  //   }

  //   return items;
  // }

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

interface ConfigurationProperty {
  key: string;
  name: string;
  value: any;
  description: string;
  type: string;
  default?: any;
}

function getThemeIconNameForPropertyType(type: string): string {
  switch (type) {
    case 'string':
      return 'symbol-string';
    case 'array':
      return 'symbol-array';
    case 'number':
      return 'symbol-number';
    case 'boolean':
      return 'symbol-boolean';
    default:
      return 'symbol-property';
  }
}

function formatValue(v: any, def?: any): string {
  if (Array.isArray(v)) {
    return v.join(' ');
  }
  if (typeof v === 'undefined') {
    return `Not Defined (defaulted to ${def})`;
  }
  return String(v);
}