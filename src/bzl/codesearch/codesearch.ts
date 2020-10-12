import * as vscode from 'vscode';
import { ICommandCodeLensProviderRegistry } from '../../api';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { BzlClient } from '../bzlclient';
import { BzlServerConfiguration } from '../configuration';
import { CodeSearchCodeLens } from './codelens';

export class CodeSearch implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor(
        commandCodeLensProviderRegistry: ICommandCodeLensProviderRegistry,
        cfg: BzlServerConfiguration,
        workspaceChanged: vscode.Event<Workspace | undefined>,
        onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        const codeSearchCodeLens = new CodeSearchCodeLens(workspaceChanged, onDidChangeBzlClient);
        this.disposables.push(codeSearchCodeLens);
        this.disposables.push(
            commandCodeLensProviderRegistry.registerCommandCodeLensProvider(
                'codesearch', codeSearchCodeLens));
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
