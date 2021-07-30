import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { BazelServer } from './bazel';
import { Bzl } from './bzl';
import { CodeSearch } from './codesearch';
import { LanguageServerConfiguration } from './configuration';
import { CommandName } from './constants';
import { StarlarkDebugger } from './debugger';
import { BzlLanguageClient, Label, LabelKindRange } from './lsp';
import { Status } from './status';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
  private disposables: vscode.Disposable[] = [];
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(
    private lsp: BzlLanguageClient,
    private bazel: BazelServer,
    private codesearch: CodeSearch,
    private bzl: Bzl,
    private debug: StarlarkDebugger
  ) {
    this.disposables.push(vscode.languages.registerCodeLensProvider('bazel', this));
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[] | undefined> {
    const cfg = await this.lsp.settings.get();
    const enableCodelensBuild = cfg.enableCodelensBuild && this.bazel.status !== Status.DISABLED;
    const enableCodelensTest = cfg.enableCodelensTest && this.bazel.status !== Status.DISABLED;
    const enableCodelensRun = cfg.enableCodelensRun && this.bazel.status !== Status.DISABLED;
    const enableCodelensStarlarkDebug =
      cfg.enableCodelensStarlarkDebug && this.debug.status !== Status.DISABLED;
    const enableCodelensCodesearch =
      cfg.enableCodelensCodesearch && this.codesearch.status !== Status.DISABLED;
    const enableCodelensBrowse = cfg.enableCodelensBrowse && this.bzl.status !== Status.DISABLED;

    try {
      const labelKinds = await this.lsp.getLabelKindsInDocument(document.uri);
      if (!(labelKinds && labelKinds.length)) {
        return [];
      }
      // first entry becomes the template for the codelenses for the "package"
      // level codelenses.
      const a = labelKinds[0];

      const recursive = this.createCodeLensesForLabelKindRange(
        {
          enableCodelensCopyLabel: cfg.enableCodelensCopyLabel,
          enableCodelensBuild: enableCodelensBuild,
          enableCodelensTest: enableCodelensTest,
          enableCodelensRun: false,
          enableCodelensStarlarkDebug: false,
          enableCodelensCodesearch: enableCodelensCodesearch,
          enableCodelensBrowse: enableCodelensBrowse,
        },
        {
          label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: '...' },
          kind: 'package',
          range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
        }
      );

      const all = this.createCodeLensesForLabelKindRange(
        {
          enableCodelensCopyLabel: cfg.enableCodelensCopyLabel,
          enableCodelensBuild: enableCodelensBuild,
          enableCodelensTest: enableCodelensTest,
          enableCodelensRun: false,
          enableCodelensStarlarkDebug: false,
          enableCodelensCodesearch: enableCodelensCodesearch,
          enableCodelensBrowse: enableCodelensBrowse,
        },
        {
          label: { Repo: a.label.Repo, Pkg: a.label.Pkg, Name: 'all' },
          kind: 'package',
          range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)),
        }
      );

      const special = flatten([recursive, all]);
      const normal = flatten(
        labelKinds.map(lk =>
          this.createCodeLensesForLabelKindRange(
            {
              enableCodelensCopyLabel: cfg.enableCodelensCopyLabel,
              enableCodelensBuild: enableCodelensBuild,
              enableCodelensTest: enableCodelensTest,
              enableCodelensRun: enableCodelensRun,
              enableCodelensStarlarkDebug: enableCodelensStarlarkDebug,
              enableCodelensCodesearch: enableCodelensCodesearch,
              enableCodelensBrowse: enableCodelensBrowse,
            },
            lk
          )
        )
      );

      return special.concat(normal);
    } catch (err) {
      console.warn(`codelens error ${document.uri.fsPath}: ${err.message}`);
    }
    return [];
  }

  private createCodeLensesForLabelKindRange(
    cfg: Partial<LanguageServerConfiguration>,
    labelKind: LabelKindRange
  ): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    if (cfg.enableCodelensCopyLabel) {
      lenses.push(
        this.labelKindLens(labelKind, '', 'Copy to Clipboard', CommandName.CopyToClipboard)
      );
    }

    if (cfg.enableCodelensBuild) {
      lenses.push(this.labelKindLens(labelKind, 'build', 'Build label', CommandName.Build));
    }

    const labelName = labelKind.label!.Name!;
    if (
      cfg.enableCodelensTest &&
      (labelName === '...' || labelName === 'all' || labelName.endsWith('_test'))
    ) {
      lenses.push(this.labelKindLens(labelKind, 'test', 'Test label', CommandName.Test));
    }

    if (cfg.enableCodelensRun) {
      lenses.push(this.labelKindLens(labelKind, 'run', 'Run label', CommandName.Run));
    } else {
      if (labelKind.label.Name === 'debug_test') {
        console.log('?');
      }
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
          'Codesearch all transitive source files for this target',
          CommandName.Codesearch
        )
      );
    }

    if (cfg.enableCodelensBrowse) {
      lenses.push(
        this.labelKindLens(
          labelKind,
          'browse',
          'View this target in the browser',
          CommandName.UiLabel
        )
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
