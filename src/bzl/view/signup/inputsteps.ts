import { InputStep, MultiStepInput } from '../../../multiStepInput';

export interface Step {
    title: string;
    step: number;
    total: number;
    next: Step | undefined;

    run(input: MultiStepInput): Promise<InputStep | void>
}

export class InputSteps {
    protected steps: Step[];

    constructor(
        public title: string,
        public total: number,
    ) {
        this.steps = new Array();
    }

    add(step: Step): void {
        this.steps.push(step);
        step.title = this.title;
        step.step = this.steps.length;
        step.total = this.total;
        if (this.steps.length > 1) {
            this.steps[this.steps.length - 2].next = step;
        }
    }

    run(): Promise<void> {
        const first = this.steps[0];
        return MultiStepInput.run(first.run.bind(first));
    }
}