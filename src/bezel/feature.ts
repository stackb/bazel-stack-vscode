import * as vscode from "vscode";
import * as getPort from "get-port";

import { IExtensionFeature, info } from "../common";
import { BezelConfiguration, createBezelConfiguration } from "./configuration";
import { newApplicationClient } from "./client/application";
import { ApplicationClient } from "../proto/build/stack/bzl/v1beta1/Application";
import { BzlServeTerminal } from "./terminal";
import { BzlServeProcess } from "./serve";
import { BzlServerStatus } from "./view/status";

export class BezelFeature implements IExtensionFeature {
    public readonly name = "feature.bezel";

    private cfg: BezelConfiguration | undefined;
    private serveTerminal: BzlServeTerminal | undefined;
    private serveProcess: BzlServeProcess | undefined;
    private client: ApplicationClient | undefined;
    private serverStatus: BzlServerStatus | undefined;

    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = await createBezelConfiguration(config);

        if (!cfg.server.grpcAddress) {
            cfg.server.grpcAddress = await getFreePortAddress('localhost');
        }

        this.serveProcess = new BzlServeProcess(cfg.server);
        await this.serveProcess.launch();

        setTimeout(() => this.start(cfg), 500);

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
    }

    async start(cfg: BezelConfiguration) {
        vscode.window.showInformationMessage(`Starting client...`);
        const client = this.client = newApplicationClient(cfg.server.grpcAddress);
        this.serverStatus = new BzlServerStatus(client);
    }

    getClient(cfg: BezelConfiguration) {
        return newApplicationClient(cfg.server.grpcAddress);
    }

    public deactivate() {
        if (this.client) {
            this.client.close();
            delete (this.client);
        }
        if (this.serveTerminal) {
            this.serveTerminal.dispose();
            delete (this.serveTerminal);
        }
        if (this.serveProcess) {
            this.serveProcess.dispose();
            delete (this.serveProcess);
        }
        if (this.serverStatus) {
            this.serverStatus.dispose();
            delete (this.serverStatus);
        }
        if (this.cfg && this.cfg.verbose > 0) {
            info(this, `deactivated.`);
        }
    }
}

async function getFreePortAddress(host: string): Promise<string> {
    const port = await getPort({
        port: 1080,
    });
    return `${host}:${port}`;
}