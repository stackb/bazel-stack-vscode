import * as fs from "fs";
import * as protobuf from "protobufjs";
import * as vscode from "vscode";
import { FlagCollection } from "../proto/bazel_flags/FlagCollection";
import { FlagInfo } from "./../proto/bazel_flags/FlagInfo";
import { FlagConfiguration } from "./configuration";

/**
 * Provide a hover for bazel flags.
 */
export class BazelFlagHover implements vscode.HoverProvider, vscode.CompletionItemProvider<vscode.CompletionItem>, vscode.Disposable {

  private disposables: vscode.Disposable[] = [];
  private flags: Map<string, FlagInfo> | undefined;
  private currentPanel: vscode.WebviewPanel | undefined;

  constructor(
    private cfg: FlagConfiguration
  ) {
    this.disposables.push(vscode.languages.registerHoverProvider([
      { language: 'bazelrc', scheme: "file" },
    ], this));
    this.disposables.push(vscode.languages.registerCompletionItemProvider([
      { language: 'bazelrc', scheme: "file" },
    ], this));
  }

  async load() {
    try {
      const collection = await parseFlagCollection(this.cfg.protofile, this.cfg.infofile);
      this.flags = makeFlagInfoMap(collection);
      console.log(`Flags loaded: ${this.flags.size}`);
    } catch (err) {
      console.warn(`could not load flaginfo: ${err}`, err);
      throw err;
    }
  }

  public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | undefined> {
    console.log(`provideCompletionItems (flag)`, position);
    if (position.character < 2) {
      return;
    }
    const line = document.lineAt(position.line);
    if (line.text.charAt(position.line - 1) !== "-") {
      return;
    }
    if (line.text.charAt(position.line - 2) !== "-") {
      return;
    }
    const text = line.text.trim();
    const firstSpace = text.indexOf(" ");
    if (firstSpace < 0) {
      return;
    }
    let firstToken = text.slice(0, firstSpace);
    if (firstToken.startsWith("#")) {
      return;
    }
    const command = getCommandName(firstToken);

    const items: vscode.CompletionItem[] = [];
    this.flags?.forEach((flag, name) => {
      // if the line starts with a command and it is not listed in the flag
      // command list, skip it.
      if (command && flag.commands && flag.commands.indexOf(command) < 0) {
        return;
      }
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
      item.documentation = flag.documentation;
      items.push(item);
    });

    return items;
  }

  public async provideHover(
    document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
    console.log(`provideHover (flag)`, position);

    if (!this.flags) {
      return;
    }

    const line = document.lineAt(position.line);
    if (!line) {
      return;
    }
    if (line.isEmptyOrWhitespace) {
      return;
    }
    const text = line.text;
    if (/^\s*[#]/.test(text)) {
      return;
    }

    let left = position.character;
    let right = position.character;
    while (left > 0 && /[_:a-zA-Z]/.test(text.charAt(left - 1))) {
      left--;
    }
    while (right < (text.length - 1) && /[_:a-zA-Z]/.test(text.charAt(right + 1))) {
      right++;
    }

    // not enough room for '--'
    if (left - 2 < 0) {
      return;
    }

    if (text.slice(left - 2, left) !== "--") {
      return;
    }

    const word = text.slice(left, right + 1);
    if (!word) {
      return;
    }

    console.log(`Hovering over "${word}"`);
    const flag = this.flags.get(word);
    if (!flag) {
      return;
    }

    const hover = makeFlagInfoHover(flag);
    hover.range = new vscode.Range(
      new vscode.Position(line.lineNumber, left),
      new vscode.Position(line.lineNumber, right),
    );

    return hover;
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

function getCommandName(token: string): string | undefined {
  switch (token) {
    case 'analyze-profile':
    case 'aquery':
    case 'build':
    case 'canonicalize-flags':
    case 'clean':
    case 'config':
    case 'coverage':
    case 'cquery':
    case 'dump':
    case 'fetch':
    case 'help':
    case 'info':
    case 'license':
    case 'mobile-install':
    case 'print_action':
    case 'query':
    case 'run':
    case 'shutdown':
    case 'sync':
    case 'test':
    case 'version':
      return token;
  }
  return undefined;
}

async function parseFlagCollection(protofile: string, infofile: string): Promise<FlagCollection> {
  const options = {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: false,
    oneofs: true
  };

  return protobuf.load(protofile).then(root => {
    const FlagCollectionType = root.lookupType("bazel_flags.FlagCollection");
    if (!FlagCollectionType) {
      throw new Error(`Failed to find FlagCollection FlagCollectionType`);
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
        map.set("no" + flag.name, flag);
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
  let firstLine = "`--" + flag.name + "`";
  if (flag.abbreviation) {
    firstLine += " (`-" + flag.abbreviation + "`)";
  }
  lines.push(firstLine);
  lines.push("");
  lines.push(flag.documentation || "");
  lines.push("");

  if (flag.commands) {
    lines.push(flag.commands.map(c => "`" + c + "`").join(", "));
  }

  lines.push("");
  lines.push(`[Command Line Reference](https://docs.bazel.build/versions/master/command-line-reference.html#flag--${flag.name}) | `);
  lines.push(`[Code Search](https://cs.opensource.google/search?sq=&ss=bazel%2Fbazel&q=${flag.name}) `);

  return new vscode.MarkdownString(lines.join("\n"));
}

function allFlagsCommand() {

}