import * as vscode from 'vscode';

/**
 * Configuration for the Bazelrc feature.
 */
export type BazelrcConfiguration = {
    verbose: number,
    run: RunConfiguration,
    flag: FlagConfiguration,
};

/**
 * Configuration for the FlagInfo.
 */
export type FlagConfiguration = {
    // filename of the bazel.flaginfo file.
    infofile: string,
    // filename of the bazel_flags.proto file.
    protofile: string,
};

/**
 * Configuration for the Bazelrc run feature.
 */
export type RunConfiguration = {
    executable: string,
};

export async function createBazelrcConfiguration(ctx: vscode.ExtensionContext, config: vscode.WorkspaceConfiguration): Promise<BazelrcConfiguration> {
    const flag = {
        // these are not documented in the package.json but could be overriden if necessary.
        infofile: config.get<string>('flag.info', './flaginfo/bazel.flaginfo'),
        protofile: config.get<string>('flag.proto', './proto/bazel_flags.proto'),
    };
    if (flag.infofile.startsWith('./')) {
        flag.infofile = ctx.asAbsolutePath(flag.infofile);
    }
    if (flag.protofile.startsWith('./')) {
        flag.protofile = ctx.asAbsolutePath(flag.protofile);
    }
    const run = {
        executable: config.get<string>('run.executable', 'bazel'),
    };
    const cfg = {
        verbose: config.get<number>('verbose', 0),
        run: run,
        flag: flag,
    };
    return cfg;
}

/**
 * Returns true if the argument is a valid bazel command name.
 * 
 * @param token the token to check
 */
export function isBazelCommand(token: string): boolean {
    switch (token) {
        case 'analyze-profile':
        case 'aquery':
        case 'build':
        case 'canonicalize-flags':
        case 'clean':
        case 'config':
        case 'coverage':
        case 'cquery':
        case 'dump':
        case 'fetch':
        case 'help':
        case 'info':
        case 'license':
        case 'mobile-install':
        case 'print_action':
        case 'query':
        case 'run':
        case 'shutdown':
        case 'sync':
        case 'test':
        case 'version':
            return true;
        default:
            return false;
    }
}