import { Config } from 'bazel-stack-vscode-api';
import * as vscode from 'vscode';
import { parsers, problemMatcher } from 'vscode-common';

export class API implements problemMatcher.IProblemMatcherRegistry, vscode.Disposable {
    private registries: Set<DisposableProblemMatcherRegistry> = new Set();
    private onDidDispose: vscode.EventEmitter<DisposableProblemMatcherRegistry> = new vscode.EventEmitter();
    private _onMatcherChanged: vscode.EventEmitter<void> = new vscode.EventEmitter();
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.onDidDispose.event(this.handleDisposed, this, this.disposables);
        this.disposables.push(this.onDidDispose);
        this.disposables.push(this._onMatcherChanged);
    }

    handleDisposed(registry: DisposableProblemMatcherRegistry) {
        this.registries.delete(registry);
    }

    registerProblemMatchers(configs: Config.NamedProblemMatcher[]): vscode.Disposable {
        const registry = new problemMatcher.ProblemMatcherRegistryImpl();
        const disposable = new DisposableProblemMatcherRegistry(registry, this.onDidDispose);
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
        this.registries.forEach(d => d.dispose());
        this.registries.clear();
    }
}

class DisposableProblemMatcherRegistry implements problemMatcher.IProblemMatcherRegistry, vscode.Disposable {
    constructor(
        private proxy: problemMatcher.IProblemMatcherRegistry,
        private onDidDispose: vscode.EventEmitter<problemMatcher.IProblemMatcherRegistry>,
    ) {}

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
