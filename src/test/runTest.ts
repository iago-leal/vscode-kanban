/**
 * This file is part of the vscode-kanban distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 *
 * vscode-kanban is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-kanban is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//
// Command line entry point of 'npm test', running outside of the editor.
//
// It downloads a Visual Studio Code instance (cached in '.vscode-test'), starts
// it with this extension loaded and hands the control over to './index', which
// runs the Mocha suites inside that extension host.
//

import * as Path from 'path';
import { runTests } from '@vscode/test-electron';

(async () => {
    try {
        // the folder that contains the 'package.json' of the extension
        const EXTENSION_DEVELOPMENT_PATH = Path.resolve(__dirname, '..', '..');
        // the module that exports the 'run()' function
        const EXTENSION_TESTS_PATH = Path.resolve(__dirname, './index');

        await runTests({
            extensionDevelopmentPath: EXTENSION_DEVELOPMENT_PATH,
            extensionTestsPath: EXTENSION_TESTS_PATH,
            // tells the extension, that nobody is there to click a popup away
            extensionTestsEnv: {
                VSCKB_TEST: '1',
            },
            // the other extensions of the editor are irrelevant here
            launchArgs: [
                '--disable-extensions',
            ],
        });
    } catch (e) {
        console.error('Failed to run tests!', e);

        process.exit(1);
    }
})();
