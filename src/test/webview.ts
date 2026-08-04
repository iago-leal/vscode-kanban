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
// The characterization suite is a safety net, and a safety net is worth
// exactly as much as its independence from the thing it catches. So the
// ASSERTIONS of 'card-sorting.unit.test.ts' and 'card-filter.unit.test.ts' did
// not move by a character while the board was rewritten; only what stands
// behind the names they call did.
//
// It used to be 'board.js' and 'script.js', loaded unchanged into an isolated
// context. It is now the modules of 'src/webview/domain/', reached through a
// facade that keeps the old names, the old signatures and the old quirks.
//
// One of those quirks needs saying out loud. 'vsckb_get_cards_sorted' sorted
// the column IN PLACE, and a test pins that down. Production does not do that
// any more: sorting is pure, and the order reaches the file because
// 'toSavePayload' applies it deliberately (D-07). The facade below reproduces
// the in-place write so that the test still describes the behaviour it was
// written against, and this comment is the record that the two are no longer
// the same mechanism.
//

import * as FS from 'fs';
import * as Path from 'path';
import * as VM from 'vm';

import { compareCards } from '../webview/domain/sorting';
import { createBaseFilterFunctions } from '../webview/domain/filter-functions';
import { createFiltrexEvaluator } from '../webview/adapters/filter-language';
import { createMomentTime } from '../webview/adapters/datetime';
import { doesMatch } from '../webview/domain/filtering';
import { prioritySortValue, typeSortValue } from '../webview/domain/card-taxonomy';

/**
 * A loaded copy of the board logic, behind the names the Webview used.
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
     * @param {string} name The name of the variable.
     * @param {any} value The value to assign, as JSON.
     */
    set(name: string, value: any): void;
}

/**
 * The vendored libraries the domain still reaches through its adapters.
 *
 * They are scripts, not packages: they are loaded once, in isolation, and the
 * one symbol each of them provides is put where the adapters look for it.
 */
const VENDOR_FILES = [
    { file: 'filtrex.js', symbol: 'compileExpression' },
    { file: 'moment-with-locales.min.js', symbol: 'moment' },
];

/**
 * Whether the vendored libraries have already been loaded.
 */
let vendorsLoaded = false;

/**
 * Returns the directory, that holds the vendored scripts.
 */
function findScriptDir(): string {
    const CANDIDATES = [
        Path.resolve(__dirname, '..', 'res', 'js'),
        Path.resolve(__dirname, '..', '..', 'src', 'res', 'js'),
    ];

    for (const DIR of CANDIDATES) {
        if (FS.existsSync(Path.join(DIR, 'filtrex.js'))) {
            return DIR;
        }
    }

    throw new Error(
        `Vendored scripts not found! Looked into: ${ CANDIDATES.join(', ') }`
    );
}

/**
 * Loads the vendored libraries and publishes them as globals.
 *
 * Each script runs in a sandbox of its own, so that nothing else it declares
 * leaks into the test process; only the symbol the adapters ask for is copied
 * out.
 */
function loadVendors(): void {
    if (vendorsLoaded) {
        return;
    }

    const DIR = findScriptDir();

    for (const VENDOR of VENDOR_FILES) {
        const FULL_PATH = Path.join(DIR, VENDOR.file);

        if (!FS.existsSync(FULL_PATH)) {
            continue;
        }

        const SANDBOX: any = { console: console };
        SANDBOX.window = SANDBOX;
        SANDBOX.self = SANDBOX;
        SANDBOX.globalThis = SANDBOX;

        VM.createContext(SANDBOX);

        VM.runInContext(
            FS.readFileSync(FULL_PATH, 'utf8'),
            SANDBOX,
            { filename: FULL_PATH }
        );

        if (SANDBOX[VENDOR.symbol]) {
            (global as any)[VENDOR.symbol] = SANDBOX[VENDOR.symbol];
        }
    }

    vendorsLoaded = true;
}

/**
 * Builds the facade the tests call through.
 *
 * @return {WebviewContext} The loaded context.
 */
export function loadWebview(): WebviewContext {
    loadVendors();

    const TIME = createMomentTime();
    const EVALUATE = createFiltrexEvaluator();
    const BASE_FUNCS = createBaseFilterFunctions(TIME);

    const SANDBOX: any = {
        console: console,
        JSON: JSON,

        /**
         * The board, as the Webview used to hold it: a mutable global the
         * tests assign to and read back.
         */
        allCards: undefined,

        vsckb_does_match: (expr: any, opts?: any) => {
            return doesMatch(expr, opts, EVALUATE, BASE_FUNCS);
        },

        vsckb_get_card_prio_sort_val: (card: any) => prioritySortValue(card || {}),

        vsckb_get_card_type_sort_val: (card: any) => typeSortValue(card || {}),

        /**
         * The cards of a column, ordered.
         *
         * The column is sorted where it lies, and a column that does not exist
         * fails on '.sort' -- both of them on purpose, s. the note at the top
         * of this file.
         */
        vsckb_get_cards_sorted: (column: string) => {
            return SANDBOX.allCards[column].sort(compareCards);
        },
    };

    SANDBOX.window = SANDBOX;
    SANDBOX.self = SANDBOX;
    SANDBOX.globalThis = SANDBOX;

    const CONTEXT = VM.createContext(SANDBOX);

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
