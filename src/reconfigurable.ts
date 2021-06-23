import * as vscode from 'vscode';

export abstract class Reconfigurable<T> implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  protected onDidConfigurationChange: vscode.EventEmitter<T> = new vscode.EventEmitter();

  constructor(section: string) {
    const reconfigure = async () => {
      const config = vscode.workspace.getConfiguration(section);
      try {
        const cfg = await this.configure(vscode.workspace.getConfiguration(section));
        this.onDidConfigurationChange.fire(cfg);
      } catch (e) {
        vscode.window.showWarningMessage(
          `could not reconfigure "${section}": ${JSON.stringify(e)}`
        );
      }
    };
    this.add(
      vscode.workspace.onDidChangeConfiguration(async e => {
        if (e.affectsConfiguration(section)) {
          reconfigure();
        }
      })
    );
    reconfigure();
  }

  /**
   * Configure
   * @param config The workspace configuration to configure from.
   */
  protected abstract configure(config: vscode.WorkspaceConfiguration): Promise<T>;

  /**
   * Adds the given child disposable to the feature.
   * @param disposable
   * @returns
   */
  protected add<D extends vscode.Disposable>(disposable: D): D {
    this.disposables.push(disposable);
    return disposable;
  }

  /**
   * @override
   */
  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
