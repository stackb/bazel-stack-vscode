import * as vscode from 'vscode';
import { ConfigurationContext } from '../common';
import { Reconfigurable } from '../reconfigurable';
import { BazelFlagSupport } from './flags';

export const BazelrcFeatureName = 'bsv.bazelrc';

export class BazelrcFeature extends Reconfigurable<void> {
  constructor(configCtx: ConfigurationContext) {
    super(BazelrcFeatureName);
    this.add(new BazelFlagSupport(configCtx, this.onDidConfigurationChange.event));
  }

  async configure(config: vscode.WorkspaceConfiguration): Promise<void> {
    return;
  }
}
