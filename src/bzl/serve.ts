import * as execa from 'execa';
import * as vscode from "vscode";
import { BzlGrpcServerConfiguration } from "./configuration";


/**
 * Launches a child process for the bezel server.
 */
export class BzlServeProcess implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private proc: execa.ExecaChildProcess<string> | undefined;
    private out: vscode.OutputChannel;

    constructor(
        private cfg: BzlGrpcServerConfiguration
    ) {
        this.out = vscode.window.createOutputChannel("Bzl");
        this.disposables.push(this.out);
    }

    start() {
        this.out.show();
        const root = vscode.workspace.rootPath;
        // vscode.window.showInformationMessage(`Starting bzl <grpc://${this.cfg.address}>`);
        const proc = this.proc = execa(this.cfg.executable, this.cfg.command, {
            cwd: root,
        });
        if (proc) {
            proc.stdout?.on('data', chunk => {
                const chunkAsString = typeof chunk === 'string' ? chunk : chunk.toString();
                this.out.append(chunkAsString);        
            });
            proc.stdout?.on('error', err => {
                this.out.appendLine(`error: ${JSON.stringify(err)}`);
            });
            proc.stdout?.on('exit', (code, signal) => {
                this.out.appendLine(`exit: ${JSON.stringify({ code, signal })}`);
            });
            proc.stdout?.on('close', (code: any, signal: any) => {
                this.out.appendLine(`close: ${JSON.stringify({ code, signal })}`);
            });
            proc.stderr?.on('data', chunk => {
                const chunkAsString = typeof chunk === 'string' ? chunk : chunk.toString();
                this.out.append(chunkAsString);        
            });
            proc.stderr?.on('error', err => {
                this.out.appendLine(`error: ${JSON.stringify(err)}`);
            });
            proc.stderr?.on('exit', (code, signal) => {
                this.out.appendLine(`exit: ${JSON.stringify({ code, signal })}`);
            });
            proc.stderr?.on('close', (code: any, signal: any) => {
                this.out.appendLine(`close: ${JSON.stringify({ code, signal })}`);
            });
        }

        this.proc.then((result: any) => {
            if (result.exitCode) {
                vscode.window.showInformationMessage(`bzl finished with exit code ${result.exitCode}: ${result.stderr}`);
            }
        }).catch((error: Error) => {
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
