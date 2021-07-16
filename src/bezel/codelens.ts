import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { LanguageServerConfiguration } from './configuration';
import { CommandName } from './constants';
import {  BzlLanguageClient, Label, LabelKindRange } from './lsp';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
  private disposables: vscode.Disposable[] = [];
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    private lsp: BzlLanguageClient,
    ) {
    this.disposables.push(vscode.languages.registerCodeLensProvider('bazel', this));
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[] | undefined> {
    const cfg = await this.lsp.settings.get();

    try {
      const labelKinds = await this.lsp.getLabelKindsInDocument(document.uri);
      if (!(labelKinds && labelKinds.length)) {
        return [];
      }
      // first entry becomes the template for the codelenses for the "package"
      // level codelenses.
      const a = labelKinds[0];

      const recursive = this.createCodeLensesForLabelKindRange({
        enableCodelensBuild: cfg.enableCodelensBuild,
        enableCodelensTest: cfg.enableCodelensTest,
        enableCodelensRun: false,
        enableCodelensStarlarkDebug: false,
        enableCodelensCodesearch: cfg.enableCodelensCodesearch,
        enableCodelensUI: cfg.enableCodelensUI,
      }, {
        label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: '...' },
        kind: 'package',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      });

      const all = this.createCodeLensesForLabelKindRange({
        enableCodelensBuild: cfg.enableCodelensBuild,
        enableCodelensTest: cfg.enableCodelensTest,
        enableCodelensRun: false,
        enableCodelensStarlarkDebug: false,
        enableCodelensCodesearch: cfg.enableCodelensCodesearch,
        enableCodelensUI: cfg.enableCodelensUI,
      }, {
        label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: 'all' },
        kind: 'package',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      });

      const special = flatten([recursive, all]);
      const normal = flatten(labelKinds.map(lk => this.createCodeLensesForLabelKindRange(cfg, lk)));

      return special.concat(normal);

    } catch (err) {
      console.warn(`codelens error ${document.uri.fsPath}: ${err.message}`);
    }
    return [];
  }

  private createCodeLensesForLabelKindRange(cfg: Partial<LanguageServerConfiguration>, labelKind: LabelKindRange): vscode.CodeLens[] {

    const lenses: vscode.CodeLens[] = [];

    lenses.push(
      this.labelKindLens(labelKind, '', 'Copy to Clipboard', CommandName.CopyToClipboard),
    );

    if (cfg.enableCodelensBuild) {
      lenses.push(
        this.labelKindLens(labelKind, 'build', 'Build label', CommandName.Build)
      );  
    }

    const labelName = labelKind.label!.Name!;
    if (cfg.enableCodelensTest && (labelName === '...' || labelName === 'all' || labelName.endsWith('_test'))) {
      lenses.push(this.labelKindLens(labelKind, 'test', 'Test label', CommandName.Test));
    }

    if (cfg.enableCodelensRun) {
      lenses.push(
        this.labelKindLens(labelKind, 'run', 'Run label', CommandName.Run),
      );
    }

    if (cfg.enableCodelensStarlarkDebug) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'debug',
          'Start starlark debug server and debug CLI client',
          CommandName.DebugBuild
        )
      );
    }

    if (cfg.enableCodelensCodesearch) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'codesearch',
          'Codesearch all transitive source files for this label',
          CommandName.Codesearch
        )
      );
    }

    if (cfg.enableCodelensUI) {
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