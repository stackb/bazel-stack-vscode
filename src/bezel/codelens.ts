import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { BazelCodeLensConfiguration, BezelConfiguration } from './configuration';
import { CommandName } from './constants';
import { BzlLanguageClient, Label, LabelKindRange } from './lsp';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
  private disposables: vscode.Disposable[] = [];
  private cfg: BazelCodeLensConfiguration | undefined;
  private client: BzlLanguageClient | undefined;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    onDidChangeConfiguration: vscode.Event<BezelConfiguration>,
    onDidChangeBzlLanguageClient: vscode.Event<BzlLanguageClient>
  ) {
    onDidChangeConfiguration(this.handleConfigurationChange, this, this.disposables);
    onDidChangeBzlLanguageClient(this.handleBzlLanguageClientChange, this, this.disposables);

    this.disposables.push(vscode.languages.registerCodeLensProvider('bazel', this));
  }

  private handleConfigurationChange(cfg: BezelConfiguration) {
    this.cfg = cfg.codelens;
    this._onDidChangeCodeLenses.fire();
  }

  private handleBzlLanguageClientChange(client: BzlLanguageClient) {
    this.client = client;
    this._onDidChangeCodeLenses.fire();
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (!(this.client && this.cfg)) {
      return [];
    }
    try {
      const labelKinds = await this.client.getLabelKindsInDocument(document.uri);
      if (!(labelKinds && labelKinds.length)) {
        return [];
      }
      // first entry becomes the template for the codelenses for the "package"
      // level codelenses.
      const a = labelKinds[0];

      const recursive = this.createCodeLensesForLabelKindRange({
        enableBuildEventProtocol: this.cfg.enableBuildEventProtocol,
        enableBuild: this.cfg.enableBuild,
        enableTest: this.cfg.enableTest,
        enableRun: false,
        enableStarlarkDebug: false,
        enableCodesearch: this.cfg.enableCodesearch,
        enableUI: this.cfg.enableUI,
      }, {
        label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: '...' },
        kind: 'package',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      });

      const all = this.createCodeLensesForLabelKindRange({
        enableBuildEventProtocol: this.cfg.enableBuildEventProtocol,
        enableBuild: this.cfg.enableBuild,
        enableTest: this.cfg.enableTest,
        enableRun: false,
        enableStarlarkDebug: false,
        enableCodesearch: this.cfg.enableCodesearch,
        enableUI: this.cfg.enableUI,
      }, {
        label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: 'all' },
        kind: 'package',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      });

      const special = flatten([recursive, all]);
      const normal = flatten(labelKinds.map(lk => this.createCodeLensesForLabelKindRange(this.cfg!, lk)));

      return special.concat(normal);

    } catch (err) {
      console.warn(`codelens error ${document.uri.fsPath}: ${err.message}`);
    }
    return [];
  }

  private createCodeLensesForLabelKindRange(cfg: BazelCodeLensConfiguration, labelKind: LabelKindRange): vscode.CodeLens[] {

    const lenses: vscode.CodeLens[] = [];

    lenses.push(
      this.labelKindLens(labelKind, '', 'Copy to Clipboard', CommandName.CopyToClipboard),
    );

    if (cfg.enableBuild) {
      lenses.push(
        this.labelKindLens(labelKind, 'build', 'Build label', CommandName.Build)
      );  
    }

    const labelName = labelKind.label!.Name!;
    if (cfg.enableTest && (labelName === '...' || labelName === 'all' || labelName.endsWith('_test'))) {
      lenses.push(this.labelKindLens(labelKind, 'test', 'Test label', CommandName.Test));
    }

    if (cfg.enableRun) {
      lenses.push(
        this.labelKindLens(labelKind, 'run', 'Run label', CommandName.Run),
      );
    }

    if (cfg.enableStarlarkDebug) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'debug',
          'Start starlark debug server and debug CLI client',
          CommandName.DebugBuild
        )
      );
    }

    if (cfg.enableCodesearch) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'search',
          'Codesearch all transitive source files for this label',
          CommandName.Codesearch
        )
      );
    }

    if (cfg.enableUI) {
      lenses.push(
        this.labelKindLens(labelKind, 'UI', 'View the UI for this label', CommandName.UiLabel)
      );
    }

    return lenses;
  }

  private labelKindLens(
    labelKind: LabelKindRange,
    title: string,
    tooltip: string,
    command: string
  ): vscode.CodeLens {
    const label = formatLabel(labelKind.label);
    if (!title) {
      title = label;
    }
    return new vscode.CodeLens(labelKind.range, {
      title: title,
      tooltip: tooltip,
      command: command,
      arguments: [label],
    });
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

function formatLabel(label: Label): string {
  const repo = label.Repo ? '@' + label.Repo : '';
  const sep = label.Name === '...' ? (label.Pkg ? '/' : '') : ':';
  return `${repo}//${label.Pkg}${sep}${label.Name}`;
}