import * as vscode from 'vscode';

export const ExtensionID = 'stackbuild.bazel-stack-vscode';
export const ExtensionName = 'bazel-stack-vscode';
export const AIKey = '7193a682-d12f-49a5-a515-ef00ab3f0992';

export enum Telemetry {
  ExtensionActivate = 'ext.activate',
  ExtensionDeactivate = 'ext.deactivate',
  FeatureActivate = 'feature.activate',
  FeatureDeactivate = 'feature.deactivate',
  SignupStart = 'signup.start',
  SignupAuto = 'signup.auto',
  SignupManual = 'signup.manual',
  SignupGithub = 'signup.github',
  SignupEmail = 'signup.email',
  SignupLogin = 'signup.login',
  SignupRegister = 'signup.register',
  SignupResetPassword = 'signup.resetPassword',
  SignupRenew = 'signup.renew',
  SignupPlanList = 'signup.plan.list',
  SignupPlanSelect = 'signup.plan.select',
  SignupPayment = 'signup.payment',
  SignupConfirm = 'signup.confirm',
  SignupSuccess = 'signup.success',
  SignupError = 'signup.error',
  BzlRunTask = 'bzl.runTask',
  LicenseRenewSuccess = 'license.renew.success',
  LicenseRenewFailed = 'license.renew.failed',

  BzlWorkspaceList = 'bzl.workspace.list',
  BzlRepositoryList = 'bzl.workspace.list',
  BzlPackageList = 'bzl.workspace.list',
  BzlEventBuildStarted = 'bzl.event.started',
}

export enum BuiltInCommands {
  SetContext = 'setContext',
  ClosePanel = 'workbench.action.closePanel',
  MarkdownPreview = 'markdown.showPreview',
  Open = 'vscode.open',
  OpenFolder = 'vscode.openFolder',
  OpenSettings = 'workbench.action.openSettings',
  RevealFileInOS = 'revealFileInOS',
}

export enum FeatureName {
  BazelDoc = 'bsv.bazeldoc',
}

export function setCommandContext(key: string, value: any) {
  return vscode.commands.executeCommand(BuiltInCommands.SetContext, key, value);
}
