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
// The rules the board changes itself by.
//
// Adding, moving and removing a card; naming a column and knowing where a card
// may go from it; numbering a new card; counting a task list; and building the
// payload that is written to the file. None of it needs a browser, and all of
// it decides what ends up on disk.
//

import * as assert from 'assert';

import { Board, BoardCard, ColumnKey } from '../webview/domain/types';
import {
    addCard,
    clearColumn,
    findCard,
    moveCard,
    removeCard,
    updateCard,
} from '../webview/domain/board-operations';
import { columnName, movesFrom, namedColumns } from '../webview/domain/columns';
import { columnOfCard, otherCards, withUids } from '../webview/domain/identity';
import { longCardId, nextCardId, nextSimpleCardId } from '../webview/domain/card-id';
import { taskProgressOf } from '../webview/domain/task-progress';
import { toSavePayload } from '../webview/bridge/save-board';

/**
 * A board with one card per column, already identified.
 */
function makeBoard(): Board {
    return {
        'todo': [{ title: 'a', id: '1', __uid: 'u1' }],
        'in-progress': [{ title: 'b', id: '2', __uid: 'u2' }],
        'testing': [{ title: 'c', id: '3', __uid: 'u3' }],
        'done': [{ title: 'd', id: '4', __uid: 'u4' }],
    };
}

suite('Changes to the board', function () {
    test('adding a card leaves the board it was given alone', function () {
        const BEFORE = makeBoard();

        const AFTER = addCard(BEFORE, 'todo', { title: 'new', __uid: 'u9' });

        assert.strictEqual(BEFORE.todo.length, 1);
        assert.strictEqual(AFTER.todo.length, 2);
    });

    test('updating a card replaces it wherever it is', function () {
        const AFTER = updateCard(
            makeBoard(), 'u3', card => ({ ...card, title: 'changed' })
        );

        assert.strictEqual(AFTER.testing[0].title, 'changed');
        assert.strictEqual(AFTER.todo[0].title, 'a');
    });

    test('removing a card takes it out of its column', function () {
        const AFTER = removeCard(makeBoard(), 'u2');

        assert.strictEqual(AFTER['in-progress'].length, 0);
        assert.strictEqual(findCard(AFTER, 'u2'), undefined);
    });

    test('moving a card appends it to the end of the target column', function () {
        const BEFORE = addCard(makeBoard(), 'done', { title: 'z', __uid: 'u8' });

        const AFTER = moveCard(BEFORE, 'u1', 'done');

        assert.strictEqual(AFTER.todo.length, 0);
        assert.deepStrictEqual(
            AFTER.done.map(c => c.__uid), ['u4', 'u8', 'u1']
        );
    });

    test('moving a card to the column it is already in changes nothing', function () {
        const BEFORE = makeBoard();

        assert.strictEqual(moveCard(BEFORE, 'u1', 'todo'), BEFORE);
    });

    test('moving a card that is not there changes nothing', function () {
        const BEFORE = makeBoard();

        assert.strictEqual(moveCard(BEFORE, 'nope', 'done'), BEFORE);
    });

    test('clearing a column empties only that one', function () {
        const AFTER = clearColumn(makeBoard(), 'done');

        assert.deepStrictEqual(AFTER.done, []);
        assert.strictEqual(AFTER.todo.length, 1);
    });
});

suite('Identity of a card within a session', function () {
    test('every card gets one, and no two are the same', function () {
        const BOARD = withUids(makeBoard());

        const UIDS = ([] as string[]).concat(
            ...(['todo', 'in-progress', 'testing', 'done'] as ColumnKey[])
                .map(c => BOARD[c].map(card => String(card.__uid)))
        );

        assert.strictEqual(UIDS.length, 4);
        assert.strictEqual(new Set(UIDS).size, 4);
    });

    test('the shape is the one of the old board', function () {
        const BOARD = withUids(makeBoard());

        // '<index>-<random>-<milliseconds>'
        assert.ok(
            /^\d+-\d+-\d+$/.test(String(BOARD.todo[0].__uid)),
            `Unexpected shape: ${ BOARD.todo[0].__uid }`
        );
    });

    test('the board it was given is left untouched', function () {
        const BEFORE = makeBoard();

        withUids(BEFORE);

        assert.strictEqual(BEFORE.todo[0].__uid, 'u1');
    });

    test('a card can be found by the column it sits in', function () {
        assert.strictEqual(columnOfCard(makeBoard(), 'u3'), 'testing');
        assert.strictEqual(columnOfCard(makeBoard(), 'nope'), undefined);
    });

    suite('the other cards of an event', function () {
        test('leave out the card the event is about', function () {
            const OTHERS = otherCards(makeBoard(), { title: 'a', __uid: 'u1' });

            assert.strictEqual(OTHERS.todo, undefined);
            assert.strictEqual((OTHERS.testing || []).length, 1);
        });

        test('leave out a column that holds no other card entirely', function () {
            // an empty column is ABSENT, not present and empty: that is the
            // shape event scripts already read
            const OTHERS = otherCards(makeBoard(), { title: 'a', __uid: 'u1' });

            assert.ok(!('todo' in OTHERS));
        });

        test('are all of them, when the event is about no card', function () {
            const OTHERS = otherCards(makeBoard());

            assert.strictEqual(Object.keys(OTHERS).length, 4);
        });
    });
});

suite('The columns', function () {
    test('are named by the workspace, when it says so', function () {
        assert.strictEqual(
            columnName('done', { columns: { done: { name: 'Shipped' } } }),
            'Shipped'
        );
    });

    test('fall back to their own name, when the workspace says nothing', function () {
        assert.strictEqual(columnName('done'), 'Done');
        assert.strictEqual(columnName('in-progress', {}), 'In Progress');
        assert.strictEqual(
            columnName('todo', { columns: { todo: { name: '   ' } } }), 'Todo'
        );
    });

    test('come back in the order of the board', function () {
        assert.deepStrictEqual(
            namedColumns().map(c => c.key),
            ['todo', 'in-progress', 'testing', 'done']
        );
    });

    suite('the moves each one offers', function () {
        test("are only 'start' from the first column", function () {
            assert.deepStrictEqual(movesFrom('todo').map(m => m.to), ['in-progress']);
        });

        test('are three from the one being worked on', function () {
            assert.deepStrictEqual(
                movesFrom('in-progress').map(m => m.to), ['todo', 'testing', 'done']
            );
        });

        test('let a finished card be reopened', function () {
            assert.deepStrictEqual(
                movesFrom('done').map(m => m.to), ['testing', 'in-progress']
            );
        });

        test('tell the icon apart from the target', function () {
            // going back to 'in-progress' from 'testing' is a rejection, and
            // from 'done' it is a reopening
            assert.strictEqual(
                movesFrom('testing').find(m => 'in-progress' === m.to)!.icon, 'reject'
            );
            assert.strictEqual(
                movesFrom('done').find(m => 'in-progress' === m.to)!.icon, 'redo'
            );
        });
    });
});

suite('The identifier of a new card', function () {
    test('is one past the highest number already used', function () {
        assert.strictEqual(nextSimpleCardId(makeBoard()), 5);
    });

    test('skips an identifier that is not a number', function () {
        const BOARD = makeBoard();
        BOARD.todo[0].id = 'not-a-number';

        assert.strictEqual(nextSimpleCardId(BOARD), 5);
    });

    test('starts at one on an empty board', function () {
        assert.strictEqual(
            nextSimpleCardId({ 'todo': [], 'in-progress': [], 'testing': [], 'done': [] }),
            1
        );
    });

    test('is the simple one unless the workspace turns it off', function () {
        const CREATION = new Date('2020-01-02T03:04:05Z');

        assert.strictEqual(nextCardId(makeBoard(), CREATION), '5');
        assert.strictEqual(nextCardId(makeBoard(), CREATION, true), '5');
        assert.notStrictEqual(nextCardId(makeBoard(), CREATION, false), '5');
    });

    test('carries the moment of creation, when it is the long one', function () {
        const ID = longCardId(new Date('2020-01-02T03:04:05Z'));

        assert.ok(
            /^20200102030405_\d+_[0-9a-f]{32}$/.test(ID),
            `Unexpected shape: ${ ID }`
        );
    });
});

suite('The progress of a task list', function () {
    test('is nothing at all, when there is no list', function () {
        assert.strictEqual(taskProgressOf('just a description'), undefined);
    });

    test('is nothing at all, while nothing is ticked', function () {
        // an untouched list draws no bar, as it never has
        assert.strictEqual(taskProgressOf('- [ ] one\n- [ ] two'), undefined);
    });

    test('counts what is ticked against the whole list', function () {
        const PROGRESS = taskProgressOf('- [x] one\n- [ ] two\n- [ ] three');

        assert.strictEqual(PROGRESS!.checked, 1);
        assert.strictEqual(PROGRESS!.total, 3);
        assert.ok(Math.abs(PROGRESS!.percentage - 33.33) < 0.01);
    });

    test('counts the description and the details together', function () {
        const PROGRESS = taskProgressOf('- [x] one', '- [ ] two');

        assert.strictEqual(PROGRESS!.checked, 1);
        assert.strictEqual(PROGRESS!.total, 2);
    });

    test('accepts either marker and either case', function () {
        const PROGRESS = taskProgressOf('* [X] one\n+ [x] two\n- [ ] three');

        assert.strictEqual(PROGRESS!.checked, 2);
        assert.strictEqual(PROGRESS!.total, 3);
    });

    test('ignores what is not a list', function () {
        assert.strictEqual(taskProgressOf(undefined, 42, null), undefined);
    });
});

suite('What is written to the file', function () {
    test('never carries the identity of the session', function () {
        const PAYLOAD = toSavePayload(makeBoard());

        for (const COLUMN of ['todo', 'in-progress', 'testing', 'done'] as ColumnKey[]) {
            for (const CARD of PAYLOAD[COLUMN]) {
                assert.ok(!('__uid' in CARD), 'A card kept its __uid');
            }
        }
    });

    test('carries the columns in display order', function () {
        const BOARD: Board = {
            'todo': [
                { title: 'low', id: 'low', prio: 1 } as BoardCard,
                { title: 'high', id: 'high', prio: 9 } as BoardCard,
            ],
            'in-progress': [],
            'testing': [],
            'done': [],
        };

        assert.deepStrictEqual(
            toSavePayload(BOARD).todo.map(c => c.id), ['high', 'low']
        );
    });

    test('leaves the board it was given untouched', function () {
        const BEFORE = makeBoard();

        toSavePayload(BEFORE);

        assert.strictEqual(BEFORE.todo[0].__uid, 'u1');
    });
});
