// Copyright 2018 The Bazel Authors. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as vscode from 'vscode';
import { buildifierLint, getBuildifierFileType } from './execute';
import { BuildifierSettings } from './settings';

/**
 * The delay to wait for the user to finish typing before invoking buildifier to
 * determine lint warnings.
 */
const DIAGNOSTICS_ON_TYPE_DELAY_MILLIS = 500;

/** Manages diagnostics emitted by buildifier's lint mode. */
export class BuildifierDiagnosticsManager {
  /** The diagnostics collection for buildifier lint warnings. */
  private diagnosticsCollection = vscode.languages.createDiagnosticCollection('buildifier');

  /**
   * Initializes a new buildifier diagnostics manager and hooks into workspace
   * and window events so that diagnostics are updated live.
   */
  constructor(private settings: BuildifierSettings, disposables: vscode.Disposable[]) {
    let didChangeTextTimer: NodeJS.Timer | null;

    disposables.push(
      vscode.workspace.onDidChangeTextDocument(e => {
        if (didChangeTextTimer) {
          clearTimeout(didChangeTextTimer);
        }
        didChangeTextTimer = setTimeout(() => {
          this.updateDiagnostics(e.document);
          didChangeTextTimer = null;
        }, DIAGNOSTICS_ON_TYPE_DELAY_MILLIS);
      })
    );

    disposables.push(
      vscode.window.onDidChangeActiveTextEditor(e => {
        if (!e) {
          return;
        }
        this.updateDiagnostics(e.document);
      })
    );

    // If there is an active window at the time the manager is created, make
    // sure its diagnostics are computed.
    if (vscode.window.activeTextEditor) {
      this.updateDiagnostics(vscode.window.activeTextEditor.document);
    }
  }

  /**
   * Updates the diagnostics collection with lint warnings for the given text
   * document.
   *
   * @param document The text document whose diagnostics should be updated.
   */
  public async updateDiagnostics(document: vscode.TextDocument) {
    const cfg = await this.settings.get();
    if (!cfg) {
      return;
    }
    if (!(document.languageId === 'bazel' || document.languageId === 'starlark')) {
      return;
    }

    const warnings = await buildifierLint(
      cfg,
      document.getText(),
      getBuildifierFileType(document.uri.fsPath),
      'warn'
    );

    this.diagnosticsCollection.set(
      document.uri,
      warnings.map(warning => {
        // Buildifier returns 1-based line numbers, but VS Code is 0-based.
        const range = new vscode.Range(
          warning.start.line - 1,
          warning.start.column - 1,
          warning.end.line - 1,
          warning.end.column - 1
        );
        const diagnostic = new vscode.Diagnostic(
          range,
          warning.message,
          vscode.DiagnosticSeverity.Warning
        );
        diagnostic.source = 'buildifier';
        diagnostic.code = warning.category;
        return diagnostic;
      })
    );
  }
}
