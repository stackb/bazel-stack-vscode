import * as grpc from '@grpc/grpc-js';
import * as path from 'path';
import * as vscode from "vscode";
import { ExternalWorkspace } from '../../proto/build/stack/bezel/v1beta1/ExternalWorkspace';
import { LabelKind } from '../../proto/build/stack/bezel/v1beta1/LabelKind';
import { ListRulesResponse } from '../../proto/build/stack/bezel/v1beta1/ListRulesResponse';
import { PackageServiceClient } from '../../proto/build/stack/bezel/v1beta1/PackageService';
import { Workspace } from "../../proto/build/stack/bezel/v1beta1/Workspace";
import { BzlHttpServerConfiguration, splitLabel } from '../configuration';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

const ruleIcon = path.join(__dirname, '..', '..', '..', 'media', 'rule.svg');
const ruleClassIcon = path.join(__dirname, '..', '..', '..', 'media', 'bazel-rule-class.svg');

type RuleClassOrLabelKindItem = RuleClassItem | LabelKindItem;

/**
 * Renders a view for bazel packages.
 */
export class BazelRuleListView extends GrpcTreeDataProvider<RuleClassOrLabelKindItem> {
    private static readonly viewId = 'bzl-rules';
    private static readonly commandExplore = "bzl-rules.explore";

    private currentWorkspace: Workspace | undefined;
    private currentExternalWorkspace: ExternalWorkspace | undefined;

    constructor(
        private cfg: BzlHttpServerConfiguration,
        private client: PackageServiceClient,
        workspaceChanged: vscode.EventEmitter<Workspace | undefined>,
        externalWorkspaceChanged: vscode.EventEmitter<ExternalWorkspace | undefined>,
    ) {
        super(BazelRuleListView.viewId);

        this.disposables.push(vscode.commands.registerCommand(BazelRuleListView.commandExplore, this.handleCommandExplore, this));
        this.disposables.push(workspaceChanged.event(this.handleWorkspaceChanged, this));
        this.disposables.push(externalWorkspaceChanged.event(this.handleExternalWorkspaceChanged, this));
    }

    handleWorkspaceChanged(workspace: Workspace | undefined) {
        this.currentWorkspace = workspace;
    }

    handleExternalWorkspaceChanged(external: ExternalWorkspace | undefined) {
        this.currentExternalWorkspace = external;
    }

    handleCommandExplore(item: RuleClassOrLabelKindItem): void {
        if (!this.currentWorkspace) {
            return;
        }
        if (isRuleClassItem(item)) {
            return;
        }
        let rel = ['local', this.currentWorkspace.id];
        const parts = splitLabel(item.labelKind.label!);
        if (!parts) {
            return;
        }
        if (parts.ws !== '@') {
            rel.push('external');
        }
        rel.push(parts.ws);
        if (parts.pkg) {
            rel.push('package', parts.pkg);
        }
        if (parts.target) {
            rel.push(parts.target);
        }
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`http://${this.cfg.address}/${rel.join('/')}`));
    }

    async getChildren(item?: RuleClassOrLabelKindItem): Promise<RuleClassOrLabelKindItem[] | undefined> {
        if (!item) {
            return this.getRootItems();
        }
        if (!isRuleClassItem(item)) {
            return undefined;
        }
        return item.children;
    }

    protected async getRootItems(): Promise<RuleClassOrLabelKindItem[] | undefined> {
        if (!this.currentWorkspace) {
            return [];
        }
        const rules = await this.listRules();
        return ruleClassSort(this.currentWorkspace, this.currentExternalWorkspace, rules);
    }

    private async listRules(): Promise<LabelKind[]> {
        if (!this.currentWorkspace) {
            return Promise.resolve([]);
        }
        return new Promise<LabelKind[]>((resolve, reject) => {
            this.client.ListRules({
                workspace: this.currentWorkspace,
                externalWorkspace: this.currentExternalWorkspace,
            }, new grpc.Metadata(), async (err?: grpc.ServiceError, resp?: ListRulesResponse) => {
                if (err) {
                    console.log(`Rule.List error`, err);
                    const config = vscode.workspace.getConfiguration("feature.bzl.listPackages");
                    const currentStatus = config.get("status");
                    if (err.code !== currentStatus) {
                        await config.update("status", err.code);
                    }
                    reject(`could not rpc rule list: ${err}`);
                } else {
                    resolve(resp?.rule);
                }
            });
        });
    }

}

class RuleClassItem extends vscode.TreeItem {
    constructor(
        public readonly ruleClass: string,
        public readonly children: LabelKindItem[] = [],
    ) {
        super(ruleClass,
            children.length
                ? vscode.TreeItemCollapsibleState.Collapsed
                : vscode.TreeItemCollapsibleState.None);
    }

    get tooltip(): string {
        return `RuleClass ${this.ruleClass}`;
    }

    get description(): string {
        return `${this.children.length} rule${this.children.length ? 's' : ''}`;
    }

    get contextValue(): string {
        return 'ruleClass';
    }

    iconPath = {
        light: vscode.Uri.parse(`https://results.bzl.io/v1/image/rule-class-dot/${this.ruleClass}.svg`),
        dark: vscode.Uri.parse(`https://results.bzl.io/v1/image/rule-class-dot/${this.ruleClass}.svg`),
    };    
}

class LabelKindItem extends vscode.TreeItem {
    constructor(
        public readonly labelKind: LabelKind,
    ) {
        super(labelKind.label!);
    }

    get tooltip(): string {
        return `${this.labelKind.kind} ${this.labelKind.label}`;
    }

    get description(): string {
        return `${this.labelKind.label}`;
    }

    get contextValue(): string {
        return 'rule';
    }

    iconPath = {
        light: ruleIcon,
        dark: ruleIcon,
    };    
}

function ruleClassSort(repo: Workspace, external: ExternalWorkspace | undefined, rules: LabelKind[]): RuleClassItem[] {
    const map: Map<string, LabelKindItem[]> = new Map();

    for (const rule of rules) {
        if (!rule.kind) {
            continue;
        }
        let group = map.get(rule.kind);
        if (!group) {
            group = [];
            map.set(rule.kind, group);
        }
        group.push(new LabelKindItem(rule));
    }

    const ruleClasses: RuleClassItem[] = [];
    map.forEach((group, name) => {
        ruleClasses.push(new RuleClassItem(name, group));
    });

    return ruleClasses;
}

function isRuleClassItem(value: unknown): value is RuleClassItem {
    return Array.isArray((value as RuleClassItem).children);
}
