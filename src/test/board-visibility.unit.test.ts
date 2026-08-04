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
// What the board shows: ordering, filter, hiding and collapsing composed.
//
// The set of cards of the list layout must equal the set of the columns
// layout. These tests are what makes that a rule instead of a hope.
//

import * as assert from 'assert';
import { Board, BoardCard } from '../webview/domain/types';
import { computeVisibleBoard } from '../webview/domain/visibility';
import { sortBoardForPersistence } from '../webview/domain/sorting';
import { normalizeViewState, withHideDone } from '../webview/domain/view-state';

suite('What the board shows', function () {
    const card = (id: string, extra: Partial<BoardCard> = {}): BoardCard => {
        return { id: id, title: id, ...extra };
    };

    const BOARD: Board = {
        'todo': [
            card('t-low', { prio: 1 }),
            card('t-high', { prio: 9 }),
            card('t-bug', { prio: 1, type: 'bug' }),
        ],
        'in-progress': [card('p-1')],
        'testing': [card('s-1')],
        'done': [card('d-1'), card('d-2'), card('d-3'), card('d-4')],
    };

    const DEFAULT_STATE = normalizeViewState({});

    const idsOf = (visible: ReturnType<typeof computeVisibleBoard>) =>
        visible.cards.map(c => c.card.id);

    const isBug = (c: BoardCard) => 'bug' === c.type;

    suite('without any filter or hiding', function () {
        test('shows every card of every column', function () {
            const VISIBLE = computeVisibleBoard(BOARD, DEFAULT_STATE);

            assert.strictEqual(VISIBLE.cards.length, 9);
            assert.strictEqual(VISIBLE.hiddenCount, 0);
        });

        test('orders each column by priority, then type, then title', function () {
            const VISIBLE = computeVisibleBoard(BOARD, DEFAULT_STATE);

            assert.deepStrictEqual(
                VISIBLE.columns[0].cards.map(c => c.id),
                ['t-high', 't-bug', 't-low']
            );
        });

        test('leaves the board it received untouched', function () {
            const BEFORE = JSON.stringify(BOARD);

            computeVisibleBoard(BOARD, DEFAULT_STATE);

            assert.strictEqual(JSON.stringify(BOARD), BEFORE);
        });
    });

    suite('hiding the finished cards', function () {
        const HIDDEN = withHideDone(DEFAULT_STATE, true);

        test('shows none of them', function () {
            const VISIBLE = computeVisibleBoard(BOARD, HIDDEN);

            assert.strictEqual(
                idsOf(VISIBLE).filter(id => id.startsWith('d-')).length, 0
            );
        });

        test('drops the count of visible cards by exactly that many', function () {
            const SHOWN = computeVisibleBoard(BOARD, DEFAULT_STATE);
            const AFTER = computeVisibleBoard(BOARD, HIDDEN);

            assert.strictEqual(
                SHOWN.cards.length - AFTER.cards.length, BOARD.done.length
            );
        });

        test('keeps the column identifiable, with what it holds', function () {
            const VISIBLE = computeVisibleBoard(BOARD, HIDDEN);
            const DONE = VISIBLE.columns.filter(c => 'done' === c.key)[0];

            assert.strictEqual(DONE.collapsed, true);
            assert.strictEqual(DONE.hiddenCount, 4);
            assert.deepStrictEqual(DONE.cards, []);
        });

        test('says how many cards are hidden altogether', function () {
            const VISIBLE = computeVisibleBoard(BOARD, HIDDEN);

            assert.strictEqual(VISIBLE.hiddenCount, 4);
        });

        test('restores the very same order once turned off', function () {
            const BEFORE = idsOf(computeVisibleBoard(BOARD, DEFAULT_STATE));
            const AFTER = idsOf(
                computeVisibleBoard(BOARD, withHideDone(HIDDEN, false))
            );

            assert.deepStrictEqual(AFTER, BEFORE);
        });

        test('shows the remaining columns of an empty board', function () {
            const EMPTY: Board = {
                'todo': [], 'in-progress': [], 'testing': [], 'done': [],
            };

            const VISIBLE = computeVisibleBoard(EMPTY, HIDDEN);
            const DONE = VISIBLE.columns.filter(c => 'done' === c.key)[0];

            assert.strictEqual(VISIBLE.columns.length, 4);
            assert.strictEqual(DONE.hiddenCount, 0);
        });
    });

    suite('the filter and the hiding together', function () {
        test('compose by conjunction', function () {
            const VISIBLE = computeVisibleBoard(
                BOARD, withHideDone(DEFAULT_STATE, true), isBug
            );

            assert.deepStrictEqual(idsOf(VISIBLE), ['t-bug']);
        });

        test('count the rejected cards apart from the hidden ones', function () {
            const VISIBLE = computeVisibleBoard(
                BOARD, withHideDone(DEFAULT_STATE, true), isBug
            );

            // eight cards are not bugs; of those, the four finished ones
            // would have been hidden anyway
            assert.strictEqual(VISIBLE.filteredOutCount, 8);
            assert.strictEqual(VISIBLE.hiddenCount, 0);
        });
    });

    suite('the list layout', function () {
        test('holds exactly the cards of the visible columns', function () {
            const STATE = withHideDone(DEFAULT_STATE, true);
            const VISIBLE = computeVisibleBoard(BOARD, STATE, isBug);

            const FROM_COLUMNS = VISIBLE.columns
                .filter(c => !c.collapsed)
                .reduce<string[]>(
                    (acc, c) => acc.concat(c.cards.map(x => x.id as string)), []
                );

            assert.deepStrictEqual(idsOf(VISIBLE), FROM_COLUMNS);
        });

        test('says which column each card belongs to', function () {
            const VISIBLE = computeVisibleBoard(BOARD, DEFAULT_STATE);

            assert.strictEqual(VISIBLE.cards[0].column, 'todo');
            assert.strictEqual(
                VISIBLE.cards[VISIBLE.cards.length - 1].column, 'done'
            );
        });
    });

    suite('the order written to the file', function () {
        test('is the ordered one, as it has always been', function () {
            // the old sorting mutated the board, so the order shown became
            // the order saved: that effect is kept, on purpose
            const SORTED = sortBoardForPersistence(BOARD);

            assert.deepStrictEqual(
                SORTED.todo.map(c => c.id), ['t-high', 't-bug', 't-low']
            );
        });

        test('never loses a card of a collapsed column', function () {
            const SORTED = sortBoardForPersistence(BOARD);

            assert.strictEqual(SORTED.done.length, BOARD.done.length);
        });
    });
});
