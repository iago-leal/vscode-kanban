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
// CHARACTERIZATION TESTS
//
// They describe how the filter of the cards behaves TODAY, including what
// looks like a defect: a broken expression shows every card, and the result
// is sometimes a number, sometimes a boolean.
//
// The visual filter controls are meant to be built on top of this function,
// so this is the contract that must not move by accident.
//

import * as assert from 'assert';
import { loadWebview, WebviewContext } from './webview';

suite('Filter of the cards', function () {
    let webview: WebviewContext;

    setup(() => {
        webview = loadWebview();
    });

    const matches = (expr: any, values?: any) => {
        return webview.call('vsckb_does_match', expr, { values: values || {} });
    };

    suite('an expression, that decides nothing,', function () {
        test('shows the card, when it is empty', function () {
            assert.strictEqual(matches(''), true);
        });

        test('shows the card, when it is only spaces', function () {
            assert.strictEqual(matches('   '), true);
        });

        test('shows the card, when it is null', function () {
            assert.strictEqual(matches(null), true);
        });

        test('shows the card, when it is missing', function () {
            assert.strictEqual(matches(undefined), true);
        });
    });

    suite('a broken expression', function () {
        test('shows the card, instead of reporting the error', function () {
            // the error is swallowed and only written to the log: the user
            // cannot tell 'no card matches' from 'my filter is broken'
            assert.strictEqual(matches('type =='), true);
            assert.strictEqual(matches('=== nonsense ==='), true);
        });
    });

    suite('a comparison', function () {
        test('answers 1, when it holds', function () {
            // a number, not a boolean: it comes straight out of Filtrex
            assert.strictEqual(matches('type == "bug"', { type: 'bug' }), 1);
        });

        test('answers 0, when it does not hold', function () {
            assert.strictEqual(matches('type == "bug"', { type: 'note' }), 0);
        });

        test('compares numbers', function () {
            assert.strictEqual(matches('prio > 5', { prio: 9 }), 1);
            assert.strictEqual(matches('prio > 5', { prio: 1 }), 0);
        });

        test('hides the card, when the value is not known', function () {
            assert.strictEqual(matches('there_is_no_such_value == 1'), 0);
        });

        test('hides every card, when the expression is just 0', function () {
            assert.strictEqual(matches(0), 0);
        });
    });

    suite('the functions of the filter', function () {
        test("'all' asks for every part to be found", function () {
            // they answer with a boolean, unlike the comparisons above
            assert.strictEqual(
                matches('all(title, "foo", "bar")', { title: 'Foo and BAR' }), true
            );
            assert.strictEqual(
                matches('all(title, "foo", "zzz")', { title: 'foo bar' }), false
            );
        });

        test("'any' asks for at least one part", function () {
            assert.strictEqual(
                matches('any(title, "zzz", "bar")', { title: 'foo bar' }), true
            );
            assert.strictEqual(
                matches('any(title, "zzz")', { title: 'foo bar' }), false
            );
        });

        test("'all' and 'any' ignore case and surrounding spaces", function () {
            assert.strictEqual(
                matches('all(title, "  FOO  ")', { title: 'foo' }), true
            );
        });

        test("'regex' matches a pattern", function () {
            assert.strictEqual(
                matches('regex(title, "^foo")', { title: 'foobar' }), true
            );
            assert.strictEqual(
                matches('regex(title, "^bar")', { title: 'foobar' }), false
            );
        });

        test("'concat' joins values", function () {
            assert.strictEqual(
                matches('concat(a, b) == "xy"', { a: 'x', b: 'y' }), 1
            );
        });

        test("'str_invoke' calls a method of the string", function () {
            assert.strictEqual(
                matches('str_invoke(title, "toUpperCase") == "FOO"', { title: 'foo' }), 1
            );
        });

        test("'unix' turns a time into a timestamp", function () {
            assert.strictEqual(
                matches('unix("2020-01-01T00:00:00Z", true) == 1577836800'), 1
            );
        });
    });

    suite('the options', function () {
        test('may be left out entirely', function () {
            assert.strictEqual(
                webview.call('vsckb_does_match', '1 == 1'), 1
            );
        });

        test('may add functions of their own', function () {
            // functions cannot travel as JSON, so this one is defined inside
            // the context itself
            assert.strictEqual(
                webview.eval(
                    'vsckb_does_match("double(2) == 4", { funcs: { double: (n) => n * 2 } })'
                ),
                1
            );
        });
    });
});
