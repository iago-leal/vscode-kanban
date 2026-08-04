/**
 * What the board shows when there is nothing to show.
 *
 * An empty board and an empty card are the two states an interface is most
 * likely to get wrong, because neither is what anybody has in front of them
 * while building it. A board with no cards has to look like a board with four
 * columns waiting, not like a board that failed to load; and a card whose
 * title and description are both empty has to stay on screen and stay
 * addressable, because a card that disappears cannot be repaired by the person
 * who created it by accident.
 *
 * Both are decided before anything is rendered, by the single function that
 * works out what the board shows, so both are checked here rather than in a
 * component.
 */

import * as assert from 'assert';

import { Board, BoardCard, COLUMN_KEYS } from '../webview/domain/types';
import { computeVisibleBoard } from '../webview/domain/visibility';
import { normalizeViewState } from '../webview/domain/view-state';
import { withUids } from '../webview/domain/identity';

/**
 * A board with nothing in it.
 */
function emptyBoard(): Board {
    return {
        'todo': [],
        'in-progress': [],
        'testing': [],
        'done': [],
    };
}

suite('A board with nothing on it', function () {
    const VISIBLE = computeVisibleBoard(emptyBoard(), normalizeViewState(undefined));

    test('shows the four columns all the same', function () {
        assert.deepStrictEqual(
            VISIBLE.columns.map(c => c.key), COLUMN_KEYS.slice()
        );
    });

    test('shows each of them counting zero', function () {
        for (const COLUMN of VISIBLE.columns) {
            assert.strictEqual(
                COLUMN.matchingCount, 0,
                `'${ COLUMN.key }' counted ${ COLUMN.matchingCount }`
            );
            assert.deepStrictEqual(COLUMN.cards, []);
            assert.strictEqual(COLUMN.collapsed, false);
        }
    });

    test('hides nothing and filters nothing out', function () {
        assert.deepStrictEqual(VISIBLE.cards, []);
        assert.strictEqual(VISIBLE.hiddenCount, 0);
        assert.strictEqual(VISIBLE.filteredOutCount, 0);
    });

    test('is still four columns when the file gave none at all', function () {
        // a board that arrives without a column, which the file is free to do,
        // is four columns of nothing rather than a crash
        const VISIBLE_FROM_NOTHING = computeVisibleBoard(
            {} as Board, normalizeViewState(undefined)
        );

        assert.deepStrictEqual(
            VISIBLE_FROM_NOTHING.columns.map(c => c.key), COLUMN_KEYS.slice()
        );
        assert.strictEqual(VISIBLE_FROM_NOTHING.cards.length, 0);
    });
});

suite('A card with nothing written on it', function () {
    const BLANK: BoardCard = { title: '' };

    const BOARD: Board = {
        ...emptyBoard(),
        'todo': [BLANK],
    };

    test('is shown, rather than dropped for being empty', function () {
        const VISIBLE = computeVisibleBoard(BOARD, normalizeViewState(undefined));

        assert.strictEqual(VISIBLE.cards.length, 1);
        assert.strictEqual(VISIBLE.columns[0].matchingCount, 1);
        assert.strictEqual(VISIBLE.filteredOutCount, 0);
    });

    test('is shown in the list layout as well', function () {
        const VISIBLE = computeVisibleBoard(
            BOARD, normalizeViewState({ viewMode: 'list' })
        );

        assert.strictEqual(VISIBLE.cards.length, 1);
        assert.strictEqual(VISIBLE.cards[0].column, 'todo');
    });

    test('can still be addressed, which is what makes it repairable', function () {
        // selecting, editing, moving and deleting all address a card by its
        // '__uid'; a card without one is on screen and out of reach
        const IDENTIFIED = withUids(BOARD);

        const CARD = IDENTIFIED['todo'][0];

        assert.strictEqual('string', typeof CARD.__uid);
        assert.ok((CARD.__uid || '').length > 0);
    });

    test('does not lose the fields it never had', function () {
        // an absent description stays absent: it is not turned into an empty
        // string on the way through, which would rewrite the file
        const IDENTIFIED = withUids(BOARD);

        const CARD = IDENTIFIED['todo'][0];

        assert.strictEqual(false, 'description' in CARD);
        assert.strictEqual(false, 'details' in CARD);
        assert.strictEqual(CARD.title, '');
    });
});
