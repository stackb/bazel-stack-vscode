import * as vscode from 'vscode';

import { IExtensionFeature, info } from '../common';
import { BazelDocConfiguration, builtInGroups } from './configuration';
import { BazelDocGroupHover } from './hover';

export const BazelDocFeatureName = 'feature.bazeldoc';

export class BazelDocFeature implements IExtensionFeature {
    public readonly name = BazelDocFeatureName;

    private cfg: BazelDocConfiguration | undefined;
    private hover: BazelDocGroupHover | undefined;
    
    async activate(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<any> {
        const cfg = this.cfg = {
            baseUrl: config.get<string>('base-url', 'https://docs.bazel.build/versions/master'),
            verbose: config.get<number>('verbose', 0),
            groups: builtInGroups,
        };

        if (cfg.baseUrl.endsWith('/')) {
            cfg.baseUrl = cfg.baseUrl.slice(0, -1);
        }

        this.hover = new BazelDocGroupHover(cfg);

        if (cfg.verbose > 0) {
            info(this, 'activated.');
        }
    }
    
    public deactivate() {
        if (this.hover) {
            this.hover.dispose();
            delete(this.hover);
        }
        if (this.cfg && this.cfg.verbose > 0) {
            info(this, 'deactivated.');
        }
    }
}
