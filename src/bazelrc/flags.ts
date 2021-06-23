import * as fs from 'graceful-fs';
import * as protobuf from 'protobufjs';
import * as vscode from 'vscode';
import { Container } from '../container';
import { FlagCollection } from '../proto/bazel_flags/FlagCollection';
import { FlagInfo } from '../proto/bazel_flags/FlagInfo';
import { isBazelCommand } from './configuration';

const debug = false;

/**
 * Provide hover & completion for bazel flags.
 */
export class BazelFlagSupport
  implements
    vscode.HoverProvider,
    vscode.CompletionItemProvider<vscode.CompletionItem>,
    vscode.Disposable
{
  private disposables: vscode.Disposable[] = [];
  private flagCollection: FlagCollection | undefined;
  private flags: Map<string, FlagInfo> | undefined;

  constructor(onDidConfigurationChange: vscode.Event<void>) {
    onDidConfigurationChange(this.handleConfiguration, this, this.disposables);

    this.disposables.push(
      vscode.languages.registerHoverProvider([{ language: 'bazelrc', scheme: 'file' }], this)
    );

    this.disposables.push(
      vscode.languages.registerCompletionItemProvider(
        [{ language: 'bazelrc', scheme: 'file' }],
        this,
        '-'
      )
    );
  }

  private async handleConfiguration() {
    const collection = await parseFlagCollection(
      Container.protofile('bazel_flags.proto').fsPath,
      Container.file('flaginfo', 'bazel.flaginfo').fsPath
    );
    this.flagCollection = collection;
    this.flags = makeFlagInfoMap(collection);

    if (debug) {
      console.log(`${collection.flagInfos?.length} flags, ${this.flags.size} keys`);
      console.log(
        `${collection.flagInfos?.filter(f => f.hasNegativeFlag).length} negatable options`
      );
      console.log(`${collection.flagInfos?.filter(f => f.abbreviation).length} short options`);
      console.log(`${collection.flagInfos?.filter(f => !f.abbreviation).length} long-only options`);
      this.flags?.forEach((flag, name) => {
        console.log(`${name}\t--${flag.name}\t-${flag.abbreviation}`);
      });
    }
  }

  public async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | undefined> {
    if (!this.flags) {
      return;
    }

    const line = document.lineAt(position.line);
    if (!line || line.isEmptyOrWhitespace) {
      return;
    }

    const text = line.text;
    if (/^\s*#/.test(text)) {
      return;
    }

    const re = /\s+(--?)([a-z][:_a-zA-Z0-9]*)?/g;
    let flagType = '';
    let token = '';
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      // match.index starts at the beginning of the match, even though we didn't
      // capture it.  For example, ' --config=' matches the initial whitespace.
      // So we compute the start position by walking back from the full match
      // string.
      let flagLength = match[1].length;
      if (match[2]) {
        flagLength += match[2].length;
      }
      const start = match.index + match[0].length - flagLength;
      const end = start + flagLength;
      if (position.character >= start && position.character <= end) {
        flagType = match[1];
        if (match[2]) {
          token = match[2];
        }
        break;
      }
    }

    if (!flagType) {
      return;
    }

    const commandName = getCommandNameFromLine(text);

    const items: vscode.CompletionItem[] = [];

    // TODO: fold this all together to avoid iterating the list twice.

    // handle short flags separately
    if (flagType === '-') {
      this.flagCollection?.flagInfos?.forEach(flag => {
        if (!flag.abbreviation) {
          return;
        }
        if (!flag.abbreviation.startsWith(token)) {
          return;
        }
        if (commandName && !flag.commands?.includes(commandName)) {
          return;
        }
        items.push(makeFlagInfoCompletionItem(flag.abbreviation, flag));
      });
      return items.length ? items : undefined;
    }

    // add in all matching flags
    this.flagCollection?.flagInfos?.forEach(flag => {
      if (!flag.name?.startsWith(token)) {
        return;
      }
      if (commandName && !flag.commands?.includes(commandName)) {
        return;
      }
      items.push(makeFlagInfoCompletionItem(flag.name, flag));
    });

    // add in all negative flags
    if (!token || token.startsWith('no')) {
      this.flagCollection?.flagInfos?.forEach(flag => {
        if (!flag.hasNegativeFlag) {
          return;
        }
        if (commandName && !flag.commands?.includes(commandName)) {
          return;
        }
        items.push(makeFlagInfoCompletionItem('no' + flag.name, flag));
      });
    }

    return items.length ? items : undefined;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    if (!this.flags) {
      return;
    }

    const line = document.lineAt(position.line);
    if (!line || line.isEmptyOrWhitespace) {
      return;
    }

    const re = /\s+(--?)([a-z][:_a-zA-Z0-9]*)/g;
    let token: string | undefined;
    let range: vscode.Range | undefined;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line.text)) !== null) {
      // match.index starts at the beginning of the match, even though we didn't
      // capture it.  For example, ' --config=' matches the initial whitespace.
      // So we compute the start position by walking back from the full match
      // string.
      const flagLength = match[1].length + match[2].length;
      const start = match.index + match[0].length - flagLength;
      const end = start + flagLength;
      if (position.character >= start && position.character <= end) {
        token = match[2];
        range = new vscode.Range(
          new vscode.Position(line.lineNumber, start),
          new vscode.Position(line.lineNumber, end)
        );
        break;
      }
    }

    if (!token) {
      return;
    }

    const flag = this.flags.get(token);
    if (!flag) {
      return;
    }

    const hover = makeFlagInfoHover(flag);
    hover.range = range;

    return hover;
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

function getCommandNameFromLine(text: string): string | undefined {
  let match: RegExpMatchArray | null = null;
  if ((match = text.match(/^\s*([-a-z]+)\s+/))) {
    if (isBazelCommand(match[1])) {
      return match[1];
    }
    // special case to support bzl codesearch.  Alias 'codesearch' to 'query'
    if (match[1] === 'codesearch') {
      return 'query';
    }
  }
  return undefined;
}

function makeFlagInfoCompletionItem(name: string, flag: FlagInfo): vscode.CompletionItem {
  const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
  item.documentation = flag.documentation;
  item.commitCharacters = [' ', '='];
  return item;
}

async function parseFlagCollection(protofile: string, infofile: string): Promise<FlagCollection> {
  const options = {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true,
  };

  return protobuf.load(protofile).then(root => {
    const FlagCollectionType = root.lookupType('bazel_flags.FlagCollection');
    if (!FlagCollectionType) {
      throw new Error('Failed to find FlagCollection FlagCollectionType');
    }
    const data = fs.readFileSync(infofile);
    return FlagCollectionType.toObject(FlagCollectionType.decode(data), options);
  });
}

/**
 * Make a Hover object for the given flag.
 *
 * @param flag The flag info
 */
function makeFlagInfoMap(collection: FlagCollection): Map<string, FlagInfo> {
  const map = new Map();
  const flags = collection.flagInfos;
  if (flags && flags.length) {
    for (const flag of flags) {
      if (!flag.name) {
        continue;
      }
      map.set(flag.name, flag);
      if (flag.hasNegativeFlag) {
        map.set('no' + flag.name, flag);
      }
      if (flag.abbreviation) {
        map.set(flag.abbreviation, flag);
      }
    }
  }
  return map;
}

/**
 * Make a Hover object for the given flag.
 *
 * @param flag The flag info
 */
function makeFlagInfoHover(flag: FlagInfo): vscode.Hover {
  return new vscode.Hover(makeFlagInfoMarkdown(flag));
}

/**
 * Make markdown for the given flag.
 *
 * @param flag The flag info
 */
function makeFlagInfoMarkdown(flag: FlagInfo): vscode.MarkdownString {
  let lines: string[] = [];
  let firstLine = '`--' + flag.name + '`';
  if (flag.abbreviation) {
    firstLine += ' (`-' + flag.abbreviation + '`)';
  }
  lines.push(firstLine);
  lines.push('');
  lines.push(flag.documentation || '');
  lines.push('');

  if (flag.commands) {
    lines.push(flag.commands.map(c => '`' + c + '`').join(', '));
  }

  lines.push('');
  lines.push(
    `[Command Line Reference](https://docs.bazel.build/versions/master/command-line-reference.html#flag--${flag.name}) | `
  );
  lines.push(
    `[Code Search](https://cs.opensource.google/search?sq=&ss=bazel%2Fbazel&q=${flag.name}) `
  );

  return new vscode.MarkdownString(lines.join('\n'));
}
