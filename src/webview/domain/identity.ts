/**
 * How a card is addressed while the board is open.
 *
 * A card has no stable identity in the file: 'id' is optional and, with
 * 'simpleIDs' on, is only unique within a column. So the board gives every
 * card a '__uid' when it loads one, uses it to address cards for the rest of
 * the session, and strips it again before writing.
 *
 * The formula is reproduced exactly as 'board.js:2013' wrote it, down to the
 * odd multiplier. It is not a good identifier — a random number and a
 * millisecond can collide — but scripts that stored a '__uid' during a session
 * compare it as a string, and a different shape would be a different contract.
 * Card [12] of the board of this project tracks the wider problem: the same
 * rule exists a second time in 'workspaces.ts', and the two may drift.
 */

import { Board, BoardCard, COLUMN_KEYS, ColumnKey } from './types';
import { columnOf } from './sorting';

/**
 * The multiplier of the random part, kept from the original.
 */
const RANDOM_RANGE = 597923979;

/**
 * Gives every card of a board its identity for this session.
 *
 * The board received is left untouched: a new one comes back, with new card
 * objects, so that nothing that is still rendering sees a card change under
 * it.
 *
 * @param {Board} board The board that just arrived.
 *
 * @return {Board} The board, with every card identified.
 */
export function withUids(board: Board): Board {
    const RESULT = {} as Board;

    // the index runs across the whole board, not across each column: two
    // cards in different columns never get the same one
    let index = -1;
    const STAMP = Date.now();

    for (const COLUMN of COLUMN_KEYS) {
        RESULT[COLUMN] = columnOf(board, COLUMN).map(card => {
            ++index;

            return {
                ...card,
                __uid: `${ index }-${ Math.floor(Math.random() * RANDOM_RANGE) }-${ STAMP }`,
            };
        });
    }

    return RESULT;
}

/**
 * Finds the column a card is in.
 *
 * @param {Board} board The board.
 * @param {string} uid The identity of the card.
 *
 * @return {ColumnKey|undefined} The column, when the card is on the board.
 */
export function columnOfCard(board: Board, uid: string): ColumnKey | undefined {
    for (const COLUMN of COLUMN_KEYS) {
        if (columnOf(board, COLUMN).some(card => card.__uid === uid)) {
            return COLUMN;
        }
    }

    return undefined;
}

/**
 * Collects every card of the board except one, grouped by column.
 *
 * A column that holds no other card is left OUT of the result rather than
 * being present and empty. Event scripts already read this payload, and the
 * shape they read is this one.
 *
 * @param {Board} board The board.
 * @param {BoardCard} [card] The card to leave out; without one, every card is
 *                           collected.
 *
 * @return {Partial<Board>} The other cards.
 */
export function otherCards(
    board: Board,
    card?: BoardCard,
): Partial<Board> {
    const RESULT: Partial<Board> = {};

    for (const COLUMN of COLUMN_KEYS) {
        for (const OTHER of columnOf(board, COLUMN)) {
            if (card && OTHER.__uid === card.__uid) {
                continue;
            }

            if (!RESULT[COLUMN]) {
                RESULT[COLUMN] = [];
            }

            RESULT[COLUMN]!.push(OTHER);
        }
    }

    return RESULT;
}
