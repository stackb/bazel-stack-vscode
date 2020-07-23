import * as vscode from "vscode";
import getPort = require("get-port");

/**
 * Configuration for the Bezel feature.
 */
export type BezelConfiguration = {
    baseUrl: string,
    verbose: number,
    server: ServerConfiguration,
};

export type ServerConfiguration = {
    httpAddress: string,
    grpcAddress: string,
    launch: boolean,
    executable: string,
    command: string[],
};

export async function createBezelConfiguration(config: vscode.WorkspaceConfiguration): Promise<BezelConfiguration> {
    const cfg = {
        baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
        verbose: config.get<number>("verbose", 0),
        server: {
            executable: config.get<string>("server.executable", ""),
            launch: config.get<boolean>("server.launch", true),
            command: config.get<string[]>("server.command", ["serve"]),
            httpAddress: config.get<string>("server.http.address", ""),
            grpcAddress: config.get<string>("server.http.address", ""),
        },
    };

    if (cfg.server.launch) {
        if (!cfg.server.httpAddress) {
            cfg.server.httpAddress = `localhost:${await getPort()}`;
        }
        if (!cfg.server.grpcAddress) {
            cfg.server.grpcAddress = `localhost:${await getPort()}`;
        }    
    }

    if (!cfg.server.executable) {
        throw new Error(`bzl.bezel.server.executable not defined.  Please check configuration settings`);
    }

    return cfg;
}