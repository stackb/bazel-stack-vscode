import path = require('path');
import Long = require('long');
import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import { Scope } from '../proto/build/stack/codesearch/v1beta1/Scope';
import { QueryOptions } from '../bzl/codesearch/constants';
import { Query } from '../proto/livegrep/Query';
import { getRelativeDateFromTimestamp, md5Hash } from '../common';
import { event } from 'vscode-common';
import { Duration } from 'luxon';
import { CreateScopeResponse } from '../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { CreateScopeRequest } from '../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { Container } from '../container';
import { CommandName } from './constants';
import { CodesearchRenderer } from '../bzl/codesearch/renderer';
import { CodesearchPanel, CodesearchRenderProvider, Message } from '../bzl/codesearch/panel';
import { BuiltInCommands } from '../constants';
import { BezelLSPClient } from './lsp';

/**
 * CodesearchIndexOptions describes options for the index command.
 */
export interface CodesearchIndexOptions {
    // arguments to the index operation, typically a single element bazel query
    // expression
    args: string[],
    // The bazel working directory
    cwd: string
}

export interface OutputChannel {
    clear(): void;
    show(): void;
    appendLine(line: string): void;
}

/**
 * Codesarch implements a panel for codesarching.
 */
export class CodeSearch implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private output: vscode.OutputChannel;
    private renderer = new CodesearchRenderer();

    private client: BezelLSPClient | undefined;
    private panel: CodesearchPanel | undefined;

    constructor(
        onDidChangeClient: vscode.Event<BezelLSPClient>,
    ) {
        const output = this.output = vscode.window.createOutputChannel('Codesearch');
        this.disposables.push(output);
        this.disposables.push(this.renderer);

        onDidChangeClient(this.handleClientChange, this, this.disposables);

        this.registerCommands();
    }

    registerCommands() {
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodesearchIndex, this.handleCodeIndex, this));
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodesearchSearch, this.handleCodeSearch, this));
    }

    handleClientChange(client: BezelLSPClient) {
        this.client = client;
    }

    getOrCreateSearchPanel(queryExpression: string): CodesearchPanel {
        if (!this.panel) {
            this.panel = new CodesearchPanel(Container.context.extensionPath, 'Codesearch', `Codesearch ${queryExpression}`, vscode.ViewColumn.One);
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            }, this, this.disposables);
        }
        return this.panel;
    }

    checkPreconditions(): boolean {
        const client = this.client;
        if (!client) {
            vscode.window.showWarningMessage(`Cannot perform codesearch (bzl client not active)`);
            return false;
        }
        return true;
    }

    async handleCodeIndex(opts: CodesearchIndexOptions): Promise<void> {
        if (!this.checkPreconditions()) {
            return;
        }
        const client = this.client!;
        await this.createScope(opts, this.output);
        return this.handleCodeSearch(opts);
    }

    async createScope(opts: CodesearchIndexOptions, output: OutputChannel): Promise<void> {
        if (!(this.client && this.client.info && this.client.bzlClient)) {
            return;
        }
        const cwd = this.client.info.workspace;
        const outputBase = this.client.info.outputBase;

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
            cwd: cwd,
            outputBase: outputBase,
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

        return vscode.window.withProgress<void>(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Indexing ${queryExpression}...`,
                cancellable: false,
            }, async (progress: vscode.Progress<{ message: string | undefined }>, token: vscode.CancellationToken): Promise<void> => {

                return this.client!.bzlClient!.createScope(request, async (response: CreateScopeResponse) => {
                    if (response.progress) {
                        for (const line of response.progress || []) {
                            output.appendLine(line);
                            progress.report({ message: line });
                        }
                    }
                });
            })
            .then(() => vscode.commands.executeCommand(BuiltInCommands.ClosePanel));
    }

    async handleCodeSearch(opts: CodesearchIndexOptions): Promise<void> {
        if (!(this.client && this.client.info && this.client.bzlClient)) {
            return;
        }
        const bzlClient = this.client.bzlClient;
        const cwd = this.client.info.workspace;
        const outputBase = this.client.info.outputBase;

        const query: Query = {
            repo: outputBase,
            file: cwd,
            foldCase: true,
            maxMatches: 50,
            contextLines: 3,
            tags: QueryOptions.QuoteMeta,
        };

        const queryExpression = opts.args.join(' ');
        const scopeName = md5Hash(queryExpression);
        let scope: Scope | undefined = undefined;
        try {
            scope = await bzlClient.getScope({
                cwd: cwd,
                outputBase: outputBase,
                name: scopeName,
            });
        } catch (err) {
            if (err.code !== grpc.status.NOT_FOUND) {
                const e: grpc.ServiceError = err as grpc.ServiceError;
                vscode.window.showErrorMessage(`${e.message} (${e.code})`);
            }
        }

        const panel = this.getOrCreateSearchPanel(queryExpression);

        const queryChangeEmitter = new event.Emitter<Query>();

        const queryDidChange = event.Event.debounce(
            queryChangeEmitter.event,
            (last, e) => e,
            250,
            true,
        );

        queryDidChange(async (q) => {
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
                const result = await bzlClient.searchScope({
                    scopeName: scopeName,
                    query: q,
                });
                clearTimeout(timeoutID);
                panel.onDidChangeHTMLSummary.fire('Rendering results...');
                const resultsHTML = await this.renderer.renderResults(result, this.client!.ws!);
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

        await this.renderSearchPanel(cwd, queryExpression, scope, panel, query, queryChangeEmitter);

        panel.onDidChangeHTMLSummary.fire('Searching ' + queryExpression);
    }

    async renderSearchPanel(cwd: string, queryExpression: string, scope: Scope | undefined, panel: CodesearchRenderProvider, query: Query, queryChangeEmitter: vscode.EventEmitter<Query>): Promise<void> {
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
                        }
                    }
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
                    }
                ]
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
                    vscode.commands.executeCommand(BuiltInCommands.Open, vscode.Uri.file(filename).with({
                        fragment: `${line},${col}`,
                    }));
                }
            },
        });
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
