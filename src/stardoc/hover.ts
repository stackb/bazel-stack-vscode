import * as vscode from "vscode";
import { StardocConfiguration, BazelDocGroup, makeBazelDocGroupMap } from "./configuration";

/**
 * Provide a hover for Starlark files and the rule definitions therein.
 */
export class StardocHover implements vscode.HoverProvider, vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private groups: Map<string, BazelDocGroup>;

    constructor(
        private cfg: StardocConfiguration
    ) {
        this.groups = makeBazelDocGroupMap(cfg.groups);

        this.disposables.push(vscode.languages.registerHoverProvider([
            { language: 'bazel' },
            { language: 'starlark' },
        ], this));
    }

    public async provideHover(
        document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken
    ): Promise<vscode.Hover | undefined> {

        const range: vscode.Range | undefined = document.getWordRangeAtPosition(position);
        if (range === undefined) {
            return;
        }

        const word = document.getText(range);
        if (!word) {
            return;
        }

        const nextChar = document.getText(new vscode.Range(range.end, range.end.translate(0, +1)));
        if (nextChar !== "(") {
            return;
        }

        const group = this.groups.get(word);
        if (!group) {
            return;
        }

        const hover = makeBazelDocGroupHover(word, group, this.cfg.baseUrl);
        hover.range = range;

        return hover;
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
    }
}


/**
 * Make a Hover object for the given item of a doc group.
 * 
 * @param item The name of the item
 * @param group The group to which the item belongs
 */
function makeBazelDocGroupHover(item: string, group: BazelDocGroup, baseUrl: string): vscode.Hover {
    return new vscode.Hover(makeBazelDocGroupHoverMarkdown(item, group, baseUrl));
}

/**
 * Make a Hover object for the given item of a doc group.  Exported for testing.
 * 
 * @param item The name of the item
 * @param group The group to which the item belongs
 */
export function makeBazelDocGroupHoverMarkdown(item: string, group: BazelDocGroup, baseUrl: string): vscode.MarkdownString {
    let lines: string[] = [];
    lines.push(`**${makeDocEntryLink(item, group, baseUrl)}** is a member of _${group.name}_`);
    lines.push("");
    lines.push(group.items.map(e => makeDocEntryLink(e, group, baseUrl)).join(", "));

    if (group.also) {
        lines.push("");
        for (const raw of group.also) {
            lines.push(`@see ${raw}`);
        }
    }
    return new vscode.MarkdownString(lines.join("\n"));
}

/**
 * Make a markdown link for the given item of a doc group.
 * 
 * @param item The name of the item
 * @param group The group to which the item belongs
 */

function makeDocEntryLink(item: string, group: BazelDocGroup, baseUrl: string): string {
    return `[${item}](${baseUrl}/${group.path}#${item})`;
}
