import * as path from 'path';
import * as vscode from 'vscode';
import { isBazelCommand } from './configuration';

/**
 * The name of the run command
 */
export const runCommandName = 'bsv.bazelrc.runCommand';

/**
 * The name of the rerun command
 */
export const rerunCommandName = 'bsv.bazelrc.rerunCommand';

/**
 * runContext captures information needed to run a bazel command.
 */
export type RunContext = {
  cwd: string,
  command: string,
  args: string[],
  executable?: string,
  matcher?: string,
};

/**
 * Codelens provider that scans for command names in .
 */
export class BazelrcCodelens implements vscode.Disposable, vscode.CodeLensProvider {

  /** Fired when selected files change in the workspace. */
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>();
  private disposables: vscode.Disposable[] = [];
  // represents the last run; we can replay it with a separate command
  private lastRun: RunContext | undefined;

  public onDidChangeCodeLenses: vscode.Event<void> | undefined;

  constructor(
    private bazelExecutable: string,
  ) {
  }

  public async setup(skipInstallCommands?: boolean) {
    this.onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;

    const bazelrcWatcher = vscode.workspace.createFileSystemWatcher(
      '**/launch*.bazelrc',
      true, // ignoreCreateEvents
      false,
      true, // ignoreDeleteEvents
    );

    this.disposables.push(bazelrcWatcher.onDidChange(
      (uri) => {
        this.onDidChangeCodeLensesEmitter.fire();
      },
      this,
    ));

    this.disposables.push(bazelrcWatcher);

    // HACK: For unknown reason, the application under test performs duplicate
    // registration of these commands.
    if (!skipInstallCommands) {
      this.disposables.push(vscode.commands.registerCommand(runCommandName, this.runCommand, this));
      this.disposables.push(vscode.commands.registerCommand(rerunCommandName, this.rerunCommand, this));
  
      this.disposables.push(vscode.languages.registerCodeLensProvider(
        [{ pattern: '**/launch*.bazelrc' }],
        this,
      ));  
    }
  }

  /**
   * Runs a bazel command and streams output to the terminal.
   *
   * @param runCtx The run context.
   */
  async rerunCommand() {
    if (this.lastRun === undefined) {
      return;
    }
    vscode.tasks.executeTask(createRunCommandTask(this.lastRun));
  }

  /**
   * Runs a bazel command and streams output to the terminal.
   *
   * @param runCtx The run context.
   */
  async runCommand(runCtx: RunContext | undefined) {
    if (runCtx === undefined) {
      return;
    }
    if (!runCtx.executable) {
      runCtx.executable = this.bazelExecutable;
    }
    this.lastRun = runCtx;
    vscode.tasks.executeTask(createRunCommandTask(runCtx));
  }

  /**
   * Provides promisified CodeLen(s) for the given document.
   *
   * @param document A bazelrc file
   * @param token CodeLens token automatically generated by VS Code when
   *     invoking the provider
   */
  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ): Promise<vscode.CodeLens[] | undefined> {
    if (document.isDirty) {
      // Don't show code lenses for dirty files
      return;
    }
    return this.computeCodeLenses(path.dirname(document.uri.fsPath), document.getText());
  }

  /**
   * Computes lenses for the given document.
   * 
   * @param text 
   */
  private computeCodeLenses(cwd: string, text: string): vscode.CodeLens[] | undefined {
    const lines = text.split(/\r?\n/);
    const lenses: vscode.CodeLens[] = [];

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      // skip comments
      if (line.startsWith('#')) {
        continue;
      }

      // join to prev line if this is a continuation
      if (i > 0) {
        const prevLine = lines[i - 1].trim();
        if (!prevLine.startsWith('#') && prevLine.endsWith('\\')) {
          lines[i - 1] = prevLine.slice(0, -1) + line;
          continue;
        }
      }

      // check the token for a recognized command
      const tokens = line.split(/\s+/g);
      if (tokens.length < 2) {
        continue;
      }

      let command = tokens[0];
      let matcher = '';
      const parts = command.split(':');
      if (parts.length) {
        command = parts[0];
        matcher = parts[1];
      }

      if (!isBazelCommand(command)) {
        continue;
      }

      const cmd = createCommand({
        cwd: cwd,
        executable: this.bazelExecutable,
        command: command,
        matcher: matcher,
        args: tokens.slice(1),
      });

      const range = new vscode.Range(
        new vscode.Position(i, 0),
        new vscode.Position(i, command.length));

      lenses.push(new vscode.CodeLens(range, cmd));
    }

    return lenses.length ? lenses : undefined;
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }

}


/**
 * Creates a Command from the given run context object.
 * 
 * @param runCtx 
 */
function createCommand(runCtx: RunContext): vscode.Command {
  return {
    arguments: [runCtx],
    command: runCommandName,
    title: runCtx.command,
    tooltip: `${runCtx.command} ${runCtx.args.join(' ')}`,
  };
}


/**
 * Creates a new task that invokes a command.
 *
 * @param command The Bazel command to execute.
 * @param options Describes the options used to launch Bazel.
 */
export function createRunCommandTask(runCtx: RunContext): vscode.Task {
  const taskDefinition = {
    type: 'bazelrc',
  };
  const scope = vscode.TaskScope.Workspace;
  const name = runCtx.command;
  const source = 'bazel';
  const execution = new vscode.ShellExecution(
    [runCtx.executable, runCtx.command].concat(runCtx.args).join(' '), {
    cwd: runCtx.cwd,
  });
  let problemMatchers: string[] | undefined;
  if (runCtx.matcher) {
    problemMatchers = [runCtx.matcher];
  }
  return new vscode.Task(taskDefinition, scope, name, source, execution, problemMatchers);
}
