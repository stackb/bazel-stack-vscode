import * as vscode from 'vscode';
import { ConfigSection } from './constants';
import { BazelDocConfiguration, builtInGroups } from './configuration';
// import { BazelDocGroupHover } from './hover';
import { Reconfigurable } from '../reconfigurable';

export const BazelDocFeatureName = 'bsv.bazeldoc';

export class BazelDocFeature extends Reconfigurable<BazelDocConfiguration> {
  constructor() {
    super(BazelDocFeatureName);

    //this.add(new BazelDocGroupHover(this.onDidConfigurationChange.event));
  }

  protected async configure(config: vscode.WorkspaceConfiguration): Promise<BazelDocConfiguration> {
    const cfg = {
      baseUrl: config.get<string>(
        ConfigSection.BaseURL,
        'https://docs.bazel.build/versions/master'
      ),
      groups: builtInGroups,
    };
    if (cfg.baseUrl.endsWith('/')) {
      cfg.baseUrl = cfg.baseUrl.slice(0, -1);
    }
    return cfg;
  }
}
