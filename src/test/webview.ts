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
// The board logic lives in the scripts of the Webview ('board.js' and
// 'script.js'), as plain global functions, and therefore cannot be imported.
//
// This module loads those scripts, unchanged, into an isolated context, so
// that their functions can be called from tests. The browser API they touch
// while loading is replaced by stubs: nothing is rendered, no message is sent
// to the extension.
//

import * as FS from 'fs';
import * as Path from 'path';
import * as VM from 'vm';

/**
 * A loaded copy of the scripts of the Webview.
 */
export interface WebviewContext {
    /**
     * Calls a global function of the Webview.
     *
     * Arguments and result are passed as JSON, so that both sides work on
     * their own values and cannot leak objects into each other.
     *
     * @param {string} func The name of the function.
     * @param {any[]} [args] The arguments for the function.
     *
     * @return {T} The result of the function.
     */
    call<T = any>(func: string, ...args: any[]): T;

    /**
     * Evaluates code inside the context.
     *
     * @param {string} code The code to evaluate.
     *
     * @return {T} The result of the code.
     */
    eval<T = any>(code: string): T;

    /**
     * Assigns a value to a global variable of the Webview.
     *
     * The variables of 'board.js' are declared with 'let', which does not put
     * them on the global object: they can only be reached by code, that runs
     * inside the context.
     *
     * @param {string} name The name of the variable.
     * @param {any} value The value to assign, as JSON.
     */
    set(name: string, value: any): void;
}

/**
 * The scripts, in the order the Webview loads them (s. 'html.ts').
 */
const SCRIPT_FILES = [
    'filtrex.js',
    'moment-with-locales.min.js',
    'script.js',
    'board.js',
];

/**
 * Anything, that is called on this, returns itself: it stands in for the
 * jQuery object, whose methods are chained.
 */
function createChainableStub(): any {
    const STUB: any = function () {
        return STUB;
    };

    return new Proxy(STUB, {
        apply: () => STUB,
        get: (target, property) => {
            if ('then' === property) {
                return undefined;  // it is not a promise
            }

            return STUB;
        },
    });
}

/**
 * Returns the directory, that holds the scripts of the Webview: the built
 * resources if they are there, the sources otherwise.
 */
function findScriptDir(): string {
    const CANDIDATES = [
        Path.resolve(__dirname, '..', 'res', 'js'),
        Path.resolve(__dirname, '..', '..', 'src', 'res', 'js'),
    ];

    for (const DIR of CANDIDATES) {
        if (FS.existsSync(Path.join(DIR, 'board.js'))) {
            return DIR;
        }
    }

    throw new Error(
        `Scripts of the Webview not found! Looked into: ${ CANDIDATES.join(', ') }`
    );
}

/**
 * Loads the scripts of the Webview into a fresh context.
 *
 * @return {WebviewContext} The loaded context.
 */
export function loadWebview(): WebviewContext {
    const SCRIPT_DIR = findScriptDir();

    const JQUERY = createChainableStub();

    const SANDBOX: any = {
        // the board sends its messages through this one
        vscode: {
            postMessage: () => { },
        },
        // 'vsckb_log()' is defined inline by 'html.ts', not by the scripts
        vsckb_log: () => { },
        $: JQUERY,
        jQuery: JQUERY,
        document: createChainableStub(),
        navigator: { userAgent: 'vscode-kanban tests' },
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
    };
    SANDBOX.window = SANDBOX;
    SANDBOX.self = SANDBOX;
    SANDBOX.globalThis = SANDBOX;

    const CONTEXT = VM.createContext(SANDBOX);

    for (const FILE of SCRIPT_FILES) {
        const FULL_PATH = Path.join(SCRIPT_DIR, FILE);

        VM.runInContext(
            FS.readFileSync(FULL_PATH, 'utf8'),
            CONTEXT,
            { filename: FULL_PATH }
        );
    }

    const EVAL = <T>(code: string): T => {
        return VM.runInContext(code, CONTEXT);
    };

    return {
        call: <T>(func: string, ...args: any[]): T => {
            // 'JSON.stringify(undefined)' is no text at all, which would
            // leave a hole in the call
            const ARGS = args.map(a => undefined === a ? 'undefined'
                                                       : JSON.stringify(a))
                             .join(', ');

            // JSON, so that the result is a value of this side
            const RESULT = EVAL<string>(
                `JSON.stringify( ${ func }(${ ARGS }) )`
            );

            return undefined === RESULT ? undefined
                                        : JSON.parse(RESULT);
        },
        eval: EVAL,
        set: (name: string, value: any) => {
            EVAL(`${ name } = ${ JSON.stringify(value) };`);
        },
    };
}
