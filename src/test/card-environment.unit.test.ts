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
// What a card offers to a filter expression.
//
// 'card-filter.unit.test.ts' describes the LANGUAGE; this one describes the
// ENVIRONMENT a single card puts in front of it: the two vocabularies of the
// type, the questions about age, and the fields that stay absent when the card
// has none.
//

import * as assert from 'assert';

import { BoardCard } from '../webview/domain/types';
import { createBaseFilterFunctions } from '../webview/domain/filter-functions';
import { createCardEnvironment, createCardPredicate } from '../webview/domain/filtering';
import { createFiltrexEvaluator } from '../webview/adapters/filter-language';
import { createMomentTime } from '../webview/adapters/datetime';
import { loadWebview } from './webview';

const TIME = createMomentTime();

/**
 * The values a card puts in front of an expression.
 */
function valuesOf(card: BoardCard): any {
    return createCardEnvironment(card, TIME).values || {};
}

/**
 * The functions a card puts in front of an expression.
 */
function funcsOf(card: BoardCard): any {
    return createCardEnvironment(card, TIME).funcs || {};
}

/**
 * A time that many days in the past, as the board writes it.
 */
function daysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

suite('What a card offers to the filter', function () {
    suiteSetup(() => {
        // publishes the vendored libraries the adapters look for
        loadWebview();
    });

    suite('the type', function () {
        test("counts 'issue' as a bug, though the selector never offers it", function () {
            const VALUES = valuesOf({ title: 'a', type: 'issue' });

            assert.strictEqual(VALUES.is_bug, true);
            assert.strictEqual(VALUES.is_issue, true);
            assert.strictEqual(VALUES.is_note, false);
        });

        test("counts an empty type, 'note' and 'task' as a note", function () {
            for (const TYPE of ['', 'note', 'task', undefined]) {
                assert.strictEqual(
                    valuesOf({ title: 'a', type: TYPE }).is_note, true,
                    `Type ${ JSON.stringify(TYPE) } is not a note`
                );
            }
        });

        test('is compared without case or surrounding spaces', function () {
            assert.strictEqual(
                valuesOf({ title: 'a', type: '  EMERGENCY  ' }).is_emergency, true
            );
        });

        test('arrives normalised', function () {
            assert.strictEqual(valuesOf({ title: 'a', type: '  BUG ' }).type, 'bug');
        });
    });

    suite('the priority', function () {
        test('counts by its leading number', function () {
            assert.strictEqual(valuesOf({ title: 'a', prio: '5xyz' as any }).prio, 5);
        });

        test('is zero when it cannot be read', function () {
            assert.strictEqual(valuesOf({ title: 'a' }).prio, 0);
            assert.strictEqual(valuesOf({ title: 'a', prio: 'abc' as any }).priority, 0);
        });
    });

    suite('the text fields', function () {
        test('are read out of either shape the file may hold', function () {
            assert.strictEqual(
                valuesOf({ title: 'a', description: 'plain' }).description, 'plain'
            );
            assert.strictEqual(
                valuesOf({ title: 'a', description: { content: 'wrapped' } }).description,
                'wrapped'
            );
        });

        test('stay absent when the card has none', function () {
            // an expression asking 'is_nil(details)' has to keep answering
            // true, so an absent field must not become an empty string
            assert.strictEqual(valuesOf({ title: 'a' }).details, undefined);
        });
    });

    suite('the questions about age', function () {
        test('answer false for a card with no creation time', function () {
            const FUNCS = funcsOf({ title: 'a' });

            assert.strictEqual(FUNCS.is_older(1), false);
            assert.strictEqual(FUNCS.is_younger(1), false);
            assert.strictEqual(FUNCS.is_after('2020-01-01'), false);
            assert.strictEqual(FUNCS.is_before('2020-01-01'), false);
        });

        test('count whole days, not hours', function () {
            const FUNCS = funcsOf({ title: 'a', creation_time: daysAgo(3) });

            assert.strictEqual(FUNCS.is_older(2), true);
            assert.strictEqual(FUNCS.is_older(3), false);
            assert.strictEqual(FUNCS.is_older(3, true), true);
            assert.strictEqual(FUNCS.is_younger(4), true);
            assert.strictEqual(FUNCS.is_younger(3), false);
            assert.strictEqual(FUNCS.is_younger(3, true), true);
        });

        test('compare instants at full precision', function () {
            const FUNCS = funcsOf({ title: 'a', creation_time: '2020-06-15T12:00:00Z' });

            assert.strictEqual(FUNCS.is_after('2020-06-15T11:00:00Z'), true);
            assert.strictEqual(FUNCS.is_after('2020-06-15T13:00:00Z'), false);
            assert.strictEqual(FUNCS.is_before('2020-06-15T13:00:00Z'), true);
            assert.strictEqual(FUNCS.is_after('2020-06-15T12:00:00Z'), false);
            assert.strictEqual(FUNCS.is_after('2020-06-15T12:00:00Z', true), true);
        });

        test('answer false for a date that cannot be read', function () {
            const FUNCS = funcsOf({ title: 'a', creation_time: '2020-06-15T12:00:00Z' });

            assert.strictEqual(FUNCS.is_after('not a date'), false);
        });
    });

    suite('the category', function () {
        test('is matched without case or surrounding spaces', function () {
            const FUNCS = funcsOf({ title: 'a', category: 'Frontend' });

            assert.strictEqual(FUNCS.is_cat('  frontend '), true);
            assert.strictEqual(FUNCS.is_category('backend'), false);
        });
    });

    suite('the predicate the board renders with', function () {
        const BASE_FUNCS = createBaseFilterFunctions(TIME);
        const EVALUATE = createFiltrexEvaluator();

        const predicate = (expr: unknown) => {
            return createCardPredicate(expr, EVALUATE, BASE_FUNCS, TIME);
        };

        test('accepts everything, when the expression is blank', function () {
            for (const EXPR of ['', '   ', null, undefined]) {
                assert.strictEqual(
                    predicate(EXPR)({ title: 'a' }, 'todo'), true,
                    `Expression ${ JSON.stringify(EXPR) } rejected a card`
                );
            }
        });

        test('reads the card it is given', function () {
            const MATCHES = predicate('is_bug');

            assert.strictEqual(MATCHES({ title: 'a', type: 'bug' }, 'todo'), true);
            assert.strictEqual(MATCHES({ title: 'a', type: 'note' }, 'todo'), false);
        });

        test('rejects a card that is not there at all', function () {
            assert.strictEqual(
                predicate('is_bug')(undefined as any, 'todo'), false
            );
        });

        test('accepts everything, when the expression is broken', function () {
            // the permissive failure of the old board, preserved
            assert.strictEqual(
                predicate('type ==')({ title: 'a', type: 'note' }, 'todo'), true
            );
        });
    });
});
