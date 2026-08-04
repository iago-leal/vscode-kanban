/**
 * How the cards are ordered inside a column.
 *
 * Three criteria, chained: priority descending, then type, then title. The
 * rule is unchanged; what changed is that sorting no longer mutates the board.
 *
 * That distinction matters more than it looks. The old 'vsckb_get_cards_sorted'
 * sorted 'allCards[type]' in place, so the order shown became the order
 * written to disk, and the manual order of the user never survived a reload.
 * Removing the mutation silently would rewrite the file of every user on the
 * first save, so the effect is kept — but it is now applied on purpose, by
 * 'sortBoardForPersistence', instead of leaking out of a display function.
 */

import { Board, BoardCard, COLUMN_KEYS, ColumnKey } from './types';
import { prioritySortValue, typeSortValue } from './card-taxonomy';
import { compareValues, normalizeString } from './text';

/**
 * Compares two cards the way a column is ordered.
 *
 * @param {BoardCard} x The left card.
 * @param {BoardCard} y The right card.
 *
 * @return {number} -1, 0 or 1.
 */
export function compareCards(x: BoardCard, y: BoardCard): number {
    // first by priority, descending
    const BY_PRIO = prioritySortValue(y) - prioritySortValue(x);
    if (0 !== BY_PRIO) {
        return BY_PRIO;
    }

    // then by type
    const BY_TYPE = typeSortValue(x) - typeSortValue(y);
    if (0 !== BY_TYPE) {
        return BY_TYPE;
    }

    // then by title
    return compareValues(
        normalizeString(x.title),
        normalizeString(y.title)
    );
}

/**
 * Returns the cards of a column in display order.
 *
 * The column received is left untouched.
 *
 * @param {BoardCard[]} cards The cards of the column.
 *
 * @return {BoardCard[]} A new, ordered array.
 */
export function sortCards(cards: BoardCard[]): BoardCard[] {
    return cards.slice()
                .sort(compareCards);
}

/**
 * Returns a board whose columns are ordered.
 *
 * This is what is handed to 'saveBoard': the file keeps the same order it has
 * always had, without any display function having to mutate the state to
 * achieve it.
 *
 * @param {Board} board The board.
 *
 * @return {Board} A new board, with ordered columns.
 */
export function sortBoardForPersistence(board: Board): Board {
    const RESULT = {} as Board;

    for (const COLUMN of COLUMN_KEYS) {
        RESULT[COLUMN] = sortCards(
            columnOf(board, COLUMN)
        );
    }

    return RESULT;
}

/**
 * Returns the cards of a column, tolerating a board where it is missing.
 *
 * The extension already turns every column into an array while loading, but a
 * board handed over by a script may not have been through that.
 *
 * @param {Board} board The board.
 * @param {ColumnKey} column The column.
 *
 * @return {BoardCard[]} The cards, empty when there is no such column.
 */
export function columnOf(board: Board, column: ColumnKey): BoardCard[] {
    const CARDS = board ? board[column] : undefined;

    return Array.isArray(CARDS) ? CARDS : [];
}
