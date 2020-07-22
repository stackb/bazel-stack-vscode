/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------*/

import * as assert from 'assert';
import { makeBazelDocGroupHoverMarkdown } from '../../../bazeldoc/hover';

suite('StarlarkDocGroup Tests', () => {

    test('makeDocEntryLink', () => {
        const actual = makeBazelDocGroupHoverMarkdown('bar', {
            name: 'built-in foos',
            path: 'be/foo.html',
            items: ['bar', 'baz'],
        }, 'https://docs.bazel.build/versions/master').value;
        const expected = `
[bar](https://docs.bazel.build/versions/master/be/foo.html#bar) a member of the group **built-in foos**

---

[bar](https://docs.bazel.build/versions/master/be/foo.html#bar), [baz](https://docs.bazel.build/versions/master/be/foo.html#baz)`;

		assert.equal(actual, expected.trim());
	});

});