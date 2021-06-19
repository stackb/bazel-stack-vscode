import * as vscode from 'vscode';

export const FeatureName = 'bzl';

export enum ViewName {
    Repository = 'bsv.bzl.repository',
    Package = 'bsv.bzl.package',
    Workspace = 'bsv.bzl.workspace',
    BEP = 'bsv.bzl.bep',
    Server = 'bsv.bzl.server',
    Account = 'bsv.bzl.account',
    History = 'bsv.bzl.history',
}

export enum Help {
    Repository = 'repository',
    Package = 'package',
    Workspace = 'workspace',
}

export enum ConfigSection {
    LicenseToken = 'license.token',
    LicenseProto = 'license.proto',
    AccountsAddress = 'accounts.address',
    OAuthGithubRelay = 'oauth.github.relay',
    AuthProto = 'auth.proto',
    NucleateProto = 'nucleate.proto',
    ServerProto = 'server.proto',
    ServerAddress = 'server.address',
    ServerDownloadBaseUrl = 'server.downloadBaseUrl',
    ServerGithubRelease = 'server.release',
    ServerExecutable = 'server.executable',
    ServerCommand = 'server.command',
    ServerRemotes = 'server.remotes',
    BuildEventStreamProto = 'build_event_stream.proto',
    BazelExecutable = 'bazel.executable',
    BazelVersion = 'bazel.version',
    ProblemMatchers = 'problemMatchers',
    Verbose = 'verbose',
    CodesearchProto = 'codesearch.proto',
    LivegrepProto = 'livegrep.proto',
    CodesearchDefaultQuery = 'codesearch.default.query',
}

export const ServerBinaryName = 'bzl';

export enum Server {
    BinaryName = 'bzl',
    Description = 'Bzl Server',
    LicenseTokenFlag = '--license_token',
    AddressFlag = '--address',
}

export enum CommandName {
    RefreshSuffix = '.refresh',
    BEPActionStderr = 'bsv.bzl.bep.action.stderr',
    BEPActionStdout = 'bsv.bzl.bep.action.stdout',
    BEPActionOutput = 'bsv.bzl.bep.event.output',
    BEPStartedExplore = 'bsv.bzl.bep.started.explore',
    BEPFileDownload = 'bsv.bzl.bep.file.download',
    BEPFileSave = 'bsv.bzl.bep.file.save',
    BEPFileClippy = 'bsv.bzl.bep.file.clippy',

    RepositoryExplore = 'bsv.bzl.repository.explore',
    RepositorySelect = 'bsv.bzl.repository.select',
    RepositoryOpenTerminal = 'bsv.bzl.repository.openTerminal',

    WorkspaceSelect = 'bsv.bzl.workspace.select',
    WorkspaceExplore = 'bsv.bzl.workspace.explore',
    WorkspaceOpenTerminal = 'bsv.bzl.workspace.openTerminal',

    PackageSelect = 'bsv.bzl.package.select',
    PackageExplore = 'bsv.bzl.package.explore',
    PackageBuildAll = 'bsv.bzl.package.allBuild',
    PackageTestAll = 'bsv.bzl.package.allTest',
    PackageRun = 'bsv.bzl.package.run',
    PackageCopyLabel = 'bsv.bzl.package.copyLabel',
    PackageGoToTarget = 'bsv.bzl.package.goToTarget',

    HistorySelect = 'bsv.bzl.history.select',
    HistoryExplore = 'bsv.bzl.history.explore',
    HistoryRun = 'bsv.bzl.history.run',
    HistoryDelete = 'bsv.bzl.history.delete',
    HistoryAdd = 'bsv.bzl.history.add',

    ServerCopyFlag = 'bsv.bzl.server.copyFlag',
    ServerResultExplore = 'bsv.bzl.server.bes_results.explore',
    ServerAddServer = 'bsv.bzl.server.add',
    ServerRestart = 'bsv.bzl.server.restart',
    ServerShutdown = 'bsv.bzl.server.shutdown',
    ServerSelect = 'bsv.bzl.server.select',
    ServerExplore = 'bsv.bzl.server.explore',

    SignupStart = 'bsv.bzl.signup.start',
    SignupGetStarted = 'bsv.bzl.signup.getStarted',
    SignupGithub = 'bsv.bzl.signup.github',
    SignupGithubOAuth = 'bsv.bzl.signup.github.oauth',
    SignupRegister = 'bsv.bzl.signup.register',
    SignupLogin = 'bsv.bzl.signup.login',
    SignupResetPassword = 'bsv.bzl.signup.resetPassword',
    SignupPlan = 'bsv.bzl.signup.plan',
    SignupPayment = 'bsv.bzl.signup.payment',
    SignupConfirm = 'bsv.bzl.signup.confirm',
    SignupManual = 'bsv.bzl.signup.manual',
    SignupAuto = 'bsv.bzl.signup.auto',

    CodeSearchIndex = 'bzv.bzl.codesearch.index',
    CodeSearchSearch = 'bzv.bzl.codesearch.search',

    BazelExplorer = 'workbench.view.extension.bazel-explorer',
    OpenSetting = 'bsv.openExtensionSetting',
}

export enum ButtonName {
    Reveal = 'Reveal',
    Yes = 'Yes',
    NoThanks = 'No Thanks',
}

export enum MatcherName {
    /**
     * The name of the problem matcher to apply to all bazel run tasks.  Hardcoded
     * and in this extensions' problemMatcher list.
     */
    Bazel = 'bazel',
}

export enum DiagnosticCollectionName {
    Bazel = 'bazel'
}

export enum AccountItemName {
    ID = 'ID',
    Name = 'Name',
    Email = 'Email',
    Subscription = 'Subscription',
    Exp = 'Exp',
}

export enum FileName {
    LaunchBazelrc = 'launch.bazelrc',
    HelpDir = 'help',
    BUILD = 'BUILD',
    BUILDBazel = 'BUILD.bazel',
    WORKSPACE = 'WORKSPACE',
    WORKSPACEBazel = 'WORKSPACE.bazel',
    LicenseKey = 'license.key',
    BzlHome = '.bzl',
}

export const ThemeIconCircleOutline = new vscode.ThemeIcon('circle-outline');
export const ThemeIconCloudDownload = new vscode.ThemeIcon('cloud-download');
export const ThemeIconDebugContinue = new vscode.ThemeIcon('debug-continue');
export const ThemeIconDebugStackframe = new vscode.ThemeIcon('debug-stackframe');
export const ThemeIconDebugStackframeActive = new vscode.ThemeIcon('debug-stackframe-active');
export const ThemeIconDebugStackframeFocused = new vscode.ThemeIcon('debug-stackframe-focused');
export const ThemeIconDebugStart = new vscode.ThemeIcon('debug-start');
export const ThemeIconQuestion = new vscode.ThemeIcon('question');
export const ThemeIconReport = new vscode.ThemeIcon('report');
export const ThemeIconSymbolEvent = new vscode.ThemeIcon('symbol-event');
export const ThemeIconSymbolInterface = new vscode.ThemeIcon('symbol-interface');
export const ThemeIconVerified = new vscode.ThemeIcon('verified');
export const ThemeIconReload = new vscode.ThemeIcon('reload');
export const ThemeIconInfo = new vscode.ThemeIcon('info');

export enum ContextValue {
    ProblemFile = 'problem-file',
    ProblemFileMarker = 'problem-file-marker',
    History = 'history',
    Package = 'package',
    Repository = 'repository',
    ExternalWorkspace = 'external-workspace',
    DefaultWorkspace = 'default-workspace',
    Server = 'server',
    Metadata = 'metadata',
}

export function ruleClassIconUri(ruleClass: string): vscode.Uri {
    return vscode.Uri.parse(`https://bzl.io/v1/image/rule/${ruleClass}.svg`);
}