import * as vscode from 'vscode';
import { flatten } from 'vscode-common/out/arrays';
import { LabelKind } from '../proto/build/stack/bezel/v1beta1/LabelKind';
import { CommandName } from './constants';
import { BezelLSPClient, LabelKindRange } from './lsp';

/**
 * CodelensProvider for Bazel Commands.
 */
export class BazelCodelensProvider implements vscode.Disposable, vscode.CodeLensProvider {
    private disposables: vscode.Disposable[] = [];

    private client: BezelLSPClient | undefined;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor(
        onDidChangeClient: vscode.Event<BezelLSPClient>,
    ) {
        onDidChangeClient(this.handleClientChange, this, this.disposables);

        vscode.languages.registerCodeLensProvider("bazel", this);
    }

    private handleClientChange(client: BezelLSPClient) {
        this.client = client;
    }

    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        if (!this.client) {
            return [];
        }
        const labelKinds = await this.client.getLabelKindsInDocument(document.uri);
        return flatten(labelKinds.map(lk => this.createCodeLensesForLabelKind(lk)));
    }

    private createCodeLensesForLabelKind(labelKind: LabelKindRange): vscode.CodeLens[] {

        const lenses: vscode.CodeLens[] = [];

        lenses.push(
            this.labelKindLens(labelKind, '', 'Copy to Clipboard', CommandName.CopyToClipboard),
            this.labelKindLens(labelKind, 'build', 'Build label via shell terminal', CommandName.Build),
            this.labelKindLens(labelKind, 'build+events', 'Build label with build event protocol', CommandName.BuildEvents),
        );

        if (labelKind.label.Name.endsWith('_test')) {
            lenses.push(
                this.labelKindLens(labelKind, 'test', 'Build label via shell terminal', CommandName.Test),
                this.labelKindLens(labelKind, 'test+events', 'Build label with build event protocol', CommandName.TestEvents),
            );
        }

        lenses.push(
            this.labelKindLens(labelKind, 'debug', 'Start starlark debug server and debug CLI client', CommandName.Test),
            this.labelKindLens(labelKind, 'search', 'Codesearch all transitive source files for this label', CommandName.Codesearch),
        );

        return lenses;
    }

    private labelKindLens(labelKind: LabelKindRange, title: string, tooltip: string, command: string): vscode.CodeLens {
        const repo = labelKind.label.Repo ? '@' + labelKind.label.Repo : '';
        const label = `${repo}//${labelKind.label.Pkg}:${labelKind.label.Name}`;
        if (!title) {
            title = label;
        }
        return new vscode.CodeLens(labelKind.range, {
            title: title,
            tooltip: tooltip,
            command: command,
            arguments: [label],
        })
    }

    // public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
    //     codeLens.command = {
    //         title: "Codelens provided by sample extension",
    //         tooltip: "Tooltip provided by sample extension",
    //         command: "codelens-sample.codelensAction",
    //         arguments: ["Argument 1", false]
    //     };
    //         return codeLens;
    //     }
    //     return null;
    // }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
