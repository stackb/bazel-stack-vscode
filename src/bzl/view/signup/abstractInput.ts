import { InputStep, MultiStepInput } from '../../../multiStepInput';
import { Step } from './inputsteps';

export abstract class AbstractInput<T> implements Step {
    public title: string = '';
    public total: number = 0;
    public step: number = 0;
    public next: Step | undefined;
    public value: T | undefined;

    shouldResume(): Promise<boolean> {
        // Required by multiStepInput
        // Could show a notification with the option to resume.
        //eslint-disable-next-line @typescript-eslint/no-empty-function
        return new Promise<boolean>(() => { });
    }

    async run(input: MultiStepInput): Promise<InputStep | undefined> {
        if (await this.runInternal(input)) {
            return this.next?.run.bind(this.next);
        }
        return undefined;
    }

    abstract runInternal(input: MultiStepInput): Promise<boolean>;
}
