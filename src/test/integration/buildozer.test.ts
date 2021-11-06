'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import sinon = require('sinon');
import vscode = require('vscode');
import { expect } from 'chai';
import { BuildozerConfiguration } from '../../buildozer/configuration';
import {
    maybeInstallBuildtool,
    versionedPlatformBinaryName,
} from '../../buildifier/settings';

suite('bsv.buildozer', function () {
    this.timeout(20000);

    let tmpPath: string;

    const cancellationTokenSource = new vscode.CancellationTokenSource();

    suiteSetup(async () => {
        tmpPath = path.join(os.tmpdir(), 'buildozer');
    });

    suiteTeardown(async () => {
        await fs.remove(tmpPath);
    });

    teardown(() => {
        sinon.restore();
    });

    interface TestCase {
        name: string;
        ws: string; // workspace
    }

    const cases: TestCase[] = [
        {
            name: 'empty',
            ws: '',
        },
    ];

    cases.forEach(tc => {
        test(tc.name, () => {

            expect('a').to.eq('a');
        });
    });
});
