import { InputStep, MultiStepInput } from '../multiStepInput';
import { ThemeIconCheck, ThemeIconClose } from '../bezel/constants';

export class GoplsWizard {
    private totalSteps: number = 3;
    private currentStep: number = 1;
    private targets: string[] = [];
    private command: string = '';
    private commandArgs: string[] = [];

    constructor(
        private readonly input: MultiStepInput,
        public goroot: string = '${output_base}/external/go_sdk',
        public useLanguageServer: boolean = true,
    ) {
    }

    getTargets(): string[] {
        return this.targets;
    }

    getCommand(): string {
        return [this.command, ...this.commandArgs].join(' ');
    }

    async run(): Promise<void> {
        return this.input.stepThrough(this.pickUseGopls.bind(this));
    }

    async pickGoroot(input: MultiStepInput): Promise<InputStep | undefined> {
        const wd = await input.showInputBox({
            title: 'gopls: GOROOT',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            value: this.goroot,
            prompt: 'Location of GOROOT',
            validate: async (value: string) => { return ''; },
            shouldResume: async () => false,
        });
        this.goroot = wd;
        return;
    }

    async pickUseGopls(input: MultiStepInput): Promise<InputStep | undefined> {
        const picked = await input.showQuickPick({
            title: 'gopls',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            items: [{ label: 'yes' }, { label: 'no' }],
            placeholder: 'Use the gopls language server?',
            validate: async (value: string) => { return value == 'yes' || value == 'no'; },
            shouldResume: async () => false,
        });
        this.useLanguageServer = picked.label === 'yes';
        if (!this.useLanguageServer) {
            return;
        }
        return this.pickGoroot(input);
    }

}
