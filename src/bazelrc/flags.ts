import * as fs from "fs";
import * as protobuf from "protobufjs";
import * as vscode from "vscode";
import { FlagCollection } from "../proto/bazel_flags/FlagCollection";
import { FlagInfo } from "../proto/bazel_flags/FlagInfo";
import { FlagConfiguration, isBazelCommand } from "./configuration";

/**
 * Provide hover & completion for bazel flags.
 */
export class BazelFlagSupport implements vscode.HoverProvider, vscode.CompletionItemProvider<vscode.CompletionItem>, vscode.Disposable {

  private disposables: vscode.Disposable[] = [];
  private flagCollection: FlagCollection | undefined;
  private flags: Map<string, FlagInfo> | undefined;

  constructor(
    private cfg: FlagConfiguration
  ) {
    this.disposables.push(vscode.languages.registerHoverProvider([
      { language: 'bazelrc', scheme: "file" },
    ], this));
    this.disposables.push(vscode.languages.registerCompletionItemProvider([
      { language: 'bazelrc', scheme: "file" },
    ], this, "-"));
  }

  async load() {
    try {
      const collection = await parseFlagCollection(this.cfg.protofile, this.cfg.infofile);
      this.flagCollection = collection;
      this.flags = makeFlagInfoMap(collection);
      // console.log(`Flags loaded: ${this.flags.size}`);
    } catch (err) {
      console.warn(`could not load flaginfo: ${err}`, err);
      throw err;
    }
  }

  public async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext): Promise<vscode.CompletionItem[] | undefined> {
    const line = document.lineAt(position.line);
    const text = line.text;
    if (/^\s*#/.test(text)) {
      console.debug(`provideCompletionItems ! is-a-comment`);
      return;
    }

    const space = text.lastIndexOf(" ", position.character+1);
    if (space < 2) {
      console.debug(`provideCompletionItems ! has-not-space`);
      return;
    }

    const chunk = text.slice(space+1, position.character);
    console.log(`provideCompletionItems chunk="${chunk}"`);

    let wantAbbreviation = false;
    let word = "";
    if (chunk.startsWith("--")) {
      word = chunk.slice(2);
    } else if (chunk.startsWith("-")) {
      wantAbbreviation = true;
      word = chunk.slice(1);
    } else {
      console.debug(`provideCompletionItems ! chunk-not-option "${chunk}"`);
      return;
    }
    if (!/[:_a-zA-Z]*/.test(word)) {
      console.debug(`provideCompletionItems ! word-not-a-flag`);
      return;
    }

    let wantCommand = "";
    let match: RegExpMatchArray | null = null;
    if (match = text.match(/^\s*([-a-z]+)\s+/)) {
      if (isBazelCommand(match[1])) {
        wantCommand = match[1];
      }
    }
    
    console.log(`provideCompletionItems wa=${wantAbbreviation}, word=${word}, wantCommand="${wantCommand}"`);
    
    const items: vscode.CompletionItem[] = [];
    const keys = Array.from(this.flags?.keys() || [])
      .filter(k => k.startsWith(word));

    const seen: Set<FlagInfo> = new Set();

    this.flags?.forEach((flag, key) => {
      if (seen.has(flag)) {
        return;
      }
      seen.add(flag);

      if (!key.startsWith(word)) {
        return;
      }
      
      if (wantCommand && !flag.commands?.includes(wantCommand)) {
        return;
      }

      // if (wantAbbreviation && !flag.abbreviation?.startsWith(word)) {
      //   return;
      // } 
      
      // if (!wantAbbreviation && !flag.name?.startsWith(word)) {
      //   return;
      // }
      
      let name = (wantAbbreviation ? flag.abbreviation : flag.name) || "";
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
      item.documentation = flag.documentation;
      item.commitCharacters = [" ", "="];
      items.push(item);

      // if (flag.hasNegativeFlag && !wantAbbreviation && word === "") {
      //   const negative = new vscode.CompletionItem("no"+name, vscode.CompletionItemKind.Constant);
      //   negative.documentation = flag.documentation;
      //   negative.commitCharacters = [" ", "="];
      //   items.push(negative);  
      // }

    });    
    this.flagCollection?.flagInfos?.forEach((flag) => {
      if (wantCommand && !flag.commands?.includes(wantCommand)) {
        return;
      }

      if (wantAbbreviation && !flag.abbreviation?.startsWith(word)) {
        return;
      } 
      if (!wantAbbreviation && !flag.name?.startsWith(word)) {
        return;
      }
      
      let name = (wantAbbreviation ? flag.abbreviation : flag.name) || "";
      const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Constant);
      item.documentation = flag.documentation;
      item.commitCharacters = [" ", "="];
      items.push(item);

      if (flag.hasNegativeFlag && !wantAbbreviation && word === "") {
        const negative = new vscode.CompletionItem("no"+name, vscode.CompletionItemKind.Constant);
        negative.documentation = flag.documentation;
        negative.commitCharacters = [" ", "="];
        items.push(negative);  
      }
    });

    console.log(`provideCompletionItems => ${items.length}`);

    return items;
  }

  public async provideHover(
    document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken
  ): Promise<vscode.Hover | undefined> {
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

    let left = position.character;
    let right = position.character;
    while (left > 0 && /[_:a-zA-Z]/.test(text.charAt(left - 1))) {
      left--;
    }
    while (right < (text.length - 1) && /[_:a-zA-Z]/.test(text.charAt(right + 1))) {
      right++;
    }

    // not enough room for '--' or ' -'
    if (left < 2) {
      return;
    }

    const before = text.slice(left - 2, left);
    switch (before) {
      case "--":
      case " -":
        break;
      default:
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
        // console.log("--no"+flag.name);
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
