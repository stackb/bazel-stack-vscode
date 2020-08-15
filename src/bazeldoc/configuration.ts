/**
 * Configuration for the bazeldoc feature.
 */
export type BazelDocConfiguration = {
    baseUrl: string,
    groups: BazelDocGroup[],
    verbose: number,
};


/**
 * A type that captures the name of a group, the items it contains, and the
 * relative path where the documentation exists.
 */
export type BazelDocGroup = {
    name: string,
    path: string,
    items: string[],
    also?: string[],
};


/**
 * Invert a list of groups into a map keyed by item name.
 * 
 * @param groups the set of groups to compile
 */
export function makeBazelDocGroupMap(groups: BazelDocGroup[]): Map<string,BazelDocGroup> {
    const groupMap = new Map<string,BazelDocGroup>();
    for (const group of groups) {
        for (const entry of group.items) {
            groupMap.set(entry, group);
        }
    }
    return groupMap;
}


/**
 * A hardcoded set of well-known doc groups.
 */
export const builtInGroups = [
    {
        name: 'general rules',
        path: 'be/general.html',
        items: ['filegroup', 'genquery', 'test_suite', 'alias', 'config_setting', 'genrule'],
    },
    {
        name: 'built-in functions',
        path: 'be/functions.html',
        items: ['package', 'package_group', 'exports_files', 'glob', 'select'],
    },
    {
        name: 'built-in c/c++ rules',
        path: 'be/c-cpp.html',
        items: ['cc_binary', 'cc_library', 'cc_test', 'cc_import', 'cc_proto_library', 'fdo_prefetch_hints', 'fdo_profile', 'cc_toolchain', 'cc_toolchain_suite'],
    },
    {
        name: 'built-in java rules',
        path: 'be/java.html',
        items: ['java_binary', 'java_import', 'java_library', 'java_lite_proto_library', 'java_test', 'java_package_configuration', 'java_plugin', 'java_runtime', 'java_toolchain'],
    },
    {
        name: 'built-in python rules',
        path: 'be/python.html',
        items: ['py_binary', 'py_library', 'py_test', 'py_runtime'],
    },
    {
        name: 'built-in shell rules',
        path: 'be/shell.html',
        items: ['sh_binary', 'sh_library', 'sh_test'],
    },
    {
        name: 'built-in platform rules',
        path: 'be/platform.html',
        items: ['constraint_setting', 'constraint_value', 'platform', 'toolchain', 'toolchain_type'], 
    },
    {
        name: 'built-in workspace rules',
        path: 'be/workspace.html',
        items: ['bind', 'local_repository', 'new_local_repository', 'xcode_config', 'xcode_version'], 
    },
    {
        name: 'embedded git repository rules',
        path: 'repo/git.html',
        items: ['git_repository', 'new_git_repository'], 
    },
    {
        name: 'embedded http repository rules',
        path: 'repo/http.html',
        items: ['http_archive', 'http_file', 'http_jar'], 
    },
    {
        name: 'language keywords',
        path: 'build-ref.html',
        items: ['load'],
    },
    {
        name: 'starlark globals',
        path: 'skylark/lib/globals.html',
        items: [
            'all',
            'analysis_test_transition',
            'any',
            'aspect',
            'bind',
            'bool',
            'configuration_field',
            'depset',
            'dict',
            'dir',
            'enumerate',
            'exec_group',
            'fail',
            'getattr',
            'hasattr',
            'hash',
            'int',
            'len',
            'list',
            'max',
            'min',
            'print',
            'provider',
            'range',
            'register_action_platforms',
            'register_toolchains',
            'repository_rule',
            'repr',
            'reversed',
            'rule',
            'select',
            'sorted',
            'str',
            'tuple',
            'type',
            'workspace',
            'zip',
        ], 
        also: ['[starlark language spec](https://github.com/bazelbuild/starlark/blob/master/spec.md)'],
    },
];
