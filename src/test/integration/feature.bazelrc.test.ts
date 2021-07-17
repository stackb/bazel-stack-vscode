'use strict';

import fs = require('graceful-fs');
import tmp = require('tmp');
import vscode = require('vscode');
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import { BazelrcFeatureName } from '../../bazelrc/feature';
import { BazelFlagSupport } from '../../bazelrc/flags';

tmp.setGracefulCleanup();

type flagHoverTest = {
  d: string; // test description
  input: string; // content of file
  col: number; // apparent hover position
  match?: string; // expected markdown string
  range?: vscode.Range; // the expected range, if we care
};

type flagCompletionTest = {
  d: string; // test description
  input: string; // content of file
  triggerKind?: vscode.CompletionTriggerKind; // trigger context
  triggerCharacter?: string; // trigger context
  numItems?: number; // expected number of completion items
};

type codelensTest = {
  d: string; // test description
  input: string; // content of file
  numItems?: number; // expected number of codelens items
  command?: vscode.Command; // expected command
  range?: vscode.Range; // the expected range, if we care
};

describe(BazelrcFeatureName, function () {
  let support: BazelFlagSupport;
  const cancellationTokenSource = new vscode.CancellationTokenSource();

  before(async () => {
    const emitter = new vscode.EventEmitter<void>();
    support = new BazelFlagSupport(emitter.event);
    emitter.fire();
  });

  after(() => {
    support.dispose();
  });

  describe('hover', () => {
    const cases: flagHoverTest[] = [
      {
        d: 'should miss empty line',
        input: '',
        col: 1,
      },
      {
        d: 'should miss before token boundary start',
        input: ' --config',
        col: 1,
      },
      {
        d: 'should hit at token boundary start',
        input: ' --config',
        col: 2,
        match: '--config',
        range: new vscode.Range(new vscode.Position(0, 1), new vscode.Position(0, 9)),
      },
      {
        d: 'should hit at token boundary end',
        input: ' --config',
        col: 10,
        match: '--config',
      },
      {
        d: 'should miss after token boundary end',
        input: ' --config',
        col: 11,
      },
      {
        d: 'should miss before token boundary start (abbrev)',
        input: ' -j',
        col: 1,
      },
      {
        d: 'should hit at token boundary start (abbrev)',
        input: ' -j',
        col: 2,
        match: '--jobs',
        range: new vscode.Range(new vscode.Position(0, 1), new vscode.Position(0, 3)),
      },
      {
        d: 'should hit at token boundary end (abbrev)',
        input: ' -j',
        col: 4,
        match: '--jobs',
      },
      {
        d: 'should miss after token boundary end (abbrev)',
        input: ' -j ',
        col: 5,
      },
      {
        d: 'also matches inside a comment line',
        input: '# --config',
        col: 3,
        match: '--config',
      },
    ];

    cases.forEach(tc => {
      it(tc.d, async () => {
        const filename = tmp.tmpNameSync({ postfix: '.bazelrc' });
        fs.writeFileSync(filename, tc.input);
        const uri = vscode.Uri.file(filename);
        const document = await vscode.workspace.openTextDocument(uri);
        const position = new vscode.Position(0, tc.col - 1);
        const hover = await support.provideHover(document, position, cancellationTokenSource.token);
        if (!tc.match) {
          expect(hover).to.be.undefined;
          return;
        }
        expect(hover).not.to.be.undefined;
        expect(hover?.contents.length).eq(1);
        const content = hover?.contents[0] as vscode.MarkdownString;
        expect(content.value).to.contain(tc.match);
        if (tc.range) {
          expect(tc.range.start.line).equals(hover?.range?.start.line);
          expect(tc.range.start.character).equals(hover?.range?.start.character);
          expect(tc.range.end.line).equals(hover?.range?.end.line);
          expect(tc.range.end.character).equals(hover?.range?.end.character);
        }
      });
    });
  });

  describe('completion', () => {
    const cases: flagCompletionTest[] = [
      {
        d: 'should miss empty document',
        input: '',
        numItems: 0,
      },
      {
        d: 'should miss comment lines',
        input: '# build --',
        numItems: 0,
      },
      {
        d: 'should report all possible shorts',
        input: '  -',
        numItems: 7,
      },
      {
        d: 'should report all at long + negatables',
        input: ' --',
        numItems: 1267,
      },
      {
        d: 'should report all at negatables',
        input: ' --no',
        numItems: 436, // all hasNegatives plus 3 that happen to start with "no"
      },
      {
        d: 'should filter by command name (short option)',
        input: 'build -',
        numItems: 5,
      },
      {
        d: 'should filter by command name (long option)',
        input: 'build --',
        numItems: 1086,
      },
      {
        d: 'should filter by command name and current token',
        input: 'build --an',
        numItems: 17,
      },
      {
        d: 'should provide single match (short)',
        input: 'build -j',
        numItems: 1,
      },
      {
        d: 'should provide single match (long)',
        input: 'build --jobs',
        numItems: 1,
      },
    ];

    cases.forEach(tc => {
      it(tc.d, async () => {
        const filename = tmp.tmpNameSync({ postfix: '.bazelrc' });
        fs.writeFileSync(filename, tc.input);
        const uri = vscode.Uri.file(filename);
        const document = await vscode.workspace.openTextDocument(uri);
        const position = new vscode.Position(0, tc.input.length);
        const items = await support.provideCompletionItems(
          document,
          position,
          cancellationTokenSource.token,
          {
            triggerKind: tc.triggerKind || vscode.CompletionTriggerKind.Invoke,
            triggerCharacter: tc.triggerCharacter,
          }
        );
        if (!tc.numItems) {
          expect(items).to.be.undefined;
          return;
        }
        expect(items).not.to.be.undefined;
        expect(items?.length).eq(tc.numItems);
      });
    });
  });
});
