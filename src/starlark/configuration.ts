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

export async function createStarlarkLSPConfiguration(config: vscode.WorkspaceConfiguration): Promise<StarlarkLSPConfiguration> {
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

    return cfg;
}
