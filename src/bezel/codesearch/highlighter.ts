
import * as vscode from 'vscode';
import * as shiki from 'shiki';
import { IShikiTheme } from 'shiki-themes';

export class CodeHighlighter {
  private readonly _disposables: vscode.Disposable[] = [];

  private _highlighter?: Promise<shiki.Highlighter>;

  constructor() {
    this._needsRender = new vscode.EventEmitter<void>();
    this._disposables.push(this._needsRender);
    this.needsRender = this._needsRender.event;

    vscode.workspace.onDidChangeConfiguration(
      e => {
        if (e.affectsConfiguration('workbench.colorTheme')) {
          this.update();
          this._needsRender.fire();
        }
      },
      null,
      this._disposables
    );

    this.update();
  }

  private readonly _needsRender: vscode.EventEmitter<void>;
  public readonly needsRender: vscode.Event<void>;

  dispose() {
    let item: vscode.Disposable | undefined;
    while ((item = this._disposables.pop())) {
      item.dispose();
    }
  }

  public async getHighlighter(): Promise<shiki.Highlighter | undefined> {
    return this._highlighter;
  }

  private update() {
    const theme = 'dark-plus';
    this._highlighter = shiki.getHighlighter({ theme });
  }

  public async getCurrentTheme(): Promise<IShikiTheme | undefined> {
    if (!this._highlighter) {
      return undefined;
    }
    const highlighter = await this._highlighter;
    return highlighter.getTheme();
  }

}

export function getLanguageId(inId: string): string | undefined {
  for (const language of languages) {
    if (inId === language.name || language.identifiers.some(langId => inId === langId)) {
      return language.language;
    }
  }
  return undefined;
}

// Taken from https://github.com/Microsoft/vscode-markdown-tm-grammar/blob/master/build.js
const languages = [
  { name: 'css', language: 'css', identifiers: ['css', 'css.erb'], source: 'source.css' },
  {
    name: 'basic',
    language: 'html',
    identifiers: ['html', 'htm', 'shtml', 'xhtml', 'inc', 'tmpl', 'tpl'],
    source: 'text.html.basic',
  },
  { name: 'ini', language: 'ini', identifiers: ['ini', 'conf'], source: 'source.ini' },
  { name: 'java', language: 'java', identifiers: ['java', 'bsh'], source: 'source.java' },
  { name: 'lua', language: 'lua', identifiers: ['lua'], source: 'source.lua' },
  {
    name: 'makefile',
    language: 'makefile',
    identifiers: ['Makefile', 'makefile', 'GNUmakefile', 'OCamlMakefile'],
    source: 'source.makefile',
  },
  {
    name: 'perl',
    language: 'perl',
    identifiers: ['perl', 'pl', 'pm', 'pod', 't', 'PL', 'psgi', 'vcl'],
    source: 'source.perl',
  },
  { name: 'r', language: 'r', identifiers: ['R', 'r', 's', 'S', 'Rprofile'], source: 'source.r' },
  {
    name: 'ruby',
    language: 'ruby',
    identifiers: [
      'ruby',
      'rb',
      'rbx',
      'rjs',
      'Rakefile',
      'rake',
      'cgi',
      'fcgi',
      'gemspec',
      'irbrc',
      'Capfile',
      'ru',
      'prawn',
      'Cheffile',
      'Gemfile',
      'Guardfile',
      'Hobofile',
      'Vagrantfile',
      'Appraisals',
      'Rantfile',
      'Berksfile',
      'Berksfile.lock',
      'Thorfile',
      'Puppetfile',
    ],
    source: 'source.ruby',
  },
  // 	Left to its own devices, the PHP grammar will match HTML as a combination of operators
  // and constants. Therefore, HTML must take precedence over PHP in order to get proper
  // syntax highlighting.
  {
    name: 'php',
    language: 'php',
    identifiers: ['php', 'php3', 'php4', 'php5', 'phpt', 'phtml', 'aw', 'ctp'],
    source: ['text.html.basic', 'source.php'],
  },
  { name: 'sql', language: 'sql', identifiers: ['sql', 'ddl', 'dml'], source: 'source.sql' },
  { name: 'vs_net', language: 'vs_net', identifiers: ['vb'], source: 'source.asp.vb.net' },
  {
    name: 'xml',
    language: 'xml',
    identifiers: ['xml', 'xsd', 'tld', 'jsp', 'pt', 'cpt', 'dtml', 'rss', 'opml'],
    source: 'text.xml',
  },
  { name: 'xsl', language: 'xsl', identifiers: ['xsl', 'xslt'], source: 'text.xml.xsl' },
  { name: 'yaml', language: 'yaml', identifiers: ['yaml', 'yml'], source: 'source.yaml' },
  {
    name: 'dosbatch',
    language: 'dosbatch',
    identifiers: ['bat', 'batch'],
    source: 'source.batchfile',
  },
  {
    name: 'clojure',
    language: 'clojure',
    identifiers: ['clj', 'cljs', 'clojure'],
    source: 'source.clojure',
  },
  {
    name: 'coffee',
    language: 'coffee',
    identifiers: ['coffee', 'Cakefile', 'coffee.erb'],
    source: 'source.coffee',
  },
  { name: 'c', language: 'c', identifiers: ['c', 'h', 'cc'], source: 'source.c' },
  { name: 'cpp', language: 'cpp', identifiers: ['cpp', 'c\\+\\+', 'cxx'], source: 'source.cpp' },
  { name: 'diff', language: 'diff', identifiers: ['patch', 'diff', 'rej'], source: 'source.diff' },
  {
    name: 'dockerfile',
    language: 'dockerfile',
    identifiers: ['dockerfile', 'Dockerfile'],
    source: 'source.dockerfile',
  },
  { name: 'git_commit', identifiers: ['COMMIT_EDITMSG', 'MERGE_MSG'], source: 'text.git-commit' },
  { name: 'git_rebase', identifiers: ['git-rebase-todo'], source: 'text.git-rebase' },
  { name: 'go', language: 'go', identifiers: ['go', 'golang'], source: 'source.go' },
  { name: 'groovy', language: 'groovy', identifiers: ['groovy', 'gvy'], source: 'source.groovy' },
  { name: 'pug', language: 'pug', identifiers: ['jade', 'pug'], source: 'text.pug' },

  {
    name: 'js',
    language: 'javascript',
    identifiers: ['js', 'jsx', 'javascript', 'es6', 'mjs'],
    source: 'source.js',
  },
  { name: 'js_regexp', identifiers: ['regexp'], source: 'source.js.regexp' },
  {
    name: 'json',
    language: 'json',
    identifiers: [
      'json',
      'json5',
      'sublime-settings',
      'sublime-menu',
      'sublime-keymap',
      'sublime-mousemap',
      'sublime-theme',
      'sublime-build',
      'sublime-project',
      'sublime-completions',
    ],
    source: 'source.json',
  },
  { name: 'jsonc', language: 'jsonc', identifiers: ['jsonc'], source: 'source.json.comments' },
  { name: 'less', language: 'less', identifiers: ['less'], source: 'source.css.less' },
  {
    name: 'objc',
    language: 'objc',
    identifiers: ['objectivec', 'objective-c', 'mm', 'objc', 'obj-c', 'm', 'h'],
    source: 'source.objc',
  },
  { name: 'swift', language: 'swift', identifiers: ['swift'], source: 'source.swift' },
  { name: 'scss', language: 'scss', identifiers: ['scss'], source: 'source.css.scss' },

  {
    name: 'perl6',
    language: 'perl6',
    identifiers: ['perl6', 'p6', 'pl6', 'pm6', 'nqp'],
    source: 'source.perl.6',
  },
  {
    name: 'powershell',
    language: 'powershell',
    identifiers: ['powershell', 'ps1', 'psm1', 'psd1'],
    source: 'source.powershell',
  },
  {
    name: 'python',
    language: 'python',
    identifiers: [
      'python',
      'py',
      'py3',
      'rpy',
      'pyw',
      'cpy',
      'SConstruct',
      'Sconstruct',
      'sconstruct',
      'SConscript',
      'gyp',
      'gypi',
      'bazel',
      'WORKSPACE',
      'BUILD',
    ],
    source: 'source.python',
  },
  { name: 'regexp_python', identifiers: ['re'], source: 'source.regexp.python' },
  { name: 'rust', language: 'rust', identifiers: ['rust', 'rs'], source: 'source.rust' },
  { name: 'scala', language: 'scala', identifiers: ['scala', 'sbt'], source: 'source.scala' },
  {
    name: 'shell',
    language: 'shellscript',
    identifiers: [
      'shell',
      'sh',
      'bash',
      'zsh',
      'bashrc',
      'bash_profile',
      'bash_login',
      'profile',
      'bash_logout',
      '.textmate_init',
    ],
    source: 'source.shell',
  },
  { name: 'ts', language: 'typescript', identifiers: ['typescript', 'ts'], source: 'source.ts' },
  { name: 'tsx', language: 'typescriptreact', identifiers: ['tsx'], source: 'source.tsx' },
  { name: 'csharp', language: 'csharp', identifiers: ['cs', 'csharp', 'c#'], source: 'source.cs' },
  {
    name: 'fsharp',
    language: 'fsharp',
    identifiers: ['fs', 'fsharp', 'f#'],
    source: 'source.fsharp',
  },
  { name: 'dart', language: 'dart', identifiers: ['dart'], source: 'source.dart' },
  {
    name: 'handlebars',
    language: 'handlebars',
    identifiers: ['handlebars', 'hbs'],
    source: 'text.html.handlebars',
  },
  {
    name: 'markdown',
    language: 'markdown',
    identifiers: ['markdown', 'md'],
    source: 'text.html.markdown',
  },
];
