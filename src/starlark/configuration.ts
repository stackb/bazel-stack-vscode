import * as path from "path";
import * as vscode from "vscode";

/**
 * Configuration for the Starlark LSP feature.
 */
export type StarlarkLSPConfiguration = {
    verbose: number,
    server: ServerConfiguration,
};

export type ServerConfiguration = {
    executable: string,
    command: string[],
};

export async function createStarlarkLSPConfiguration(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<StarlarkLSPConfiguration> {
    const server = {
        executable: config.get<string>("server.executable", ""),
        command: config.get<string[]>("server.command", ["lsp", "starlark"]),
    };

    const cfg = {
        verbose: config.get<number>("verbose", 0),
        server: server,
    };

    if (!server.executable) {
        throw new Error(`starlark.lsp.server.executable not defined.  Please check configuration settings`);
    }

    const modules = config.get<string[]>("server.stardoc.modules");
    if (modules) {
        for (let dirname of modules) {
            if (!path.isAbsolute(dirname)) {
                dirname = ctx.asAbsolutePath(dirname);
            }
            server.command.push(`--stardoc_modules=${dirname}`);
        }
    }

    return cfg;
}
