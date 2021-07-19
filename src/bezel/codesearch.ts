import Long = require('long');
import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import { Scope } from '../proto/build/stack/codesearch/v1beta1/Scope';
import { QueryOptions } from './codesearch/constants';
import { Query } from '../proto/livegrep/Query';
import { getRelativeDateFromTimestamp, md5Hash } from '../common';
import { event } from 'vscode-common';
import { Duration } from 'luxon';
import { CreateScopeResponse } from '../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { CreateScopeRequest } from '../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { Container } from '../container';
import { CommandName } from './constants';
import { CodesearchRenderer } from './codesearch/renderer';
import { CodesearchPanel, CodesearchRenderProvider, Message } from './codesearch/panel';
import { BuiltInCommands } from '../constants';
import { Bzl } from './bzl';
import { RunnableComponent, Status } from './status';
import { CodeSearchConfiguration, CodeSearchSettings } from './configuration';

/**
 * CodesearchIndexOptions describes options for the index command.
 */
export interface CodesearchIndexOptions {
  // arguments to the index operation, typically a single element bazel query
  // expression
  args: string[];
  // The bazel working directory
  cwd: string;
}

export interface OutputChannel {
  clear(): void;
  show(): void;
  appendLine(line: string): void;
}

/**
 * Codesarch implements a panel for codesarching.
 */
export class CodeSearch
  extends RunnableComponent<CodeSearchConfiguration>
  implements vscode.Disposable
{
  private readonly output: vscode.OutputChannel;
  private readonly renderer: CodesearchRenderer;
  private panel: CodesearchPanel | undefined;

  constructor(settings: CodeSearchSettings, public readonly bzl: Bzl) {
    super('CS0', settings);

    bzl.onDidChangeStatus(this.handleBzlChangeStatus, this, this.disposables);

    this.output = vscode.window.createOutputChannel('Codesearch');
    this.renderer = new CodesearchRenderer();
    this.disposables.push(this.output);
    this.disposables.push(this.renderer);

    this.disposables.push(
      vscode.commands.registerCommand(CommandName.Codesearch, this.handleCommandCodesearch, this)
    );

    this.disposables.push(
      vscode.commands.registerCommand(CommandName.CodesearchIndex, this.handleCodeIndex, this)
    );

    this.disposables.push(
      vscode.commands.registerCommand(
        CommandName.CodesearchSearch,
        this.handleCodeSearchCommand,
        this
      )
    );
  }

  async handleBzlChangeStatus(status: Status) {
    const cfg = await this.settings.get();
    if (!cfg.enabled) {
      return;
    }

    // If we are disabled, re-reenable if any other bzl status.
    if (this.status === Status.DISABLED && status !== Status.DISABLED) {
      this.setDisabled(false);
    }

    switch (status) {
      // Disable if upstream is disabled
      case Status.DISABLED:
        this.setDisabled(true);
        break;
      // If launching, follow that.
      case Status.LAUNCHING:
        this.setStatus(status);
        break;
      // if ready, show ready also (kindof a hack)
      case Status.READY:
        this.setStatus(status);
        break;
      case Status.ERROR:
        this.setError(new Error(this.bzl.statusErrorMessage));
        break;
      default:
        this.restart();
        break;
    }
  }

  async startInternal() {
    this.setStatus(this.bzl.status);
  }

  async stopInternal() {
    this.setStatus(this.bzl.status);
  }

  async handleCommandCodesearch(label: string): Promise<void> {
    const ws = await this.bzl.getWorkspace();
    const expr = `deps(${label})`;

    vscode.commands.executeCommand(CommandName.CodesearchSearch, {
      cwd: ws.cwd,
      args: [expr],
    });
  }

  getOrCreateSearchPanel(queryExpression: string): CodesearchPanel {
    if (!this.panel) {
      this.panel = new CodesearchPanel(
        Container.context.extensionPath,
        'Codesearch',
        `Codesearch ${queryExpression}`,
        vscode.ViewColumn.One
      );
      this.panel.onDidDispose(
        () => {
          this.panel = undefined;
        },
        this,
        this.disposables
      );
    }
    return this.panel;
  }

  async handleCodeIndex(opts: CodesearchIndexOptions): Promise<void> {
    await this.createScope(opts, this.output);
    return this.handleCodeSearch(opts);
  }

  async createScope(opts: CodesearchIndexOptions, output: OutputChannel): Promise<void> {
    const client = this.bzl.client;
    if (!client) {
      return;
    }

    const cfg = await this.bzl.settings.get();
    const ws = await this.bzl.getWorkspace();

    if (!(ws.cwd && ws.outputBase)) {
      return;
    }

    let command = 'query';
    const query: string[] = [];
    const options: string[] = [];
    let sink = query;
    for (let i = 0; i < opts.args.length; i++) {
      const arg = opts.args[i];
      if (i === 0 && (arg === 'query' || arg === 'cquery')) {
        command = arg;
        continue;
      }
      if (arg === '--') {
        sink = options;
        continue;
      }
      sink.push(arg);
    }
    const queryExpression = opts.args.join(' ');
    const scopeName = md5Hash(queryExpression);

    const request: CreateScopeRequest = {
      cwd: ws.cwd,
      outputBase: ws.outputBase,
      name: scopeName,
      bazelQuery: {
        command: command,
        expression: query.join(' '),
        options: options,
      },
    };

    output.clear();
    output.show();
    output.appendLine(`Indexing ${queryExpression}...`);

    return vscode.window
      .withProgress<void>(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Indexing ${queryExpression}...`,
          cancellable: false,
        },
        async (
          progress: vscode.Progress<{ message: string | undefined }>,
          token: vscode.CancellationToken
        ): Promise<void> => {
          return client.createScope(request, async (response: CreateScopeResponse) => {
            if (response.progress) {
              for (const line of response.progress || []) {
                output.appendLine(line);
                progress.report({ message: line });
              }
            }
          });
        }
      )
      .then(() => vscode.commands.executeCommand(BuiltInCommands.ClosePanel));
  }

  async handleCodeSearchCommand(opts: CodesearchIndexOptions): Promise<void> {
    try {
      return this.handleCodeSearch(opts);
    } catch (e) {
      vscode.window.showErrorMessage(`could not handle codesearch command: ${e.message}`);
    }
  }

  async handleCodeSearch(opts: CodesearchIndexOptions): Promise<void> {
    const client = this.bzl.client;
    if (!client) {
      return;
    }

    const ws = await this.bzl.getWorkspace();
    if (!(ws.cwd && ws.outputBase)) {
      return;
    }
    const cfg = await this.settings.get();
    const bzlCfg = await this.bzl.settings.get();

    const query: Query = {
      repo: ws.outputBase,
      file: ws.cwd,
      foldCase: cfg.foldCase,
      maxMatches: cfg.maxMatches,
      contextLines: cfg.defaultLinesContext,
      tags: QueryOptions.QuoteMeta,
    };

    const queryExpression = opts.args.join(' ');
    const scopeName = md5Hash(queryExpression);
    let scope: Scope | undefined = undefined;
    try {
      scope = await client.getScope({
        cwd: ws.cwd,
        outputBase: ws.outputBase,
        name: scopeName,
      });
    } catch (err) {
      if (err.code !== grpc.status.NOT_FOUND) {
        const e: grpc.ServiceError = err as grpc.ServiceError;
        vscode.window.showErrorMessage(`getScope: ${e.message} (${e.code})`);
      }
    }

    const panel = this.getOrCreateSearchPanel(queryExpression);

    const queryChangeEmitter = new event.Emitter<Query>();

    const queryDidChange = event.Event.debounce(
      queryChangeEmitter.event,
      (last, e) => e,
      250,
      true
    );

    queryDidChange(async q => {
      const start = Date.now();

      if (!q.line) {
        panel.onDidChangeHTMLSummary.fire('Searching ' + queryExpression);
        panel.onDidChangeHTMLResults.fire('');
        return;
      }

      panel.onDidChangeHTMLSummary.fire('Working...');
      panel.onDidChangeHTMLResults.fire('<progress></progress>');
      const timeoutID = setTimeout(() => {
        panel.onDidChangeHTMLSummary.fire('Timed out.');
        panel.onDidChangeHTMLResults.fire('');
      }, 1000);

      try {
        const result = await client.searchScope({
          scopeName: scopeName,
          query: q,
        });
        clearTimeout(timeoutID);
        panel.onDidChangeHTMLSummary.fire('Rendering results...');
        const resultsHTML = await this.renderer.renderResults(result, ws);
        let summaryHTML = await this.renderer.renderSummary(q, result);
        const dur = Duration.fromMillis(Date.now() - start);
        summaryHTML += ` [${dur.milliseconds} ms]`;
        panel.onDidChangeHTMLSummary.fire(summaryHTML);
        panel.onDidChangeHTMLResults.fire(resultsHTML);
      } catch (e) {
        clearTimeout(timeoutID);
        const err = e as grpc.ServiceError;
        panel.onDidChangeHTMLSummary.fire(err.message);
        panel.onDidChangeHTMLResults.fire('');
      }
    });

    await this.renderSearchPanel(ws.cwd, queryExpression, scope, panel, query, queryChangeEmitter);

    if (!scope) {
      panel.onDidChangeHTMLSummary.fire(
        'Codesearch index has not been created.  Click [Recreate Index] to build it.'
      );
      panel.onDidChangeHTMLResults.fire('');
      return;
    }

    if (!scope.size) {
      panel.onDidChangeHTMLSummary.fire(
        'Codesearch index contains no files.  Try [Recreate Index] to (re)build it.'
      );
      panel.onDidChangeHTMLResults.fire('');
      return;
    }

    panel.onDidChangeHTMLSummary.fire(`Searching ${scope.size} files [${queryExpression}]`);
  }

  async renderSearchPanel(
    cwd: string,
    queryExpression: string,
    scope: Scope | undefined,
    panel: CodesearchRenderProvider,
    query: Query,
    queryChangeEmitter: vscode.EventEmitter<Query>
  ): Promise<void> {
    let lastIndexed = 'never';
    let files = 0;
    if (scope) {
      files = Long.fromValue(scope.size || 0).toInt();
      if (scope.createdAt) {
        lastIndexed = getRelativeDateFromTimestamp(scope.createdAt);
      }
    }

    let heading = `codesearch <span class="text-hl">${files}</span> files, last indexed <span class="text-hl">${lastIndexed}</span>`;

    return panel.render({
      heading: heading,
      form: {
        name: 'search',
        buttons: [
          {
            label: 'Recreate Index',
            name: 'index',
            secondary: true,
            onclick: async () => {
              vscode.commands.executeCommand(CommandName.CodesearchIndex, {
                cwd: cwd,
                args: [queryExpression],
              });
            },
          },
        ],
        inputs: [
          {
            label: 'Query',
            type: 'text',
            name: 'number',
            placeholder: 'Search expression',
            display: 'inline-block',
            size: 40,
            autofocus: true,
            onchange: async (value: string) => {
              if (!value || value.length < 3) {
                query.line = '';
                queryChangeEmitter.fire(query);
                return;
              }
              query.line = value;
              queryChangeEmitter.fire(query);
              return '';
            },
          },
          {
            label: 'Max Matches',
            type: 'number',
            name: 'max',
            value: '50',
            display: 'inline-block',
            maxlength: 3,
            size: 3,
            onchange: async (value: string) => {
              if (!value) {
                return;
              }
              query.maxMatches = parseInt(value, 10);
              queryChangeEmitter.fire(query);
              return '';
            },
          },
          {
            label: 'Lines Context',
            type: 'number',
            name: 'context',
            value: '3',
            maxlength: 3,
            display: 'inline-block',
            size: 2,
            onchange: async (value: string) => {
              if (!value) {
                return;
              }
              query.contextLines = parseInt(value, 10);
              queryChangeEmitter.fire(query);
              return '';
            },
          },
          {
            label: 'Regexp',
            type: 'checkbox',
            name: 'regexp',
            style: 'vertical-align: top',
            display: 'inline-block',
            onchange: async (value: string) => {
              if (!value) {
                return;
              }
              query.tags = value === 'on' ? '' : QueryOptions.QuoteMeta;
              queryChangeEmitter.fire(query);
              return '';
            },
          },
        ],
      },
      callbacks: {
        'click.line': (m: Message) => {
          if (!m.data) {
            return;
          }
          const filename = m.data['file'];
          const line = m.data['line'];
          const col = m.data['col'];
          if (!(filename && line && col)) {
            return;
          }
          vscode.commands.executeCommand(
            BuiltInCommands.Open,
            vscode.Uri.file(filename).with({
              fragment: `${line},${col}`,
            })
          );
        },
      },
    });
  }
}
