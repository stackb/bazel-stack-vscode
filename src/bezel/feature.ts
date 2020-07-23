import * as vscode from "vscode";
import * as getPort from "get-port";
import * as grpc from '@grpc/grpc-js';

import { IExtensionFeature, info, warn } from "../common";
import { BezelConfiguration } from "./configuration";
import { newApplicationClient } from "./client/application";
import { ApplicationMetadata } from "../proto/build/stack/bzl/v1beta1/ApplicationMetadata";

export class BezelFeature implements IExtensionFeature {
    public readonly name = "feature.bezel";

    private cfg: BezelConfiguration | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>("base-url", "https://docs.bazel.build/versions/master"),
            verbose: config.get<number>("verbose", 0),
            grpcServerAddress: config.get<string>("grpcAddress", ""),
        };

        if (!cfg.grpcServerAddress) {
            cfg.grpcServerAddress = await getFreePortAddress('localhost');
        }

        const client = newApplicationClient(cfg.grpcServerAddress);

        client.getApplicationMetadata({}, new grpc.Metadata(), (err?: grpc.ServiceError, resp?: ApplicationMetadata) => {
            if (err) {
                warn(this, `could not rpc application metadata: ${err}`);
                return;
            }
            info(this, `connected to bezel ${resp?.name} ${resp?.version}`);
        });

        if (cfg.verbose > 0) {
            info(this, `activated.`);
        }
    }
    
    public deactivate() {
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