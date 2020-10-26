import * as path from 'path';
import * as vscode from 'vscode';
import { ConfigSection } from './constants';

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
        owner: config.get<string>(ConfigSection.LspServerGithubOwner, 'stackb'),
        repo: config.get<string>(ConfigSection.LspServerGithubRepo, 'bzl'),
        releaseTag: config.get<string>(ConfigSection.LspServerGithubRelease, '0.9.4'),
        executable: config.get<string>(ConfigSection.LspServerExecutable, ''),
        command: config.get<string[]>(ConfigSection.LspServerCommand, ['lsp', 'serve']),
    };

    const cfg = {
        verbose: config.get<number>(ConfigSection.Verbose, 0),
        server: server,
    };

    let modules: any = config.get<Object>(ConfigSection.ServerStardocModuleinfo);
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
