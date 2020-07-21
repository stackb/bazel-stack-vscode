import * as vscode from "vscode";

const bazelDocsPrefix = "https://docs.bazel.build/versions/master";

/**
 * A type that captures the name of a group, the items it contains, and the
 * relative path where the documentation exists.
 */
type StarlarkDocGroup = {
    name: string,
    path: string,
    items: string[],
    also?: string[],
};

const bazelDocGroups: StarlarkDocGroup[] = [
    {
        name: "general rules",
        path: "be/general.html",
        items: ["filegroup", "genquery", "test_suite", "alias", "config_setting", "genrule"],
    },
    {
        name: "built-in functions",
        path: "be/functions.html",
        items: ["package", "package_group", "exports_files", "glob", "select"],
    },
    {
        name: "built-in c/c++ rules",
        path: "be/c-cpp.html",
        items: ["cc_binary", "cc_library", "cc_test", "cc_import", "cc_proto_library", "fdo_prefetch_hints", "fdo_profile", "cc_toolchain", "cc_toolchain_suite"],
    },
    {
        name: "built-in java rules",
        path: "be/java.html",
        items: ["java_binary", "java_import", "java_library", "java_lite_proto_library", "java_test", "java_package_configuration", "java_plugin", "java_runtime", "java_toolchain"],
    },
    {
        name: "built-in python rules",
        path: "be/python.html",
        items: ["py_binary", "py_library", "py_test", "py_runtime"],
    },
    {
        name: "built-in shell rules",
        path: "be/shell.html",
        items: ["sh_binary", "sh_library", "sh_test"],
    },
    {
        name: "built-in platform rules",
        path: "be/platform.html",
        items: ["constraint_setting", "constraint_value", "platform", "toolchain", "toolchain_type"], 
    },
    {
        name: "built-in workspace rules",
        path: "be/workspace.html",
        items: ["bind", "local_repository", "new_local_repository", "xcode_config", "xcode_version"], 
    },
    {
        name: "embedded git repository rules",
        path: "repo/git.html",
        items: ["git_repository", "new_git_repository"], 
    },
    {
        name: "embedded http repository rules",
        path: "repo/http.html",
        items: ["http_archive", "http_file", "http_jar"], 
    },
    {
        name: "special globals",
        path: "build-ref.html",
        items: ["load"],
    },
    {
        name: "starlark globals",
        path: "skylark/lib/globals.html",
        items: [
            "all",
            "analysis_test_transition",
            "any",
            "aspect",
            "bind",
            "bool",
            "configuration_field",
            "depset",
            "dict",
            "dir",
            "enumerate",
            "exec_group",
            "fail",
            "getattr",
            "hasattr",
            "hash",
            "int",
            "len",
            "list",
            "max",
            "min",
            "print",
            "provider",
            "range",
            "register_action_platforms",
            "register_toolchains",
            "repository_rule",
            "repr",
            "reversed",
            "rule",
            "select",
            "sorted",
            "str",
            "tuple",
            "type",
            "workspace",
            "zip",
        ], 
        also: [`[starlark language spec](https://github.com/bazelbuild/starlark/blob/master/spec.md)`],
    },
];

function makeGroupMap(groups: StarlarkDocGroup[]): Map<string,StarlarkDocGroup> {
    const groupMap = new Map<string,StarlarkDocGroup>();
    for (const group of groups) {
        for (const entry of group.items) {
            groupMap.set(entry, group);
        }
    }
    return groupMap;
}

/**
 * Provide a hover for Starlark files and the rule definitions therein.
 */
export class StarlarkDocGroupHover implements vscode.HoverProvider {

    groups: Map<string,StarlarkDocGroup> = makeGroupMap(bazelDocGroups);

    public provideHover(
        document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken
    ): Thenable<vscode.Hover> {
        console.log(`StarlarkHover: provideHover @ ${JSON.stringify(position)}`);

        const range: vscode.Range | undefined = document.getWordRangeAtPosition(position);
        if (range === undefined) {
            console.log(`StarlarkHover: no range`, position);
            return Promise.reject<vscode.Hover>();
        }

        const word = document.getText(range);
        if (!word) {
            console.log(`StarlarkHover: no word`, position);
            return Promise.reject<vscode.Hover>();
        }

        const nextChar = document.getText(new vscode.Range(range.end, range.end.translate(0, +1)));
        if (nextChar !== "(") {
            console.log(`StarlarkHover: word does not look like a function call: ${nextChar}`);
            return Promise.reject<vscode.Hover>();
        }

        const group = this.groups.get(word);
        if (group) {
            return Promise.resolve<vscode.Hover>(makeBazelDocGroupHover(word, group));
        }

        console.log(`StarlarkHover no match: ${word}`);
        return Promise.reject<vscode.Hover>();
    }

    public dispose() { }
}

/**
 * Make a Hover object for the given item of a doc group.
 * 
 * @param item The name of the item
 * @param group The group to which the item belongs
 */
function makeBazelDocGroupHover(item: string, group: StarlarkDocGroup): vscode.Hover {
    return new vscode.Hover(makeBazelDocGroupHoverMarkdown(item, group));
}

/**
 * Make a Hover object for the given item of a doc group.
 * 
 * @param item The name of the item
 * @param group The group to which the item belongs
 */
export function makeBazelDocGroupHoverMarkdown(item: string, group: StarlarkDocGroup): vscode.MarkdownString {
    let lines: string[] = [];
    lines.push(`${makeDocEntryLink(item, group)} a member of the group **${group.name}**`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(group.items.map(e => makeDocEntryLink(e, group)).join(", "));
    
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

export function makeDocEntryLink(item: string, group: StarlarkDocGroup): string {
    return `[${item}](${bazelDocsPrefix}/${group.path}#${item})`;
}