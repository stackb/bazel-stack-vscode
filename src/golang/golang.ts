import * as vscode from 'vscode';
import { GolangConfiguration } from './configuration';
import { GolangSettings } from './settings';
import { RunnableComponent } from '../bezel/status';
import { CommandName } from '../bezel/constants';
import { GoplsWizard } from './gopls';
import { MultiStepInput } from '../multiStepInput';
import { BazelServer } from '../bezel/bazel';
import path = require('path');

export class Golang extends RunnableComponent<GolangConfiguration> {
  constructor(
    public readonly settings: GolangSettings,
    private storageUri: vscode.Uri,
    private workspaceFolder: vscode.WorkspaceFolder | undefined,
    private bazel: BazelServer,
  ) {
    super('GOL', settings);

    this.addCommand(CommandName.GoplsWizard, this.handleGoplsWizardCommand);
  }

  async handleGoplsWizardCommand() {
    const config = await this.settings.get();
    const info = await this.bazel.getBazelInfo();

    // ---- before ---

    const go = vscode.workspace.getConfiguration('go', this.workspaceFolder);

    let toolsEnvVars = go.get<{ [key: string]: string }>('toolsEnvVars', {})
    let goroot = go.get<string>('goroot', path.join('${output_base}', 'external', config.gopackagesdriver.goSdkWorkspaceName));
    // go.get can actually return undefined?
    if (!goroot) {
      goroot = '';
    }
    if (info?.outputBase) {
      goroot = goroot.replace(info?.outputBase, '${output_base}');
    }

    const wizard = new GoplsWizard(new MultiStepInput(vscode.window));
    wizard.goroot = goroot;

    // ---- run ---

    await wizard.run();

    // ---- after ---

    if (wizard.goroot) {
      await go.update('goroot', goroot);
    }

    await go.update('useLanguageServer', wizard.useLanguageServer);

    // ---- go.toolsEnvVars ---

    if (config.gopackagesdriver.script) {
      toolsEnvVars["GOPACKAGESDRIVER"] = config.gopackagesdriver.script;
      await go.update('toolsEnvVars', toolsEnvVars);
    }

  }

  async startInternal(): Promise<void> {
  }

  async stopInternal(): Promise<void> { }
}
