import * as path from 'path';
import * as vscode from 'vscode';

/**
 * Configuration for the Starlark LSP feature.
 */
export type StarlarkLSPConfiguration = {
    verbose: number,
    server: ServerConfiguration,
};

export type ServerConfiguration = {
    owner: string,
    repo: string,
    releaseTag: string,
    executable: string,
    command: string[],
};

export async function createStarlarkLSPConfiguration(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<StarlarkLSPConfiguration> {
    const server = {
        owner: config.get<string>('server.github-owner', 'stackb'),
        repo: config.get<string>('server.github-repo', 'bazel-stack-vscode'),
        releaseTag: config.get<string>('github-release', '0.3.5'),
        executable: config.get<string>('server.executable', ''),
        command: config.get<string[]>('server.command', ['lsp', 'starlark']),
    };

    const cfg = {
        verbose: config.get<number>('verbose', 0),
        server: server,
    };

    let modules: any = config.get<Object>('server.stardoc.moduleinfo');
    if (modules) {
        for (const label of Object.keys(modules)) {
            const filenames = modules[label];
            if (!Array.isArray(filenames)) {
                throw new Error(
                    'starlark.lsp.server.stardoc.moduleinfo must be an object; '+
                    'keys are either bazel labels OR language string; '+
                    'values must be list of files');
            }
            for (let filename of filenames) {
                if (!path.isAbsolute(filename)) {
                    filename = ctx.asAbsolutePath(filename);
                }    
                server.command.push(`--module=${label}=${filename}`);
            }
        }
    }

    return cfg;
}
