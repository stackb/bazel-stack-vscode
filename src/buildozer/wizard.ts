import * as vscode from 'vscode';
import { BuildozerConfiguration } from './configuration';
import { InputStep, MultiStepInput } from '../multiStepInput';
import { ExecTask } from '../bezel/bepRunner';
import { ExecRequest } from '../proto/build/stack/bezel/v1beta1/ExecRequest';

export class BuildozerWizard {
    constructor(
        private input: MultiStepInput,
        private readonly workspaceDirectory: string,
        private readonly cfg: BuildozerConfiguration,
        private execRequest: ExecRequest = {
            argv: [cfg.executable!, ...(cfg.options?.slice() || [])],
        },
        private command: string = '',
        private totalSteps: number = 3,
        private currentStep: number = 1,
    ) {
    }

    async stepForCommand(name: string): Promise<InputStep | undefined> {
        return undefined;
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

    }

    async pickWorkingDirectory(input: MultiStepInput): Promise<InputStep | undefined> {
        const wd = await input.showInputBox({
            title: 'Working Directory',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            value: '${workspaceDirectory}',
            prompt: 'Working Directory',
            validate: async (value: string) => { return ''; },
            shouldResume: async () => false,
        });
        if (wd === '${workspaceDirectory}') {
            this.execRequest.workingDirectory = this.workspaceDirectory;
        } else {
            this.execRequest.workingDirectory = wd;
        }
        return this.pickCommand(input);
    };

    async pickCommand(input: MultiStepInput): Promise<InputStep | undefined> {
        const picked = await input.showQuickPick({
            title: 'Command Name',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            items: Array.from(['delete', 'fixloads']).map(name => { return { label: name }; }),
            placeholder: 'Choose a buildozer command',
            shouldResume: async () => false,
        });
        this.command = picked.label;
        return this.stepForCommand(this.command);
    };

    async createTask(): Promise<vscode.TaskExecution | void> {
        await this.input.stepThrough(this.pickWorkingDirectory.bind(this));
        return vscode.tasks.executeTask(new ExecTask(this.execRequest).newTask());
    }
}
