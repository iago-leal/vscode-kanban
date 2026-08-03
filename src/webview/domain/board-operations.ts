/**
 * The changes a board can undergo.
 *
 * Every function returns a NEW board and leaves the one it received alone.
 * That is the difference from 'board.js', where 'allCards' was the single
 * mutable truth of the Webview (ADR-008) and a change was a push into an
 * array that something else was already rendering.
 *
 * None of these functions saves, sends or renders anything: what follows a
 * change — writing the file, raising the event of the user script — is decided
 * by the caller, in one place, and stays in the order the extraction recorded.
 */

import { Board, BoardCard, COLUMN_KEYS, ColumnKey, contentOf } from './types';
import { columnOf } from './sorting';
import { toggleTaskAt } from './task-progress';

/**
 * The two fields of a card that hold Markdown, and therefore task lists.
 */
export type CardTextField = 'description' | 'details';

/**
 * Ticks or unticks one task of one of the two texts of a card.
 *
 * The card comes back new, and only that one marker moved. A field with no
 * such task comes back untouched -- and untouched includes its SHAPE: a
 * description that arrived from the file as a plain string is not turned into
 * an object just because someone clicked a box in the other field.
 *
 * When the field does change, it is written as '{ content, mime }' whatever it
 * was before, which is what saving a card has always done to these two fields
 * ('board.js:423', reproduced in 'CardForm.tsx'). Ticking a box is a save like
 * any other, and inventing a second rule for it would make the file depend on
 * which control the user happened to use.
 *
 * @param {BoardCard} card The card.
 * @param {CardTextField} field Which of the two texts.
 * @param {number} index Which task of it, counting from zero.
 *
 * @return {BoardCard} The new card.
 */
export function toggleCardTask(
    card: BoardCard,
    field: CardTextField,
    index: number,
): BoardCard {
    const BEFORE = contentOf(card[field]);
    const AFTER = toggleTaskAt(BEFORE, index);

    if (AFTER === BEFORE) {
        return card;
    }

    return {
        ...card,
        [field]: { content: AFTER, mime: 'text/markdown' },
    };
}

/**
 * Adds a card to a column.
 *
 * @param {Board} board The board.
 * @param {ColumnKey} column The column.
 * @param {BoardCard} card The card.
 *
 * @return {Board} The new board.
 */
export function addCard(
    board: Board,
    column: ColumnKey,
    card: BoardCard,
): Board {
    return mapBoard(board, (cards, key) => {
        return key === column ? cards.concat(card)
                              : cards;
    });
}

/**
 * Replaces a card, wherever it is.
 *
 * @param {Board} board The board.
 * @param {string} uid The identity of the card.
 * @param {Function} change What the card becomes.
 *
 * @return {Board} The new board.
 */
export function updateCard(
    board: Board,
    uid: string,
    change: (card: BoardCard) => BoardCard,
): Board {
    return mapBoard(board, (cards) => {
        return cards.map(card => card.__uid === uid ? change(card)
                                                    : card);
    });
}

/**
 * Removes a card, wherever it is.
 *
 * @param {Board} board The board.
 * @param {string} uid The identity of the card.
 *
 * @return {Board} The new board.
 */
export function removeCard(board: Board, uid: string): Board {
    return mapBoard(board, (cards) => {
        return cards.filter(card => card.__uid !== uid);
    });
}

/**
 * Moves a card to another column.
 *
 * The card is appended to the end of the target column, as it always has been:
 * where it finally sits is decided by the ordering, not by the move.
 *
 * @param {Board} board The board.
 * @param {string} uid The identity of the card.
 * @param {ColumnKey} to The column it goes to.
 *
 * @return {Board} The new board; the same one when the card is not there or is
 *                 already in that column.
 */
export function moveCard(
    board: Board,
    uid: string,
    to: ColumnKey,
): Board {
    const CARD = findCard(board, uid);

    if (!CARD || columnOf(board, to).indexOf(CARD) > -1) {
        return board;
    }

    return addCard(removeCard(board, uid), to, CARD);
}

/**
 * Empties a column.
 *
 * @param {Board} board The board.
 * @param {ColumnKey} column The column.
 *
 * @return {Board} The new board.
 */
export function clearColumn(board: Board, column: ColumnKey): Board {
    return mapBoard(board, (cards, key) => {
        return key === column ? [] : cards;
    });
}

/**
 * Finds a card by its identity of the session.
 *
 * @param {Board} board The board.
 * @param {string} uid The identity.
 *
 * @return {BoardCard|undefined} The card, when it is on the board.
 */
export function findCard(board: Board, uid: string): BoardCard | undefined {
    for (const COLUMN of COLUMN_KEYS) {
        const FOUND = columnOf(board, COLUMN).find(card => card.__uid === uid);

        if (FOUND) {
            return FOUND;
        }
    }

    return undefined;
}

/**
 * Builds a board out of the columns of another one.
 */
function mapBoard(
    board: Board,
    change: (cards: BoardCard[], column: ColumnKey) => BoardCard[],
): Board {
    const RESULT = {} as Board;

    for (const COLUMN of COLUMN_KEYS) {
        RESULT[COLUMN] = change(columnOf(board, COLUMN), COLUMN);
    }

    return RESULT;
}
