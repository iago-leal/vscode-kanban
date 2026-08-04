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
// Test runner loaded by the extension host, via '--extensionTestsPath'.
//
// It replaces the runner that used to be shipped by the (deprecated) 'vscode'
// package as 'vscode/lib/testrunner': Mocha is now a direct development
// dependency and is configured here.
//

import * as FS from 'fs';
import * as Mocha from 'mocha';
import * as Path from 'path';

/**
 * Collects the compiled test files of a directory, recursively.
 *
 * @param {string} dir The directory to scan.
 *
 * @return {string[]} The full paths of the files, that end with '.test.js'.
 */
function collectTestFiles(dir: string): string[] {
    const FILES: string[] = [];

    for (const ENTRY of FS.readdirSync(dir, { withFileTypes: true })) {
        const FULL_PATH = Path.join(dir, ENTRY.name);

        if (ENTRY.isDirectory()) {
            FILES.push(...collectTestFiles(FULL_PATH));
        } else if (ENTRY.name.endsWith('.test.js')) {
            FILES.push(FULL_PATH);
        }
    }

    return FILES.sort();
}

/**
 * The entry point, that is invoked by the extension host.
 *
 * @return {Promise<void>} The promise, that rejects if at least one test failed.
 */
export function run(): Promise<void> {
    const MOCHA = new Mocha({
        color: true,
        ui: 'tdd',  // 'suite()' and 'test()' are used by the test files
    });

    for (const FILE of collectTestFiles(__dirname)) {
        MOCHA.addFile(FILE);
    }

    return new Promise<void>((resolve, reject) => {
        try {
            MOCHA.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} test(s) failed!`));
                } else {
                    resolve();
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}
