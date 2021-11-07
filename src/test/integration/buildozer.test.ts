'use strict';

import fs = require('fs-extra');
import os = require('os');
import path = require('path');
import sinon = require('sinon');
import { expect } from 'chai';
import { BuildozerConfiguration } from '../../buildozer/configuration';
import {
    maybeInstallBuildtool,
} from '../../buildifier/settings';
import { BuildozerWizard } from '../../buildozer/wizard';
import { MultiStepInput } from '../../multiStepInput';
import { FakeInputBox, FakeVSCodeWindowInputAPI } from './fakewindowapi';

suite('bsv.buildozer', function () {
    this.timeout(20000);

    let tmpPath: string;
    let cfg: BuildozerConfiguration;

    suiteSetup(async () => {
        tmpPath = path.join(os.tmpdir(), 'buildozer');

        cfg = {
            enabled: true,
            githubOwner: 'bazelbuild',
            githubRepo: 'buildtools',
            githubRelease: '4.2.3',
            executable: '',
            options: [],
        };
        cfg.executable = await maybeInstallBuildtool(
            cfg.githubOwner,
            cfg.githubRepo,
            cfg.githubRelease,
            tmpPath,
            'buildozer');
    });

    suiteTeardown(async () => {
        await fs.remove(tmpPath);
    });

    teardown(() => {
        sinon.restore();
    });

    interface TestCase {
        name: string;
        workspaceDir: string;
        commandName: string;
        commandArgs: string;
        targets: string[];
    }

    const cases: TestCase[] = [];

    cases.forEach(tc => {
        test(tc.name, () => {
            const window = new FakeVSCodeWindowInputAPI();
            const input = new MultiStepInput(window);
            const wizard = new BuildozerWizard(input);

            window.onDidCreateInputBox(box => {
                const fake = box as FakeInputBox;
                // ...
            });

            // TODO: figure out how to test this!  Turned out harded than
            // expected.
        });
    });
});
