import path = require('path');
import * as vscode from 'vscode';
import { CommandCodeLensProvider, ICommandCodeLensProviderRegistry } from '../api';
import { IExtensionFeature } from '../common';
import { BazelrcCodelens, RunContext } from './codelens';
import { BazelCommands, createBazelrcConfiguration } from './configuration';
import { CommandName } from './constants';
import { BazelFlagSupport } from './flags';

export const BazelrcFeatureName = 'bsv.bazelrc';

export class BazelrcFeature implements IExtensionFeature, vscode.Disposable {
    public readonly name = BazelrcFeatureName;

    private disposables: vscode.Disposable[] = [];

    constructor(
        private commandCodelensProviderRegistry: ICommandCodeLensProviderRegistry,
    ) {
    }

    async activate(
        ctx: vscode.ExtensionContext,
        config: vscode.WorkspaceConfiguration): Promise<any> {

        const cfg = await createBazelrcConfiguration(ctx, config);
        registerBazelCommandCodeLensProviders(this.commandCodelensProviderRegistry, cfg.run.executable);

        const codelens = new BazelrcCodelens(cfg.run.executable, this.commandCodelensProviderRegistry);
        this.disposables.push(codelens);
        await codelens.setup();

        const flags = new BazelFlagSupport(cfg.flag);
        this.disposables.push(flags);
        await flags.load();
    }

    public deactivate() {
        this.dispose();
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}

export class BazelCommandCodeLensProvider implements CommandCodeLensProvider {
    constructor(
        private bazelExecutable: string,
    ) {}

    async provideCommandCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken,
        lineNum: number,
        colNum: number,
        command: string,
        args: string[],
    ): Promise<vscode.CodeLens[] | undefined> {
        const cwd = path.dirname(document.uri.fsPath); 
        
        const range = new vscode.Range(
            new vscode.Position(lineNum, colNum),
            new vscode.Position(lineNum, colNum + command.length));

        const lenses: vscode.CodeLens[] = [];

        lenses.push(new vscode.CodeLens(range, createRunCommand({
            cwd: cwd,
            executable: this.bazelExecutable,
            command: command,
            args: args,
        })));

        if (command === 'build' || command === 'test') {
            lenses.push(new vscode.CodeLens(range, createDebugCommand({
                cwd: cwd,
                executable: this.bazelExecutable,
                command: command,
                args: args,
            })));
        }

        return lenses;
    }
}

/**
 * Creates a Command from the given run context object.
 * 
 * @param runCtx 
 */
function createRunCommand(runCtx: RunContext): vscode.Command {
    return {
        arguments: [runCtx],
        command: CommandName.RunCommand,
        title: runCtx.command,
        tooltip: `${runCtx.command} ${runCtx.args.join(' ')}`,
    };
}


/**
 * Creates a Command from the given run context object for debugging.
 * 
 * @param runCtx 
 */
function createDebugCommand(runCtx: RunContext): vscode.Command {
    return {
        arguments: [runCtx],
        command: CommandName.DebugCommand,
        title: 'debug',
        tooltip: `(starlark debug) ${runCtx.command} ${runCtx.args.join(' ')}`,
    };
}

export function registerBazelCommandCodeLensProviders(registry: ICommandCodeLensProviderRegistry, bazelExecutable: string) {
    const provider = new BazelCommandCodeLensProvider(bazelExecutable);
    BazelCommands.forEach(command => {
        registry.registerCommandCodeLensProvider(command, provider);
    });
}
