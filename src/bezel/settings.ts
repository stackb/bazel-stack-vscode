import * as vscode from 'vscode';
import { Container } from '../container';
import { ComponentConfiguration } from './configuration';

function getConfigurationProperties(prefix: string): Map<string, ConfigurationProperty> {
  const matched = new Map<string, ConfigurationProperty>();
  const filename = Container.file('package.json').fsPath;
  const packageJSON = require(filename);
  const properties = packageJSON['contributes']['configuration']['properties'] as {
    [key: string]: ConfigurationProperty;
  };
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

export abstract class Settings<T extends ComponentConfiguration>
  implements vscode.Disposable
{
  protected disposables: vscode.Disposable[] = [];
  private cfg: Promise<T> | undefined;
  public readonly props: Map<string, ConfigurationProperty>;
  private _onDidConfigurationChange: vscode.EventEmitter<T> = new vscode.EventEmitter();
  public onDidConfigurationChange: vscode.Event<T> = this._onDidConfigurationChange.event;
  private _onDidConfigurationError: vscode.EventEmitter<Error> = new vscode.EventEmitter();
  public onDidConfigurationError: vscode.Event<Error> = this._onDidConfigurationError.event;

  constructor(public readonly section: string) {
    this.props = getConfigurationProperties(section);

    this.disposables.push(this._onDidConfigurationChange);
    this.disposables.push(this._onDidConfigurationError);
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(async e => {
        if (e.affectsConfiguration(section)) {
          return this.reconfigure(section);
        }
      })
    );
  }

  protected async reconfigure(section: string): Promise<T> {
    console.log(`- Configuring ${section}...`);
    try {
      const config = vscode.workspace.getConfiguration(section);
      if (!config) {
        throw new Error(`configuration section "${section}" not found.`);
      }
      const cfg = await this.configure(config);

      this.props.forEach(p => {
        // @ts-ignore
        p.value = cfg[p.name];
      });

      this.cfg = Promise.resolve(cfg);
      this._onDidConfigurationChange.fire(cfg);
    } catch (e) {
      this.cfg = Promise.reject(`could not configure "${section}": ${e.message}`)
      this._onDidConfigurationError.fire(e);
    }

    return this.cfg;
  }

  protected abstract configure(config: vscode.WorkspaceConfiguration): Promise<T>;

  public async get(): Promise<T> {
    if (!this.cfg) {
      this.cfg = this.reconfigure(this.section);
    }
    return this.cfg;
  }

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
