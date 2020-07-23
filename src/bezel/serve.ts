import * as vscode from "vscode";
import * as execa from 'execa';

import { ServerConfiguration } from "./configuration";

/**
 * Launches a child process for the bezel server.
 */
export class BzlServeProcess implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private proc: execa.ExecaChildProcess<string> | undefined;

    constructor(
        private cfg: ServerConfiguration
    ) {
    }

    async launch() {
        const http = getHostAndPort(this.cfg.httpAddress); 
        const grpc = getHostAndPort(this.cfg.grpcAddress); 

        const args = this.cfg.command.concat([
            `--grpc_host=${grpc.host}`,
            `--grpc_port=${grpc.port}`,
            `--http_host=${http.host}`,
            `--http_port=${http.port}`
        ]);

        vscode.window.showInformationMessage(`Starting bzl <http://${http.host}:${http.port}> <grpc://${grpc.host}:${grpc.port}>`);
        const proc = this.proc = execa(this.cfg.executable, args);
        if (proc) {
            let _ = proc.stdout?.pipe(process.stdout);
            _ = proc.stderr?.pipe(process.stderr);
        }

        this.proc.then(result => {
            if (result.exitCode) {
                vscode.window.showInformationMessage(`bzl finished with exit code ${result.exitCode}: ${result.stderr}`);
            }
        }).catch(error => {
            vscode.window.showErrorMessage(`could not launch 'bzl ${this.cfg.command}': ${error}`);
        });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        if (this.proc) {
            this.proc.kill('SIGTERM', {
                forceKillAfterTimeout: 1000,
            });
            delete (this.proc);
        }
    }
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