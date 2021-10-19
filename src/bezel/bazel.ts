import * as vscode from 'vscode';
import findUp = require('find-up');
import { BazelConfiguration, BazelSettings } from './configuration';
import { LaunchableComponent, LaunchArgs, Status } from './status';
import { BazelInfo, Bzl } from './bzl';
import { CommandName } from './constants';
import path = require('path');

export class BazelServer extends LaunchableComponent<BazelConfiguration> {
  private info: BazelInfo | undefined;
  private workspaceUri: vscode.Uri | undefined;

  constructor(
    public readonly settings: BazelSettings,
    public readonly bzl: Bzl,
    private workspaceFolder: vscode.Uri
  ) {
    super('BAZ', settings, CommandName.LaunchBazelServer, 'bazel');
  }

  async shouldLaunch(e: Error): Promise<boolean> {
    return false;
  }

  async launchInternal(): Promise<void> {
    this.workspaceUri = await findWorkspaceFile(this.workspaceFolder.fsPath);
    if (!this.workspaceUri) {
      throw new Error('WORKSPACE file not found');
    }
  }

  async getBazelInfo(): Promise<BazelInfo | undefined> {
    if (this.info) {
      return this.info;
    }
    if (!this.workspaceUri) {
      return;
    }
    if (this.bzl.status !== Status.READY) {
      return;
    }
    this.info = await this.bzl.getBazelInfo();
    return this.info;
  }

  async getLaunchArgs(): Promise<LaunchArgs> {
    const cfg = await this.settings.get();
    return {
      command: [cfg.executable || 'bazel'],
      showSuccessfulLaunchTerminal: true,
      showFailedLaunchTerminal: true,
    };
  }

  async runInBazelTerminal(args: string[]) {
    if (this.status !== Status.READY) {
      return;
    }
    return this.handleCommandLaunch(args);
  }
}

async function findWorkspaceFile(cwd: string): Promise<vscode.Uri | undefined> {
  try {
    const file = await findUp(['WORKSPACE', 'WORKSPACE.bazel'], { cwd });
    if (file) {
      return vscode.Uri.file(path.dirname(file));
    }
  } catch (_) {
  }
}
