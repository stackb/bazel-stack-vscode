import * as vscode from "vscode";
import * as getPort from "get-port";

import { IExtensionFeature, info } from "../common";
import { BezelConfiguration } from "./configuration";
import { newApplicationClient } from "./client/application";

export class BezelFeature implements IExtensionFeature {
    public readonly name = "feature.bezel";

    private cfg: BezelConfiguration | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
            verbose: config.get<number>("verbose", 0),
            grpcAddress: config.get<string>("grpcAddress", ""),
        };

        if (!cfg.grpcAddress) {
            cfg.grpcAddress = await getFreePortAddress('localhost');
        }

        const client = newApplicationClient(cfg.grpcAddress);
        console.log(`client: ${client}`);
        // client.getApplicationMetadata({}, (err: any, resp: any) => {
        //     if (err) {
        //         warn(this, `could not get application metadata: ${err}`);
        //         return;
        //     }
        //     info(this, `connected to bezel ${resp.message}`);
        // });

        // this.hover = new BezelGroupHover(cfg);

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
    }
    
    public deactivate() {
        // if (this.hover) {
        //     this.hover.dispose();
        //     delete(this.hover);
        // }
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