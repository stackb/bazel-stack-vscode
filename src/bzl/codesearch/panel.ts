
import * as vscode from 'vscode';
import path = require('path');


export interface Message {
    command: string
    id: string
    type: string
    data?: FormData
    value?: string
}

export interface FormData { [key: string]: string; };

export interface Button {
    type?: string
    name?: string
    icon?: string
    label: string
    href?: string
    secondary?: boolean
    onclick?: () => Promise<void>
}

export interface Form {
    name: string
    inputs?: Input[]
    buttons?: Button[]
    onsubmit?: (message: Message) => Promise<boolean>
}

export interface SelectOption {
    value?: string
    selected?: boolean
    label: string
}

interface RenderingOptions {
    title?: string
    heading?: string
    subheading?: string
    column?: vscode.ViewColumn
    form?: Form
};

export interface Input {
    label?: string
    name: string
    placeholder?: string
    value?: string
    type: string
    class?: string
    style?: string
    size?: number
    display?: string
    newrow?: boolean // hack to terminate inline-block
    maxlength?: number
    options?: SelectOption[]
    pattern?: string
    required?: boolean
    onchange?: (value: string) => Promise<string | undefined>
}

/**
 * Show a jumbotron webview.
 */
export class CodesearchPanel implements vscode.Disposable {

    private disposables: vscode.Disposable[] = [];
    private panel: vscode.WebviewPanel | undefined;
    private callbacks: Map<string, Function> = new Map();

    public onDidDispose: vscode.Event<void>;

    constructor(
        private readonly extensionPath: string,
        public readonly id: string,
        public title: string,
        public column: vscode.ViewColumn,
    ) {
        this.panel = vscode.window.createWebviewPanel(id, title, column, {
            enableScripts: true,
            enableCommandUris: true,
        });
        this.panel.webview.onDidReceiveMessage(async (message: Message) => {
            const key = `${message.command}.${message.type}.${message.id}`;
            const callback = this.callbacks.get(key);
            switch (message.command) {
                default: {
                    if (callback) {
                        return callback(message);
                    }
                }
            }
        }, this.disposables);
        this.disposables.push(this.panel);

        this.onDidDispose = this.panel.onDidDispose;
    }

    asWebviewUri(localPath: string[]): vscode.Uri | undefined {
        const segments = localPath.slice();
        segments.unshift(this.extensionPath);
        const localResource = vscode.Uri.file(path.join(...segments));
        return this.panel?.webview.asWebviewUri(localResource);
    }

    async postMessage(message: Message): Promise<boolean> {
        return this.panel!.webview.postMessage(message);
    }

    async render(opts: RenderingOptions): Promise<void> {
        this.callbacks.clear();

        const html = `<!DOCTYPE html>
            <html lang="en">
            ${this.htmlHead(opts.title)}
            ${this.htmlBody(opts)}
            </html>
        `;
        this.panel!.webview.html = html;
        this.panel?.reveal(opts.column || this.column);
    }

    htmlHead(title?: string): string {
        const bootstrapCssUri = this.asWebviewUri(
            ['resources', 'css', 'bootstrap.min.css']);
        const codeCssUri = this.asWebviewUri(
            ['resources', 'css', 'code.css']);

        return `<head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title || this.title}</title>
            <link rel="stylesheet" href="${bootstrapCssUri}">
            <link rel="stylesheet" href="${codeCssUri}">
            <style>
                body {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    font-weight: var(--vscode-editor-font-weight);
                    color: var(--vscode-editor-foreground);
                    background: var(--vscode-editor-background);
                }
                .download-hero {
                    margin: unset !important;
                }
                .home .jumbotron {
                    overflow: hidden;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    padding: 0;
                }
                .jumbotron.home {
                    text-align: left;
                }
                .home .swimlane p {
                    line-height: 2.5rem;
                }
                .swimlane:nth-child(odd) {
                    background-color: initial;
                }
                .home .jumbotron p {
                    font-weight: 300;
                    font-size: 1.8rem;
                    color: var(--vscode-editor-foreground);
                }
                .jumbotron.home .lead p {
                    padding: 0;
                    margin-bottom: 1rem !important;
                }
                .extensions {
                    height: 420px;
                }
                .extensions .gallery-item-card {
                    background-color: var(--vscode-tab-border);
                    color: var--vscode-tag-activeForeground);
                    border: 1px solid var--vscode-tab-activeModifiedBorder);
                    font-size: 12px;
                    width: 100%;
                    height: 210px;
                    border-radius: 0;
                    cursor: pointer;
                    -moz-box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
                    -webkit-box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
                    box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
                    position: relative;
                    overflow: hidden;
                }
                .extensions .gallery-item-card .core-info-cell .name {
                    white-space: unset;
                    color: var(--vscode-editor-foreground);
                }
                a {
                    color: var(--vscode-textLink-foreground);
                }
                a:hover {
                    color: var(--vscode-textLink-activeForeground);
                }
                codeblock {
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-size: smaller;
                }
                code {
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    font-size: smaller;
                }
                input {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    display: block;
                    padding: 0.5rem 0.8rem;
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-pickerGroup-border);
                    box-shadow: none;
                    margin: 0.5rem 0;
                }
                input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }
                select {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    display: block;
                    padding: 0.5rem 0.8rem;
                    color: var(--vscode-dropdown-foreground);
                    background-color: var(--vscode-dropdown-background);
                    border: 1px solid var(--vscode-dropdown-border);
                    box-shadow: none;
                    margin: 0.5rem 0;
                }
                select:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }
                .button {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    font-weight: 400;
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: 1px solid var(--vscode-pickerGroup-border);
                    padding: 0.7rem 1.5rem;
                    margin: 0.5rem 0;
                }
                .button:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                    background: var(--vscode-button-hoverBackground);
                }
                .button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                .input-label {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    margin-bottom: -0.3rem;
                }
                .tab-collection-container {
                    background-color: var(--vscode-breadcrumb-background);
                    z-index: 101;
                    position: static;
                    width: 100%;
                    border-bottom: 1px solid var(--vscode-panel-border);
                    height: 45px;
                }
                .tab-collection, .tab-content {
                    width: 1160px;
                    margin: 0 auto;
                    position: relative;
                }
                .tab-collection-left {
                    list-style-type: none;
                    margin: 0 auto;
                    padding: 0;
                }
                .tab {
                    cursor: pointer;
                    -webkit-box-sizing: content-box;
                    box-sizing: content-box;
                    float: left;
                    height: 45px;
                    line-height: 44px;
                    text-align: center;
                    font-size: 14px;
                    cursor: pointer;
                    min-width: 140px;
                    padding: 0 16px;
                    color: var(--vscode-input-placeholderForeground);
                    font-family: var(--vscode-font-family);
                    font-weight: var(--vscode-font-weight);
                    border-right: 1px solid var(--vscode-panel-border);
                }
                .tab.tabactive:visited {
                    color: #fff;
                }
                .tab-collection .tab.tabactive {
                    background-color: var(--vscode-statusBar-debuggingBackground); /* #e2165e; */
                    color: var(--vscode-statusBar-debuggingForeground);
                    animation-name: menu-link-fade;
                    animation-duration: .4s;
                    animation-timing-function: ease;
                    font-family: var(--vscode-font-family);
                    font-weight: 600;
                }
                .tab-collection .tab:nth-child(1) {
                    border-left: 1px solid var(--vscode-panel-border);
                }
                ul.highlights {
                    list-style: none;
                }
                ul.highlights li:before {
                    content: '✓';
                }
                ul.highlights li {
                    padding: 0.3rem;
                    color: var(--vscode-list-highlightForeground);
                }
                ul.highlights li i {
                    // color: var(--vscode-list-activeSelectionForeground);
                }
                .screenshot {
                    border: 1px solid var(--vscode-editor-background);
                }
                .screenshot:hover {
                    border: 1px solid var(--vscode-focusBorder);
                }
            </style>
        </head>`;
    }

    htmlBody(opts: RenderingOptions): string {
        return `<body class="home">
            ${this.htmlMain(opts)}
            <script>
                window.vsCallbacks = new Map();

                const vscode = acquireVsCodeApi();

                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data our extension sent
                    switch (message.command) {
                        case 'validate': {
                            const id = message.id;
                            const inputEl = document.getElementById(id);
                            if (inputEl) {
                                inputEl.setCustomValidity(message.value || '');
                                inputEl.reportValidity();
                            }
                            break;
                        }
                        case 'innerHTML': {
                            const id = message.id;
                            const el = document.getElementById(id);
                            if (el) {
                                el.innerHTML = message.value;
                            }
                            break;
                        }
                    }
                });

                function postClick(type, name) {
                    vscode.postMessage({
                        command: 'click',
                        type: type,
                        id: name,
                    });
                }

                function postInputChange(input) {
                    vscode.postMessage({
                        command: 'change',
                        type: 'input',
                        id: input.name,
                        value: input.value,
                    });
                }

                function postFormSubmit(form) {
                    const data = {};
                    for (let i = 0; i < form.elements.length; i++) {
                        const el = form.elements.item(i);
                        data[el.name] = el.value;
                    }
                    vscode.postMessage({
                        command: 'submit',
                        type: 'form',
                        id: form.id,
                        data: data,
                    });
                }
            </script>
        </body>`;
    }

    htmlMain(opts: RenderingOptions): string {
        return `
        <div role="main" style="padding: 2rem">
            ${this.htmlLead(opts)}
        </div>
        `;
    }

    htmlLead(opts: RenderingOptions): string {
        let html = `
        <h1>
            ${opts.heading}
            <strong>${opts.subheading}.</strong>
        </h1>
        `;
        html += this.htmlForm(opts.form);
        html += this.htmlResults(opts);
        return html;
    }

    htmlResults(opts: RenderingOptions): string {
        let html = `
        <div id="results" style="margin-top: 3rem">
        </div>
        `;
        return html;
    }

    htmlForm(form: Form | undefined): string {
        if (!form) {
            return '';
        }
        const key = `submit.form.${form.name}`;
        this.callbacks.set(key, form.onsubmit!);
        return `
        <form id="${form.name}" name="${form.name}" onsubmit="postFormSubmit(this)" style="display: inline-block; padding: 2rem; text-align: left;">
            ${this.htmlInputs(form.inputs)}
            ${this.formbuttonsHtml(form.buttons)}
        </form>`;
    }


    formbuttonsHtml(buttons: Button[] | undefined): string {
        if (!(buttons && buttons.length)) {
            return '';
        }
        return '<div style="margin-top: 2rem; text-align: right">' + buttons.map(input => this.formButtonHtml(input)).join('\n') + '</div>';
    }

    formButtonHtml(button: Button): string {
        return `
        <button class="button" type="${button.type ? button.type : 'button'}"
            ${button.secondary ? ' style="background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground)" ' : ''}
            name="${button.name}">
            ${button.label}
        </button>`;
    }

    htmlInputs(inputs: Input[] | undefined): string {
        if (!(inputs && inputs.length)) {
            return '';
        }
        return inputs.map(input => this.htmlFormField(input)).join('\n');
    }

    htmlFormField(input: Input): string {
        let html = '';
        if (input.newrow) {
            html += '<br>';
        }

        html += `<div style="display: ${input.display ? input.display : 'block'}; padding-bottom: 1rem;">`;

        if (input.type === 'select') {
            html += this.htmlSelect(input);
        } else {
            html += this.htmlInput(input);
        }

        html += '</div>';
        return html;
    }


    htmlSelect(input: Input): string {
        let html = `<label class="input-label" for="${input.name}">${input.label}</label>
        <select id="${input.name}"
            name="${input.name}"
            ${input.required ? ' required ' : ''}
            ${input.class ? ` class="${input.class}" ` : ''}
            ${input.style ? ` style="${input.style}" ` : ''}
            ${input.placeholder ? ` placeholder="${input.placeholder}" ` : ''}
            ${input.onchange ? ' oninput="postInputChange(this)" ' : ''}
        >`;
        html += input.options?.map(item => this.htmlSelectOption(item, input.value)).join('\n');
        html += '</select>';

        if (input.onchange) {
            const key = `change.select.${input.name}`;
            this.callbacks.set(key, async (message: Message) => {
                const errMessage = await input.onchange!(message.value!);
                await this.postMessage({
                    command: 'validate',
                    type: 'select',
                    id: input.name,
                    value: errMessage || '',
                });
            });
        }
        return html;
    }

    htmlSelectOption(option: SelectOption, selectedValue: string | undefined): string {
        return `
        <option
            ${option.value ? `value="${option.value}"` : ''}
            ${option.selected || (selectedValue && option.value === selectedValue) ? 'selected' : ''}
        >${option.label}</option>
        `;
    }

    htmlInput(input: Input): string {
        let html = `<label class="input-label" for="${input.name}">${input.label}</label>
        <input type="${input.type}"
            id="${input.name}"
            name="${input.name}"
            ${input.required ? ' required ' : ''}
            ${input.size ? ` size="${input.size}" ` : ''}
            ${input.maxlength ? ` maxlength="${input.maxlength}" ` : ''}
            ${input.pattern ? ` pattern="${input.pattern}" ` : ''}
            ${input.class ? ` class="${input.class}" ` : ''}
            ${input.style ? ` style="${input.style}" ` : ''}
            ${input.placeholder ? ` placeholder="${input.placeholder}" ` : ''}
            ${input.value ? ` value="${input.value}" ` : ''}
            ${input.onchange ? ' oninput="postInputChange(this)" ' : ''}
        >`;
        if (input.onchange) {
            const key = `change.input.${input.name}`;
            this.callbacks.set(key, async (message: Message) => {
                const errMessage = await input.onchange!(message.value!);
                await this.postMessage({
                    command: 'validate',
                    type: 'input',
                    id: input.name,
                    value: errMessage || '',
                });
            });
        }
        return html;
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }

}
