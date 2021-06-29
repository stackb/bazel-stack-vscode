import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { BzlClient, LabelKindRange } from './bzl';
import { BazelCodeLensConfiguration, BezelConfiguration } from './configuration';
import { CommandName } from './constants';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
  private disposables: vscode.Disposable[] = [];
  private cfg: BazelCodeLensConfiguration | undefined;
  private bzlClient: BzlClient | undefined;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    onDidChangeConfiguration: vscode.Event<BezelConfiguration>,
    onDidChangeBzlClient: vscode.Event<BzlClient>
  ) {
    onDidChangeConfiguration(this.handleConfigurationChange, this, this.disposables);
    onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);

    this.disposables.push(vscode.languages.registerCodeLensProvider('bazel', this));
  }

  private handleConfigurationChange(cfg: BezelConfiguration) {
    this.cfg = cfg.codelens;
    this._onDidChangeCodeLenses.fire();
  }

  private handleBzlClientChange(bzlClient: BzlClient) {
    this.bzlClient = bzlClient;
    this._onDidChangeCodeLenses.fire();
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (!this.bzlClient) {
      return [];
    }
    try {
      const labelKinds = await this.bzlClient.lang.getLabelKindsInDocument(document.uri);
      if (!labelKinds) {
        return [];
      }
      // put a set of labels at the top of the package
      const a = labelKinds[0];
      const all: LabelKindRange = {
        label: a.label,
        kind: 'package',
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
      };
      all.label.Name = 'all';
      return this.createCodeLensesForLabelKindRange(all).concat(
        flatten(labelKinds.map(lk => this.createCodeLensesForLabelKindRange(lk)))
      );
    } catch (err) {
      vscode.window.showErrorMessage(`codelens error ${document.uri.fsPath}: ${err.message}`);
    }
    return [];
  }

  private createCodeLensesForLabelKindRange(labelKind: LabelKindRange): vscode.CodeLens[] {
    if (!this.cfg) {
      return [];
    }

    const lenses: vscode.CodeLens[] = [];

    lenses.push(
      this.labelKindLens(labelKind, '', 'Copy to Clipboard', CommandName.CopyToClipboard),
      this.labelKindLens(labelKind, 'build', 'Build label', CommandName.Build)
    );

    const labelName = labelKind.label!.Name!;
    if (labelName.endsWith('_test') || labelName === 'all') {
      lenses.push(this.labelKindLens(labelKind, 'test', 'Test label', CommandName.Test));
    }

    lenses.push(this.labelKindLens(labelKind, 'run', 'Run label', CommandName.Run));

    if (this.cfg.enableStarlarkDebug) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'debug',
          'Start starlark debug server and debug CLI client',
          CommandName.DebugBuild
        )
      );
    }

    if (this.cfg.enableCodesearch) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'search',
          'Codesearch all transitive source files for this label',
          CommandName.Codesearch
        )
      );
    }

    if (this.cfg.enableUI) {
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
    const repo = labelKind.label!.Repo ? '@' + labelKind.label!.Repo : '';
    const label = `${repo}//${labelKind.label!.Pkg}:${labelKind.label!.Name}`;
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
