// https://github.com/microsoft/vscode-extension-samples/blob/master/quickinput-sample/src/multiStepInput.ts
// LICENSE: https://github.com/microsoft/vscode-extension-samples/blob/master/LICENSE
// https://github.com/launchdarkly/ld-vscode/blob/1955ae9367b062cfd938d1ec87694fa80a282e16/src/configurationMenu.ts

import {
  Disposable,
  InputBox,
  QuickInput,
  QuickInputButton,
  QuickInputButtons,
  QuickPick,
  QuickPickItem,
  window,
} from 'vscode';

export interface VSCodeWindowInputAPI {
  createQuickPick<T extends QuickPickItem>(): QuickPick<T>;
  createInputBox(): InputBox;
}
class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

export type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  items: T[];
  activeItem?: T;
  placeholder: string;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt: string;
  validate: (value: string) => Promise<string | undefined>;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

export class MultiStepInput {
  constructor(private readonly window: VSCodeWindowInputAPI) {
  }

  static async run<T>(start: InputStep): Promise<void> {
    const input = new MultiStepInput(window);
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  public async stepThrough<T>(start: InputStep): Promise<void> {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    placeholder,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>(
        (resolve, reject) => {
          const input = this.window.createQuickPick<T>();
          input.matchOnDescription = true;
          input.matchOnDetail = true;
          input.title = title;
          input.step = step;
          input.totalSteps = totalSteps;
          input.placeholder = placeholder;
          input.items = items;
          if (activeItem) {
            input.activeItems = [activeItem];
          }
          input.buttons = [
            ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
            ...(buttons || []),
          ];
          disposables.push(
            input.onDidTriggerButton(item => {
              if (item === QuickInputButtons.Back) {
                reject(InputFlowAction.back);
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolve(<any>item);
              }
            }),
            input.onDidChangeSelection(selection => resolve(selection[0])),
            input.onDidHide(() => {
              (async () => {
                reject(
                  shouldResume && (await shouldResume())
                    ? InputFlowAction.resume
                    : InputFlowAction.cancel
                );
              })().catch(reject);
            })
          );
          if (this.current) {
            this.current.dispose();
          }
          this.current = input;
          this.current.show();
        }
      );
    } finally {
      disposables.forEach(d => d.dispose());
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>(
        (resolve, reject) => {
          const input = this.window.createInputBox();
          input.title = title;
          input.step = step;
          input.totalSteps = totalSteps;
          input.value = value || '';
          input.prompt = prompt;
          input.buttons = [
            ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
            ...(buttons || []),
          ];
          let validating = validate('');
          disposables.push(
            input.onDidTriggerButton(item => {
              if (item === QuickInputButtons.Back) {
                reject(InputFlowAction.back);
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resolve(<any>item);
              }
            }),
            input.onDidAccept(async () => {
              const val = input.value;
              input.enabled = false;
              input.busy = true;
              if (!(await validate(val))) {
                resolve(val);
              }
              input.enabled = true;
              input.busy = false;
            }),
            input.onDidChangeValue(async text => {
              const current = validate(text);
              validating = current;
              const validationMessage = await current;
              if (current === validating) {
                input.validationMessage = validationMessage;
              }
            }),
            input.onDidHide(() => {
              (async () => {
                reject(
                  shouldResume && (await shouldResume())
                    ? InputFlowAction.resume
                    : InputFlowAction.cancel
                );
              })().catch(reject);
            })
          );
          if (this.current) {
            this.current.dispose();
          }
          this.current = input;
          this.current.show();
        }
      );
    } finally {
      disposables.forEach(d => d.dispose());
    }
  }
}
