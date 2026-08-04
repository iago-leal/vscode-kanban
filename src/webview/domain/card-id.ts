/**
 * The identifier a new card is given.
 *
 * Two shapes, chosen by the setting 'simpleIDs', which defaults to on:
 *
 *   - simple: the highest whole number already used on the board, plus one;
 *   - long: a timestamp, a random number and a UUID without its dashes.
 *
 * The simple form is not unique in any strong sense. Two people editing the
 * same board at once produce the same number, and a card whose id is text is
 * skipped by the maximum entirely. That is how the board has always worked,
 * and changing it would renumber cards that scripts and 'references' already
 * point at.
 */

import { Board, COLUMN_KEYS } from './types';
import { columnOf } from './sorting';
import { toStringSafe } from './text';

/**
 * The multiplier of the random part, kept from the original.
 */
const RANDOM_RANGE = 597923979;

/**
 * Returns the next simple identifier of a board.
 *
 * @param {Board} board The board.
 *
 * @return {number} The identifier.
 */
export function nextSimpleCardId(board: Board): number {
    let last = 0;

    for (const COLUMN of COLUMN_KEYS) {
        for (const CARD of columnOf(board, COLUMN)) {
            const NUMBER = parseInt(toStringSafe(CARD.id).trim());

            if (!isNaN(NUMBER)) {
                last = Math.max(last, NUMBER);
            }
        }
    }

    return last + 1;
}

/**
 * Returns the long identifier of a new card.
 *
 * @param {Date} creation The moment the card is created.
 *
 * @return {string} The identifier.
 */
export function longCardId(creation: Date): string {
    const STAMP = creation.toISOString()
                          .replace(/[-:T]/g, '')
                          .substr(0, 14);

    return `${ STAMP }_${ Math.floor(Math.random() * RANDOM_RANGE) }_${ uuid() }`;
}

/**
 * Returns the identifier a new card should carry.
 *
 * @param {Board} board The board.
 * @param {Date} creation The moment the card is created.
 * @param {boolean} [simpleIds] The setting; on by default.
 *
 * @return {string} The identifier.
 */
export function nextCardId(
    board: Board,
    creation: Date,
    simpleIds?: boolean,
): string {
    return false === simpleIds ? longCardId(creation)
                               : `${ nextSimpleCardId(board) }`;
}

/**
 * A UUID without its dashes, as 'vsckb_uuid()' built it.
 */
function uuid(): string {
    const PART = () => Math.floor((1 + Math.random()) * 0x10000)
                           .toString(16)
                           .substring(1);

    return `${ PART() }${ PART() }${ PART() }${ PART() }${ PART() }${ PART() }${ PART() }${ PART() }`;
}
