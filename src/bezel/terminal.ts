import * as vscode from "vscode";
import * as getPort from "get-port";

import { BezelConfiguration } from "./configuration";

/**
 * Launches an integrated terminal for .
 */
export class BzlServeTerminal implements vscode.Disposable {
    private readonly terminalId = "bzl-serve";

    private disposables: vscode.Disposable[] = [];
    private terminal: vscode.Terminal | undefined;

    constructor(
        private cfg: BezelConfiguration
    ) {
    }

    async launch() {
        const httpPort = await getPort();
        const grpcPort = await getPort();
        const args = this.cfg.server.command.concat([
            `--grpc_host=localhost`,
            `--grpc_port=${grpcPort}`,
            `--http_host=localhost`,
            `--http_port=${httpPort}`
        ]);

        const terminal = vscode.window.createTerminal(this.terminalId);
        terminal.sendText(`${this.cfg.server.executable} ${args.join(" ")}`);
        this.disposables.push(terminal);
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        delete (this.terminal);
    }
}
