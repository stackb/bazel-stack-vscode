import * as vscode from 'vscode';
import { Reconfigurable } from '../reconfigurable';
import { BazelFlagSupport } from './flags';

export const BazelrcFeatureName = 'bsv.bazelrc';

export class BazelrcFeature extends Reconfigurable<void> {
  constructor() {
    super(BazelrcFeatureName);
    this.add(new BazelFlagSupport(this.onDidConfigurationChange.event));
  }

  async configure(config: vscode.WorkspaceConfiguration): Promise<void> {
    return;
  }
}
