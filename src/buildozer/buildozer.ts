import * as vscode from 'vscode';
import { RunnableComponent } from '../bezel/status';
import { BuildozerConfiguration } from './configuration';
import { BuildozerSettings } from './settings';
import { InputStep, MultiStepInput } from '../multiStepInput';
import { CommandName } from '../bezel/constants';
import { ExecTask } from '../bezel/bepRunner';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';

export class Buildozer extends RunnableComponent<BuildozerConfiguration> {
  constructor(public readonly settings: BuildozerSettings) {
    super('BDF', settings);

    this.addCommand(CommandName.BuildozerWizard, this.handleBuildozerWizard);
  }

  async startInternal(): Promise<void> {
    // start calls settings such that we discover a configuration error upon
    // startup.
    await this.settings.get();
  }

  async handleBuildozerWizard(): Promise<vscode.TaskExecution | void> {
    const settings = await this.settings.get();

    let wd: string | undefined = undefined;
    let command: string | undefined = undefined;
    let args: string[] = settings.options?.slice() || [];
    let steps: string[][] = [];

    const commandMap = {
      // 'delete': InputStep = async (input) => {
      //   const argstr = await input.showInputBox({
      //     title: 'Command Arguments',
      //     totalSteps: 2,
      //     step: 2,
      //     value: '',
      //     prompt: `${command} TARGET [--options]`,
      //     validate: async (value: string) => { return ''; },
      //     shouldResume: async () => false,
      //   });
      //   args = argstr.split(/\s+/);
      //   return undefined;
      // }
    };


    const pickCommand: InputStep = async (input) => {
      const picked = await input.showQuickPick({
        title: 'Command Name',
        totalSteps: 2,
        step: 1,
        items: Array.from(['delete', 'fixloads']).map(name => { return { label: name }; }),
        placeholder: 'Choose a buildozer command',
        shouldResume: async () => false,
      });
      command = picked.label;
      steps[0] = [command];
      return undefined;
    };

    await MultiStepInput.run(pickCommand);

    if (!command) {
      return;
    }
    args.unshift(command);
    args.unshift(settings.executable!);

    const request: ExecRequest = {
      workingDirectory: wd,
      argv: args,
    };

    return vscode.tasks.executeTask(new ExecTask(request).newTask());
  }

  async stopInternal(): Promise<void> { }
}
