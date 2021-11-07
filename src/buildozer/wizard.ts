import { InputStep, MultiStepInput } from '../multiStepInput';

interface CommandInfo {
    perRule: boolean;
    minArg: number;
    maxArg: number;
    template: string;
    description: string;
    example: string;
}

const allCommands: { [key: string]: CommandInfo } = {
    'add': {
        perRule: true, minArg: 2, maxArg: -1, template: '<attr> <value(s)>',
        description: 'Adds value(s) to a list attribute of a rule. If a value is already present in the list, it is not added.',
        example: "buildozer 'add deps //base' //pkg:rule //pkg:rule2",
    },
    'new_load': {
        perRule: false, minArg: 1, maxArg: -1, template: '<path> <[to=]from(s)>',
        description: "Add a load statement for the given path, importing the symbols. Before using this, make sure to run buildozer 'fix movePackageToTop'. Afterwards, consider running buildozer 'fix unusedLoads'.",
        example: "buildozer 'new_load //tools/build_rules:build_test.bzl build_test' //pkg:__pkg__",
    },
    'replace_load': {
        perRule: false, minArg: 1, maxArg: -1, template: '<path> <[to=]symbol(s)>',
        description: 'Similar to new_load, but removes existing load statements for the requested symbols before adding new loads.',
        example: "buildozer 'replace_load @rules_build//build:defs.bzl build_test' //pkg:__pkg__",
    },
    'substitute_load': {
        perRule: false, minArg: 2, maxArg: 2, template: '<old_regexp> <new_template>',
        description: 'Replaces modules of loads which match old_regexp according to new_template. The regular expression must follow RE2 syntax. new_template may be a simple replacement string, but it may also expand numbered or named groups using $0 or $x.',
        example: "buildozer 'substitute_load ^@([^/]*)//([^:].*)$ //third_party/build_defs/${1}/${2}' //pkg:__pkg__",
    },
    'comment': {
        perRule: true, minArg: 1, maxArg: 3, template: '<attr>? <value>? <comment>',
        description: 'Add a comment to a rule, an attribute, or a specific value in a list. Spaces in the comment should be escaped with backslashes.',
        example: '',
    },
    'print_comment': {
        perRule: true, minArg: 0, maxArg: 2, template: '<attr>? <value>?',
        description: '',
        example: '',
    },
    'delete': {
        perRule: true, minArg: 0, maxArg: 0, template: '',
        description: 'Delete a rule.',
        example: '',
    },
    'fix': {
        perRule: true, minArg: 0, maxArg: -1, template: '<fix(es)>?',
        description: 'Apply a fix.',
        example: '',
    },
    'move': {
        perRule: true, minArg: 3, maxArg: -1, template: '<old_attr> <new_attr> <value(s)>',
        description: 'Moves value(s) from the list old_attr to the list new_attr. The wildcard * matches all values.',
        example: '',
    },
    'new': {
        perRule: false, minArg: 2, maxArg: 4, template: '<rule_kind> <rule_name> [(before|after) <relative_rule_name>]',
        description: 'Add a new rule at the end of the BUILD file (before/after <relative_rule>). The identifier __pkg__ can be used to position rules relative to package().',
        example: "buildozer 'new java_library foo' //pkg:__pkg__",
    },
    'print': {
        perRule: true, minArg: 0, maxArg: -1, template: '<attribute(s)>',
        description: '',
        example: "buildozer -types go_library,go_binary 'print rule' '//buildtools/buildozer:*'",
    },
    'remove': {
        perRule: true, minArg: 1, maxArg: -1, template: '<attr> <value(s)>',
        description: 'Without arguments, removes attribute attr. Removes value(s) from the list attr. The wildcard * matches all attributes. Lists containing none of the value(s) are not modified',
        example: "buildozer 'remove deps foo' //pkg:%cc_library",
    },
    'remove_comment': {
        perRule: true, minArg: 0, maxArg: 2, template: '<attr>? <value>?',
        description: 'remove_comment <attr>? <value>?: Removes the comment attached to the rule, an attribute, or a specific value in a list.',
        example: '',
    },
    'rename': {
        perRule: true, minArg: 2, maxArg: 2, template: '<old_attr> <new_attr>',
        description: 'Rename the old_attr to new_attr which must not yet exist.',
        example: '',
    },
    'replace': {
        perRule: true, minArg: 3, maxArg: 3, template: '<attr> <old_value> <new_value>',
        description: 'Replaces old_value with new_value in the list attr. Wildcard * matches all attributes. Lists not containing old_value are not modified.',
        example: '',
    },
    'substitute': {
        perRule: true, minArg: 3, maxArg: 3, template: '<attr> <old_regexp> <new_template>',
        description: 'Replaces strings which match old_regexp in the list attr according to new_template. Wildcard * matches all attributes. The regular expression must follow RE2 syntax. new_template may be a simple replacement string, but it may also expand numbered or named groups using $0 or $x. Lists without strings that match old_regexp are not modified.',
        example: '',
    },
    'set': {
        perRule: true, minArg: 1, maxArg: -1, template: '<attr> <value(s)>',
        description: 'Sets the value of an attribute. If the attribute was already present, its old value is replaced.',
        example: "buildozer 'set kind java_library' //pkg:%gwt_module",
    },
    'set_if_absent': {
        perRule: true, minArg: 1, maxArg: -1, template: '<attr> <value(s)>',
        description: 'Sets the value of an attribute. If the attribute was already present, no action is taken.',
        example: "buildozer 'set_if_absent allowv1syntax 1' //pkg:%soy_js",
    },
    'copy': {
        perRule: true, minArg: 2, maxArg: 2, template: '<attr> <from_rule>',
        description: 'Copies the value of attr between rules. If it exists in the to_rule, it will be overwritten.',
        example: "buildozer 'copy testonly protolib' //pkg:py_protolib",
    },
    'copy_no_overwrite': {
        perRule: true, minArg: 2, maxArg: 2, template: '<attr> <from_rule>',
        description: 'Copies the value of attr between rules. If it exists in the to_rule, no action is taken.',
        example: '',
    },
    'dict_add': {
        perRule: true, minArg: 2, maxArg: -1, template: '<attr> <(key:value)(s)>',
        description: 'Sets the value of a key for the dict attribute attr. If the key was already present, it will not be overwritten.',
        example: '',
    },
    'dict_set': {
        perRule: true, minArg: 2, maxArg: -1, template: '<attr> <(key:value)(s)>',
        description: 'Sets the value of a key for the dict attribute attr. If the key was already present, its old value is replaced.',
        example: '',
    },
    'dict_remove': {
        perRule: true, minArg: 2, maxArg: -1, template: '<attr> <key(s)>',
        description: 'Deletes the key for the dict attribute attr.',
        example: '',
    },
    'dict_list_add': {
        perRule: true, minArg: 3, maxArg: -1, template: '<attr> <key> <value(s)>',
        description: 'Adds value(s) to the list in the dict attribute attr.',
        example: '',
    },
};

export class BuildozerWizard {
    private totalSteps: number = 3;
    private currentStep: number = 1;
    private targets: string[] = [];
    private command: string = '';
    private commandArgs: string[] = [];

    constructor(
        private readonly input: MultiStepInput,
        private workingDirectory: string = '',
    ) {
    }

    getWorkingDirectory(): string {
        return this.workingDirectory;
    }

    getTargets(): string[] {
        return this.targets;
    }

    getCommand(): string {
        return [this.command, ...this.commandArgs].join(' ');
    }

    async run(): Promise<void> {
        return this.input.stepThrough(this.pickWorkingDirectory.bind(this));
    }

    async pickWorkingDirectory(input: MultiStepInput): Promise<InputStep | undefined> {
        const wd = await input.showInputBox({
            title: 'Buildozer: Working Directory',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            value: this.workingDirectory,
            prompt: 'Working Directory (defaults to cwd)',
            validate: async (value: string) => { return ''; },
            shouldResume: async () => false,
        });
        this.workingDirectory = wd;
        return this.pickTargets(input);
    }

    async pickTargets(input: MultiStepInput): Promise<InputStep | undefined> {
        const picked = await input.showInputBox({
            title: 'Buildozer: Target(s)',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            prompt: 'Target Filter: ' + [
                'Use the label notation to refer to a rule: //buildtools/buildozer:edit',
                'Use the __pkg__ suffix to refer to the package declaration: //buildtools/buildozer:__pkg__',
                'Use an asterisk to refer to all rules in a file: //pkg:*',
                'Use ... to refer to all descendant BUILD files in a directory: //pkg/...:*',
                'Use percent to refer to all rules of a certain kind: //pkg:%java_library',
                'Use percent-and-number to refer to a rule that begins at a certain line: //pkg:%123',
                'Use - for the package name if you want to process standard input stream instead of a file: -:all_tests',
            ].join('; '),
            value: '',
            shouldResume: async () => false,
            validate: async (value: string) => { return ''; },
        });
        this.targets = picked.split(/\s+/);
        return this.pickCommand(input);
    }

    async pickCommand(input: MultiStepInput): Promise<InputStep | undefined> {
        const picked = await input.showQuickPick({
            title: 'Buildozer: Command Name',
            totalSteps: this.totalSteps,
            step: this.currentStep,
            items: Object.keys(allCommands).map(name => { return { label: name }; }),
            placeholder: 'Choose a buildozer command',
            shouldResume: async () => false,
        });
        this.command = picked.label;
        const info = allCommands[this.command];
        return pickCommandDescriptionSequence(this.command, info, this.commandArgs);
    }
}

type InputWork<T> = (input: MultiStepInput) => Promise<T>;

/**
 * Return a new function that closes over the given inputBox argument and
 * returns a Promise that resolves to a string.
 * @param title 
 * @param totalSteps 
 * @param step 
 * @param value 
 * @returns 
 */
function fromInputBox(title: string, prompt: string, totalSteps: number, step: number, value: string): InputWork<string> {
    return (input: MultiStepInput): Promise<string> => {
        return new Promise((resolve, _) => {
            const result = input.showInputBox({
                title: title,
                totalSteps: totalSteps,
                step: step,
                value: value,
                prompt: prompt,
                validate: async (value: string) => { return ''; },
                shouldResume: async () => false,
            });
            resolve(result);
        });
    };
}

function pickCommandDescriptionSequence(command: string, info: CommandInfo, results: string[]): InputStep {
    const parts = info.template.split(/\s+/);
    const work: InputWork<string>[] = parts.map((part, index) => {
        let help = part + ': ' + info.description;
        if (info.example) {
            help += '.  Example: ' + info.example;
        }
        return fromInputBox('Buildozer: ' + command, help, parts.length, index, '');
    });
    let currentWorkItem = 0;
    const fn = async (input: MultiStepInput): Promise<InputStep | undefined> => {
        if (currentWorkItem === parts.length) {
            return Promise.resolve(undefined); // resolve undefined terminates the multistep input sequence
        }
        const workItem = work[currentWorkItem++];
        const result = await workItem(input);
        results.push(result);
        return fn;
    };
    return fn;
}