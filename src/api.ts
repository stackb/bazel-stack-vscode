import * as vscode from 'vscode';
import { parsers, problemMatcher, uuid } from 'vscode-common';

export interface CommandCodeLensProvider {
    provideCommandCodeLenses(
        // the document being processed
        document: vscode.TextDocument,
        // the cancellation token
        token: vscode.CancellationToken,
        // line number where command starts
        lineNum: number,
        // column number where command starts
        colNum: number,
        // the name of the command
        command: string,
        // additional arguments to the command
        args: string[],
    ): Promise<vscode.CodeLens[] | undefined>;
}

export interface ICommandCodeLensProviderRegistry {
    getCommandCodeLensProvider(name: string): CommandCodeLensProvider | undefined;
    registerCommandCodeLensProvider(name: string, provider: CommandCodeLensProvider): vscode.Disposable;
}

export class API implements problemMatcher.IProblemMatcherRegistry, ICommandCodeLensProviderRegistry, vscode.Disposable {
    private registries: Set<DisposableProblemMatcherRegistry> = new Set();
    private onDidDisposeProblemMatcherRegistry: vscode.EventEmitter<DisposableProblemMatcherRegistry> = new vscode.EventEmitter();
    private onDidDisposeCommandCodeLens: vscode.EventEmitter<DisposableCommandCodeLensProvider> = new vscode.EventEmitter();
    private _onMatcherChanged: vscode.EventEmitter<void> = new vscode.EventEmitter();
    private commandCodeLenses: Map<string,DisposableCommandCodeLensProvider> = new Map();
    private disposables: vscode.Disposable[] = [];
    private uuid = uuid.generateUuid();

    constructor() {
        this.onDidDisposeProblemMatcherRegistry.event(this.handleDisposed, this, this.disposables);
        this.disposables.push(this.onDidDisposeProblemMatcherRegistry);
        this.disposables.push(this.onDidDisposeCommandCodeLens);
        this.disposables.push(this._onMatcherChanged);
    }

    handleDisposed(registry: DisposableProblemMatcherRegistry) {
        this.registries.delete(registry);
    }

    registerCommandCodeLensProvider(name: string, provider: CommandCodeLensProvider): vscode.Disposable {
        const disposable = new DisposableCommandCodeLensProvider(this.onDidDisposeCommandCodeLens, name, provider);
        this.commandCodeLenses.set(name, disposable);
        return disposable;
    }

    getCommandCodeLensProvider(name: string): CommandCodeLensProvider | undefined {
        return this.commandCodeLenses.get(name);
    }

    registerProblemMatchers(configs: problemMatcher.Config.NamedProblemMatcher[]): vscode.Disposable {
        const registry = new problemMatcher.ProblemMatcherRegistryImpl();
        const disposable = new DisposableProblemMatcherRegistry(registry, this.onDidDisposeProblemMatcherRegistry);
        this.disposables.push(disposable);

        const logger = new VSCodeWindowProblemReporter();
        const parser = new problemMatcher.ProblemMatcherParser(registry, logger);

        for (const config of configs) {
            const matcher = parser.parse(config);

            if (problemMatcher.isNamedProblemMatcher(matcher)) {
                const name = matcher.name;
                const aliases = name.split(/\s*,\s*/);
                for (const alias of aliases) {
                    matcher.name = alias;
                    // override any existing 'owner' such that the name and
                    // owner are always equal.  This simplified retrieval of the
                    // set of matched problems from the 'markerService'.
                    matcher.owner = alias;
                    registry.add(matcher);
                    console.log(`Registered problem matcher "${alias}"`);
                }
            }
        }

        this.registries.add(disposable);
        this._onMatcherChanged.fire();
        return disposable;
    }

    async onReady(): Promise<void> {
    }

    get(name: string): problemMatcher.NamedProblemMatcher | undefined {
        for (const registry of this.registries.values()) {
            const matcher = registry.get(name);
            if (matcher) {
                return matcher;
            }
        }
        return undefined;
    }

    keys(): string[] {
        const all = new Set<string>();
        for (const registry of this.registries.values()) {
            for (const key of registry.keys()) {
                all.add(key);
            }
        }
        return Array.from(all.values());
    }

    get onMatcherChanged() {
        return this._onMatcherChanged.event;
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.disposables.length = 0;
        this.commandCodeLenses.forEach(d => d.dispose());
        this.registries.forEach(d => d.dispose());
        this.registries.clear();
    }
}


class DisposableCommandCodeLensProvider implements CommandCodeLensProvider, vscode.Disposable {
    constructor(
        private onDidDispose: vscode.EventEmitter<DisposableCommandCodeLensProvider>,
        private name: string,
        private proxy: CommandCodeLensProvider,
    ) { }

    provideCommandCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken,
        lineNum: number,
        colNum: number,
        command: string,
        args: string[],
    ): Promise<vscode.CodeLens[] | undefined> {
        return this.proxy.provideCommandCodeLenses(
            document, token, lineNum, colNum, command, args);
    }

    dispose() {
        this.onDidDispose.fire(this);
    }
}

class DisposableProblemMatcherRegistry implements problemMatcher.IProblemMatcherRegistry, vscode.Disposable {
    constructor(
        private proxy: problemMatcher.IProblemMatcherRegistry,
        private onDidDispose: vscode.EventEmitter<problemMatcher.IProblemMatcherRegistry>,
    ) { }

    onReady(): Promise<void> {
        return this.proxy.onReady();
    }

    get(name: string): problemMatcher.NamedProblemMatcher | undefined {
        return this.proxy.get(name);
    }

    keys(): string[] {
        return this.proxy.keys();
    }

    get onMatcherChanged() {
        return this.proxy.onMatcherChanged;
    }

    dispose() {
        this.onDidDispose.fire(this);
    }
}

export class VSCodeWindowProblemReporter implements parsers.IProblemReporter {

    private _validationStatus: parsers.ValidationStatus;

    constructor() {
        this._validationStatus = new parsers.ValidationStatus();
    }

    public info(message: string): void {
        this._validationStatus.state = parsers.ValidationState.Info;
        vscode.window.showInformationMessage(message);
    }

    public warn(message: string): void {
        this._validationStatus.state = parsers.ValidationState.Warning;
        vscode.window.showWarningMessage(message);
    }

    public error(message: string): void {
        this._validationStatus.state = parsers.ValidationState.Error;
        vscode.window.showErrorMessage(message);
    }

    public fatal(message: string): void {
        this._validationStatus.state = parsers.ValidationState.Fatal;
        vscode.window.showErrorMessage(message);
        throw new TypeError(message);
    }

    public get status(): parsers.ValidationStatus {
        return this._validationStatus;
    }
}
