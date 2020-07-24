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
    const server = {
        executable: config.get<string>("server.executable", ""),
        launch: config.get<boolean>("server.launch", true),
        command: config.get<string[]>("server.command", ["serve"]),
        httpAddress: config.get<string>("server.http.address", ""),
        grpcAddress: config.get<string>("server.http.address", ""),
    };

    const cfg = {
        baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
        verbose: config.get<number>("verbose", 0),
        server: server,
    };

    if (!server.executable) {
        throw new Error(`bzl.bezel.server.executable not defined.  Please check configuration settings`);
    }

    if (server.launch) {
        if (!server.httpAddress) {
            server.httpAddress = `localhost:${await getPort()}`;
        }
        if (!server.grpcAddress) {
            server.grpcAddress = `localhost:${await getPort()}`;
        }
    }

    const hp = getHostAndPort(server.httpAddress);
    const gp = getHostAndPort(server.grpcAddress);

    server.command.push(`--grpc_host=${gp.host}`);
    server.command.push(`--grpc_port=${gp.port}`);
    server.command.push(`--http_host=${hp.host}`);
    server.command.push(`--http_port=${hp.port}`);

    return cfg;
}

type HostAndPort = {
    host: string,
    port: number,
};

function getHostAndPort(address: string): HostAndPort {
    const colon = address.indexOf(":");
    if (colon < 0 || colon === address.length) {
        throw new Error(`malformed address: want HOST:PORT, got "${address}"`);
    }
    return {
        host: address.slice(0, colon),
        port: parseInt(address.slice(colon + 1), 10),
    };
} 