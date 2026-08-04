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
// They describe how a board is brought into shape while it is loaded, and how
// the tracked time is summed up, as those rules behave TODAY.
//
// These functions used to be local closures inside the methods, and were
// lifted out unchanged, so that they could be reached from here. The tests
// are what keeps them from drifting.
//
// They run inside the editor, because the modules under test reach for the
// API of Visual Studio Code.
//

import * as assert from 'assert';
import * as Moment from 'moment';
import { BoardCard, findNextSimpleCardId, newBoard, normalizeCardContent } from '../boards';
import { calculateTrackedTime } from '../workspaces';

suite('Identifier of the next card', function () {
    const boardWith = (cards: any) => {
        const BOARD = newBoard();

        for (const COLUMN in cards) {
            BOARD[COLUMN] = cards[COLUMN];
        }

        return BOARD;
    };

    test('starts at 1 on an empty board', function () {
        assert.strictEqual(findNextSimpleCardId(newBoard()), 1);
    });

    test('follows the highest number in use', function () {
        assert.strictEqual(
            findNextSimpleCardId(boardWith({
                todo: [{ id: '1' }, { id: '7' }, { id: '3' }],
            })),
            8
        );
    });

    test('looks into every column', function () {
        assert.strictEqual(
            findNextSimpleCardId(boardWith({
                'todo': [{ id: '1' }],
                'in-progress': [{ id: '4' }],
                'testing': [{ id: '2' }],
                'done': [{ id: '9' }],
            })),
            10
        );
    });

    test('skips an identifier, that is not a number', function () {
        assert.strictEqual(
            findNextSimpleCardId(boardWith({
                todo: [{ id: '2' }, { id: 'a-uuid-like-identifier' }],
            })),
            3
        );
    });

    test('reads the leading number of a mixed identifier', function () {
        // 'parseInt()' stops at the first character it cannot read, so such an
        // identifier does raise the counter
        assert.strictEqual(
            findNextSimpleCardId(boardWith({
                todo: [{ id: '20260802123456_777' }],
            })),
            20260802123457
        );
    });

    test('skips a card without any identifier', function () {
        assert.strictEqual(
            findNextSimpleCardId(boardWith({
                todo: [{ id: '' }, <BoardCard>{}, { id: '5' }],
            })),
            6
        );
    });

    test('is not disturbed by a missing column', function () {
        const BOARD = newBoard();
        delete BOARD['done'];

        assert.strictEqual(findNextSimpleCardId(BOARD), 1);
    });
});

suite('Text of a card', function () {
    const normalized = (value: any) => {
        const CARD: BoardCard = { id: '1', title: 'a card' };
        CARD.description = value;

        normalizeCardContent(CARD, 'description');

        return CARD.description;
    };

    test('becomes plain text, when it is a bare string', function () {
        assert.deepStrictEqual(normalized('a note'), {
            content: 'a note',
            mime: 'text/plain',
        });
    });

    test('keeps Markdown as Markdown', function () {
        assert.deepStrictEqual(normalized({ content: '# title', mime: 'text/markdown' }), {
            content: '# title',
            mime: 'text/markdown',
        });
    });

    test('reads the MIME type without case and spaces', function () {
        assert.deepStrictEqual(normalized({ content: 'x', mime: '  TEXT/Markdown ' }), {
            content: 'x',
            mime: 'text/markdown',
        });
    });

    test('turns any other MIME type into plain text', function () {
        assert.deepStrictEqual(normalized({ content: 'x', mime: 'text/html' }), {
            content: 'x',
            mime: 'text/plain',
        });
    });

    test('treats a missing MIME type as plain text', function () {
        assert.deepStrictEqual(normalized(<any>{ content: 'x' }), {
            content: 'x',
            mime: 'text/plain',
        });
    });

    test('drops an empty text', function () {
        assert.strictEqual(normalized(''), undefined);
        assert.strictEqual(normalized('   '), undefined);
        assert.strictEqual(normalized({ content: '', mime: 'text/markdown' }), undefined);
    });

    test('drops a text, that is not there at all', function () {
        assert.strictEqual(normalized(null), undefined);
        assert.strictEqual(normalized(undefined), undefined);
    });

    test('writes a number down as text', function () {
        assert.deepStrictEqual(normalized(<any>42), {
            content: '42',
            mime: 'text/plain',
        });
    });
});

suite('Tracked time of a card', function () {
    const AT = (minute: number) => {
        return Moment.utc('2026-08-02T10:00:00Z')
                     .add(minute, 'minutes')
                     .toISOString();
    };

    test('is zero, when nothing was tracked', function () {
        const TRACKED = calculateTrackedTime([]);

        assert.strictEqual(TRACKED.seconds, 0);
        assert.strictEqual(TRACKED.lastStartTime, false);
    });

    test('is still zero, while the first period is running', function () {
        const TRACKED = calculateTrackedTime([AT(0)]);

        assert.strictEqual(TRACKED.seconds, 0);
        assert.strictEqual(Moment.isMoment(TRACKED.lastStartTime), true);
    });

    test('counts a period, that has been closed', function () {
        const TRACKED = calculateTrackedTime([AT(0), AT(5)]);

        assert.strictEqual(TRACKED.seconds, 300);
        assert.strictEqual(TRACKED.lastStartTime, false);
    });

    test('adds every closed period up', function () {
        const TRACKED = calculateTrackedTime([AT(0), AT(5), AT(10), AT(12)]);

        assert.strictEqual(TRACKED.seconds, 420);
        assert.strictEqual(TRACKED.lastStartTime, false);
    });

    test('keeps the sum, while a further period is running', function () {
        const TRACKED = calculateTrackedTime([AT(0), AT(5), AT(10)]);

        assert.strictEqual(TRACKED.seconds, 300);
        assert.strictEqual(Moment.isMoment(TRACKED.lastStartTime), true);
    });

    test('counts backwards, when the times are out of order', function () {
        // nothing guards the order of the entries: an end before its start
        // takes time away from the sum
        const TRACKED = calculateTrackedTime([AT(5), AT(0)]);

        assert.strictEqual(TRACKED.seconds, -300);
    });
});
