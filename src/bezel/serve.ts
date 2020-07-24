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
        vscode.window.showInformationMessage(`Starting bzl <http://${this.cfg.httpAddress}> <grpc://${this.cfg.grpcAddress}>`);
        const proc = this.proc = execa(this.cfg.executable, this.cfg.command);
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
