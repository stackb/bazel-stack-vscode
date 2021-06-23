import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { Position } from '../proto/build/stack/lsp/v1beta1/Position';
import { Range } from '../proto/build/stack/lsp/v1beta1/Range';
import { BazelCodeLensConfiguration, BezelConfiguration } from './configuration';
import { CommandName } from './constants';
import { BezelLSPClient, LabelKindRange } from './lsp';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
  private disposables: vscode.Disposable[] = [];
  private cfg: BazelCodeLensConfiguration | undefined;
  private lspClient: BezelLSPClient | undefined;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    onDidChangeConfiguration: vscode.Event<BezelConfiguration>,
    onDidChangeLSPClient: vscode.Event<BezelLSPClient>,
  ) {
    onDidChangeConfiguration(this.handleConfigurationChange, this, this.disposables);
    onDidChangeLSPClient(this.handleLSPClientChange, this, this.disposables);

    this.disposables.push(vscode.languages.registerCodeLensProvider('bazel', this));
  }

  private handleConfigurationChange(cfg: BezelConfiguration) {
    this.cfg = cfg.codelens;
    this._onDidChangeCodeLenses.fire();
  }

  private handleLSPClientChange(lspClient: BezelLSPClient) {
    this.lspClient = lspClient;
    this._onDidChangeCodeLenses.fire();
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    if (!this.lspClient) {
      return [];
    }
    try {
      const labelKinds = await this.lspClient.getLabelKindsInDocument(document.uri);
      if (!labelKinds) {
        return [];
      }
      return flatten(labelKinds.map(lk => this.createCodeLensesForLabelKindRange(lk)));
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
      this.labelKindLens(
        labelKind,
        'build',
        'Build label',
        this.cfg.enableBuildEventProtocol ? CommandName.BuildEvents : CommandName.Build
      )
    );

    if (labelKind.label!.Name!.endsWith('_test')) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'test',
          'Test label',
          this.cfg.enableBuildEventProtocol ? CommandName.TestEvents : CommandName.Test
        )
      );
    }

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
        this.labelKindLens(labelKind, 'UI', 'View the UI for this label', CommandName.UI)
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
    return new vscode.CodeLens(makeRange(labelKind.range!), {
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

function makeRange(r: Range): vscode.Range {
  return new vscode.Range(makePosition(r.start!), makePosition(r.end!));
}

function makePosition(p: Position): vscode.Position {
  return new vscode.Position(p.line!, p.character!);
}
