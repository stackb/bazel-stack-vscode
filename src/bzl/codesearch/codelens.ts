import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { event } from 'vscode-common';
import { CommandCodeLensProvider } from '../../api';
import { md5Hash } from '../../common';
import { Container } from '../../container';
import { Workspace } from '../../proto/build/stack/bezel/v1beta1/Workspace';
import { CreateScopeRequest } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeRequest';
import { CreateScopeResponse } from '../../proto/build/stack/codesearch/v1beta1/CreateScopeResponse';
import { BzlClient } from '../bzlclient';
import { BzlServerConfiguration } from '../configuration';
import { CommandName } from '../constants';
import { CodesearchPanel } from './panel';
import { CodesearchRenderer } from './renderer';
import path = require('path');

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

    constructor(
        private cfg: BzlServerConfiguration,
        workspaceChanged: vscode.Event<Workspace | undefined>,
        onDidChangeBzlClient: vscode.Event<BzlClient>,
    ) {
        const output = this.output = vscode.window.createOutputChannel('codesearch');
        this.disposables.push(output);
        this.disposables.push(workspaceChanged(this.handleWorkspaceChanged, this));
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodeSearchIndex, this.handleCodesearchIndex, this));
        this.disposables.push(vscode.commands.registerCommand(CommandName.CodeSearchSearch, this.handleCodesearchSearch, this));
        onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
    }

    handleBzlClientChange(client: BzlClient) {
        this.client = client;
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

        // vscode.tasks.executeTask(createCodesearchIndexCommandTask(this.cfg, ws, opts));
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

        const queryEmitter = new event.Emitter<string>();
        const renderedHtmlDidChange = new event.Emitter<string>();

        const searchInputDidChange = event.Event.debounce(
            event.Event.latch(queryEmitter.event),
            (last, e) => e || last || '',
            250,
            true,
        );

        const queryExpression = opts.args.join(' ');
        const scopeName = md5Hash(queryExpression);

        const panel = this.getOrCreateSearchPanel();
        await panel.render({
            title: `Search ${queryExpression}`,
            heading: 'Codesearch',
            subheading: queryExpression,
            form: {
                name: 'search',
                inputs: [
                    {
                        label: 'Search',
                        type: 'text',
                        name: 'number',
                        placeholder: 'Search expression',
                        display: 'inline-block',
                        size: 125,
                        onchange: async (value: string) => {
                            if (!value || value.length < 3) {
                                return;
                            }
                            queryEmitter.fire(value);
                            return '';
                        },
                    },
                ]
            }
        });

        renderedHtmlDidChange.event(async html => {
            await panel.postMessage({
                command: 'innerHTML',
                type: 'div',
                id: 'results',
                value: html,
            });
        });
        
        searchInputDidChange(async value => {
            if (!value) {
                return;
            }
            const result = await client.search({
                scopeName: scopeName,
                query: {
                    repo: ws.outputBase,
                    file: ws.cwd,
                    foldCase: true,
                    maxMatches: 50,
                    contextLines: 3,
                    line: value,
                },
            });
            const html = await this.renderer.render(result);
            renderedHtmlDidChange.fire(html);
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

        const range = new vscode.Range(
            new vscode.Position(lineNum, colNum),
            new vscode.Position(lineNum, colNum + command.length));

        const index = new vscode.CodeLens(range, {
            command: CommandName.CodeSearchIndex,
            title: 'Index',
            arguments: [{
                args: args,
                cwd: cwd,
            }],
        });
        const search = new vscode.CodeLens(range, {
            command: CommandName.CodeSearchSearch,
            title: 'Search',
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
