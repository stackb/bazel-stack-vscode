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
    private workspaceFolder: vscode.Uri,
  ) {
    super('BAZ', settings, CommandName.LaunchBazelServer, 'bazel');
    // bzl.onDidChangeStatus(this.handleBzlChangeStatus, this, this.disposables);
  }

  // async handleBzlChangeStatus(status: Status) {
  //   const cfg = await this.settings.get();
  //   if (!cfg.enabled) {
  //     return;
  //   }

  //   // If we are disabled, re-reenable if any other bzl status.
  //   if (this.status === Status.DISABLED && status !== Status.DISABLED) {
  //     this.setDisabled(false);
  //   }

  //   switch (status) {
  //     // Disable if upstream is disabled
  //     case Status.DISABLED:
  //       this.setDisabled(true);
  //       break;
  //     // If launching, follow that.
  //     case Status.LAUNCHING:
  //       this.setStatus(status);
  //       break;
  //     case Status.ERROR:
  //       this.setError(new Error(this.bzl.statusErrorMessage));
  //       break;
  //     default:
  //       this.restart();
  //       break;
  //   }
  // }

  async startInternal(): Promise<void> {
    try {
      this.setStatus(Status.STARTING);
      this.workspaceUri = await findWorkspaceFile(this.workspaceFolder.fsPath);
      if (!this.workspaceUri) {
        throw new Error(`WORKSPACE file not found`);
      }
      this.setStatus(Status.READY);
    } catch (e) {
      this.setError(e);
    }
  }

  async stopInternal(): Promise<void> {
    this.setStatus(Status.STOPPED);
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
      noHideOnReady: true,
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
  const file = await findUp('WORKSPACE', { cwd });
  if (!file) {
    return;
  }
  return vscode.Uri.file(path.dirname(file));
}