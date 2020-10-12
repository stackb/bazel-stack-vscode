import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { event } from 'vscode-common';
import { CommandCodeLensProvider } from '../../api';
import { getRelativeDateFromTimestamp, md5Hash } from '../../common';
import { BuiltInCommands } from '../../constants';
import { Container } from '../../container';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { CreateScopeRequest } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { Scope } from '../../proto/build/stack/codesearch/v1beta1/Scope';
import { Query } from '../../proto/livegrep/Query';
import { BzlClient } from '../bzlclient';
import { CommandName } from '../constants';
import { CodesearchPanel, Message } from './panel';
import { CodesearchRenderer } from './renderer';
import path = require('path');
import Long = require('long');

export interface CodesearchIndexOptions {
    args: string[],
    cwd: string
}

export class CodeSearchCodeLens implements CommandCodeLensProvider, vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private currentWorkspace: Workspace | undefined;
    protected client: BzlClient | undefined;
    private output: vscode.OutputChannel;
    private panel: CodesearchPanel | undefined;
    private renderer = new CodesearchRenderer();
    private scopes: Map<string,Scope> = new Map();
    private _onDidChangeCommandCodeLenses = new vscode.EventEmitter<void>();
    public onDidChangeCommandCodeLenses = this._onDidChangeCommandCodeLenses.event;

    constructor(
        workspaceChanged: vscode.Event<Workspace | undefined>,
        onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        const output = this.output = vscode.window.createOutputChannel('codesearch');
        this.disposables.push(output);
        this.disposables.push(this._onDidChangeCommandCodeLenses);
        this.disposables.push(workspaceChanged(this.handleWorkspaceChanged, this));
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodeSearchIndex, this.handleCodesearchIndex, this));
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodeSearchSearch, this.handleCodesearchSearch, this));

        onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
        if (workspace) {
            this.updateScopes();
        }
    }

    handleBzlClientChange(client: BzlClient) {
        this.client = client;
    }

    async updateScopes() {
        if (!(this.client && this.currentWorkspace)) {
            return;
        }
        const result = await this.client.listScopes({
            outputBase: this.currentWorkspace.outputBase,
        });
        this.scopes.clear();
        for (const scope of result.scope || []) {
            this.scopes.set(scope.name!, scope);
        }
        this._onDidChangeCommandCodeLenses.fire();
    }

    getOrCreateSearchPanel(): CodesearchPanel {
        if (!this.panel) {
            this.panel = new CodesearchPanel(Container.context.extensionPath, 'codesearch', 'Codesearch', vscode.ViewColumn.One);
        }
        return this.panel;
    }

    async handleCodesearchIndex(opts: CodesearchIndexOptions): Promise<void> {
        const client = this.client;
        if (!client) {
            return;
        }
        const ws = this.currentWorkspace;
        if (!ws) {
            return;
        }

        const queryExpression = opts.args.join(' ');
        const scopeName = md5Hash(queryExpression);

        const request: CreateScopeRequest = {
            cwd: ws.cwd,
            outputBase: ws.outputBase,
            name: scopeName,
            bazelQuery: {
                expression: queryExpression,
            },
        };

        return new Promise((resolve, reject) => {
            this.output.clear();
            this.output.show();

            const stream = client.scopes.Create(request, new grpc.Metadata());

            stream.on('data', (response: CreateScopeResponse) => {
                if (response.progress) {
                    for (const line of response.progress || []) {
                        this.output.appendLine(line);
                    }
                }
            });

            stream.on('metadata', (md: grpc.Metadata) => {
            });

            stream.on('error', (err: Error) => {
                reject(err.message);
            });

            stream.on('end', () => {
                resolve();
            });
        });
    }

    async handleCodesearchSearch(opts: CodesearchIndexOptions): Promise<void> {
        const client = this.client;
        if (!client) {
            return;
        }
        const ws = this.currentWorkspace;
        if (!ws) {
            return;
        }

        const query: Query = {
            repo: ws.outputBase,
            file: ws.cwd,
            foldCase: true,
            maxMatches: 50,
            contextLines: 3,
        };

        const queryChangeEmitter = new event.Emitter<Query>();
        const renderedHtmlDidChange = new event.Emitter<string>();

        const queryDidChange = event.Event.debounce(
            queryChangeEmitter.event,
            (last, e) => e,
            250,
            true,
        );

        const queryExpression = opts.args.join(' ');
        const scopeName = md5Hash(queryExpression);

        const panel = this.getOrCreateSearchPanel();
        await panel.render({
            title: `Search ${queryExpression}`,
            heading: 'Codesearch',
            form: {
                name: 'search',
                inputs: [
                    {
                        label: 'Query',
                        type: 'text',
                        name: 'number',
                        placeholder: `Search ${queryExpression}`,
                        display: 'inline-block',
                        size: 40,
                        autofocus: true,
                        onchange: async (value: string) => {
                            if (!value || value.length < 3) {
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

        queryDidChange(async (q) => {
            const result = await client.search({
                scopeName: scopeName,
                query: q,
            });
            const html = await this.renderer.render(result, this.currentWorkspace!);
            renderedHtmlDidChange.fire(html);
        });

        renderedHtmlDidChange.event(async html => {
            await panel.postMessage({
                command: 'innerHTML',
                type: 'div',
                id: 'results',
                value: html,
            });
        });
    }

    async provideCommandCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken,
        lineNum: number,
        colNum: number,
        command: string,
        args: string[],
    ): Promise<vscode.CodeLens[] | undefined> {

        const cwd = path.dirname(document.uri.fsPath);
        const scopeName = md5Hash(args.join(' '));
        const scope = this.scopes.get(scopeName);
        
        const range = new vscode.Range(
            new vscode.Position(lineNum, colNum),
            new vscode.Position(lineNum, colNum + command.length));

        let indexTitle = 'Index';
        if (scope && scope.createdAt) {
            const created = getRelativeDateFromTimestamp(scope.createdAt);
            indexTitle += ` (${created})`;
        }
        const index = new vscode.CodeLens(range, {
            command: CommandName.CodeSearchIndex,
            title: indexTitle,
            arguments: [{
                args: args,
                cwd: cwd,
            }],
        });

        let searchTitle = 'Search';
        if (scope && scope.size) {
            const files = Long.fromValue(scope.size).toInt();
            searchTitle += ` ${files} files`;
        }

        const search = new vscode.CodeLens(range, {
            command: CommandName.CodeSearchSearch,
            title: searchTitle,
            arguments: [{
                args: args,
                cwd: cwd,
            }],
        });

        return [index, search];
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}
