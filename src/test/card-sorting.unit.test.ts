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
// They describe how the sorting of the cards behaves TODAY, including what
// looks like a defect. They are the safety net for the refactoring of
// 'board.js': a failure means the behaviour changed. If the change was
// intended, the test is updated on purpose, never by accident.
//

import * as assert from 'assert';
import { loadWebview, WebviewContext } from './webview';

suite('Sorting of the cards', function () {
    let webview: WebviewContext;

    setup(() => {
        webview = loadWebview();
    });

    const idsOf = (cards: any[]) => cards.map(c => c.id);

    const sortColumn = (cards: any[]) => {
        webview.set('allCards', { todo: cards });

        return idsOf(
            webview.call<any[]>('vsckb_get_cards_sorted', 'todo')
        );
    };

    suite('the value a priority is sorted by', function () {
        test('is the number itself', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_prio_sort_val', { prio: 5 }), 5
            );
        });

        test('is parsed out of a string', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_prio_sort_val', { prio: '7' }), 7
            );
        });

        test('is the leading number of a dirty string', function () {
            // 'parseFloat()' stops at the first character it cannot read
            assert.strictEqual(
                webview.call('vsckb_get_card_prio_sort_val', { prio: '5xyz' }), 5
            );
        });

        test('is 0 for a string without any number', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_prio_sort_val', { prio: 'abc' }), 0
            );
        });

        test('is 0 for a missing priority', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_prio_sort_val', {}), 0
            );
        });
    });

    suite('the value a type is sorted by', function () {
        test("puts 'emergency' first", function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_type_sort_val', { type: 'emergency' }), -2
            );
        });

        test("puts 'bug' after an emergency", function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_type_sort_val', { type: 'bug' }), -1
            );
        });

        test('is 0 for any other type', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_type_sort_val', { type: 'note' }), 0
            );
            assert.strictEqual(
                webview.call('vsckb_get_card_type_sort_val', {}), 0
            );
        });

        test('ignores case and surrounding spaces', function () {
            assert.strictEqual(
                webview.call('vsckb_get_card_type_sort_val', { type: '  EMERGENCY  ' }), -2
            );
        });
    });

    suite('a column', function () {
        test('is sorted by descending priority', function () {
            assert.deepStrictEqual(
                sortColumn([
                    { id: 'low', title: 'a', prio: 1 },
                    { id: 'high', title: 'a', prio: 9 },
                    { id: 'mid', title: 'a', prio: 5 },
                ]),
                ['high', 'mid', 'low']
            );
        });

        test('is sorted by type, when the priority ties', function () {
            assert.deepStrictEqual(
                sortColumn([
                    { id: 'plain', title: 'a', prio: 1, type: '' },
                    { id: 'bug', title: 'a', prio: 1, type: 'bug' },
                    { id: 'emergency', title: 'a', prio: 1, type: 'emergency' },
                ]),
                ['emergency', 'bug', 'plain']
            );
        });

        test('is sorted by title, when priority and type tie', function () {
            assert.deepStrictEqual(
                sortColumn([
                    { id: 'z', title: 'Zebra', prio: 1 },
                    { id: 'a', title: 'Alfa', prio: 1 },
                    { id: 'm', title: 'Malta', prio: 1 },
                ]),
                ['a', 'm', 'z']
            );
        });

        test('compares titles without case and surrounding spaces', function () {
            assert.deepStrictEqual(
                sortColumn([
                    { id: 'upper', title: '  ZEBRA ', prio: 1 },
                    { id: 'lower', title: 'alfa', prio: 1 },
                ]),
                ['lower', 'upper']
            );
        });

        test('puts a card without priority last, as if it were 0', function () {
            assert.deepStrictEqual(
                sortColumn([
                    { id: 'none', title: 'a' },
                    { id: 'one', title: 'a', prio: 1 },
                ]),
                ['one', 'none']
            );
        });

        test('sorts an empty column into an empty result', function () {
            assert.deepStrictEqual(sortColumn([]), []);
        });
    });

    suite('sorting a column', function () {
        test('also reorders the cards of the board itself', function () {
            // 'sort()' works in place: 'allCards' is left sorted as a side
            // effect, which the callers rely upon
            webview.set('allCards', {
                todo: [
                    { id: 'low', title: 'a', prio: 1 },
                    { id: 'high', title: 'a', prio: 9 },
                ],
            });

            webview.call('vsckb_get_cards_sorted', 'todo');

            const IDS = JSON.parse(
                webview.eval<string>('JSON.stringify( allCards.todo.map(c => c.id) )')
            );

            assert.deepStrictEqual(IDS, ['high', 'low']);
        });

        test('fails for a column, that does not exist', function () {
            webview.set('allCards', { todo: [] });

            // the error comes from inside the context, so it is matched by its
            // message: 'instanceof' does not hold across contexts
            assert.throws(() => {
                webview.call('vsckb_get_cards_sorted', 'there-is-no-such-column');
            }, /sort/);
        });
    });
});
