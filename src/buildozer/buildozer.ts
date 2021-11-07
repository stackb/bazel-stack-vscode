import * as vscode from 'vscode';

import { BuildozerConfiguration } from './configuration';
import { BuildozerSettings } from './settings';
import { BuildozerWizard } from './wizard';
import { CommandName } from '../bezel/constants';
import { MultiStepInput } from '../multiStepInput';
import { LaunchableComponent, LaunchArgs } from '../bezel/status';

export class Buildozer extends LaunchableComponent<BuildozerConfiguration> {
  constructor(public readonly settings: BuildozerSettings) {
    super('BDF', settings, CommandName.BuildozerWizard, 'buildozer');
  }

  async startInternal(): Promise<void> {
    // start calls settings such that we discover a configuration error upon
    // startup.
    await this.settings.get();
  }

  async shouldLaunch(e: Error): Promise<boolean> {
    return false;
  }

  /**
   * @override 
   */
  async launchInternal(): Promise<void> {
    const cfg = await this.settings.get();
  }

  /**
   * getLaunchArgs should return the command line arguments.
   */
  async getLaunchArgs(): Promise<LaunchArgs | undefined> {
    const wizard = new BuildozerWizard(new MultiStepInput(vscode.window));
    await wizard.run();

    const command = wizard.getCommand();
    const targets = wizard.getTargets();
    if (!command) {
      return undefined;
    }
    if (!targets.length) {
      return;
    }

    const settings = await this.settings.get();

    return {
      command: [
        settings.executable!,
        ...(settings.options?.slice() || []),
        "'" + wizard.getCommand() + "'",
        ...wizard.getTargets(),
      ],
      showSuccessfulLaunchTerminal: true,
      showFailedLaunchTerminal: true,
      cwd: wizard.getWorkingDirectory(),
    };

  }

  async stopInternal(): Promise<void> { }
}
