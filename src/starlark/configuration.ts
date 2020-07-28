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

    const mods: any = config.get<Object>("server.stardoc.modules");
    if (mods) {
        for (const label of Object.keys(mods)) {
            const relname = mods[label];
            const filename = ctx.asAbsolutePath(relname);
            server.command.push(`--stardoc_module=${label}=${filename}`);
        }
    }

    return cfg;
}
