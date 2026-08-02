/**
 * What the four columns are called, and where a card may go from each.
 *
 * The columns are fixed and this feature does not touch that (ADR-002). What
 * is written down here, for the first time in one place, is which move each
 * column offers: 'Todo' only starts work, 'In Progress' can stop, test or
 * finish, and 'Done' can send a card back. The board has always behaved this
 * way ('board.js:1518'); it was spread across four branches of one function.
 */

import { BoardSettings, COLUMN_KEYS, ColumnKey } from './types';
import { toStringSafe } from './text';

/**
 * The name a column carries when the workspace configured none.
 */
export const DEFAULT_COLUMN_NAMES: { [column in ColumnKey]: string } = {
    'todo': 'Todo',
    'in-progress': 'In Progress',
    'testing': 'Testing',
    'done': 'Done',
};

/**
 * A move a card may make from the column it is in.
 */
export interface ColumnMove {
    to: ColumnKey;
    /**
     * Which of the icons of the board stands for the move. The icon differs
     * from the target: leaving 'Testing' towards 'In Progress' is a rejection
     * and shows as one, while leaving 'Done' towards it is a reopening.
     */
    icon: 'start' | 'stop' | 'test' | 'finish' | 'reject' | 'redo';
}

/**
 * The moves each column offers, in the order they are shown.
 */
const MOVES: { [column in ColumnKey]: ColumnMove[] } = {
    'todo': [
        { to: 'in-progress', icon: 'start' },
    ],
    'in-progress': [
        { to: 'todo', icon: 'stop' },
        { to: 'testing', icon: 'test' },
        { to: 'done', icon: 'finish' },
    ],
    'testing': [
        { to: 'in-progress', icon: 'reject' },
        { to: 'done', icon: 'finish' },
    ],
    'done': [
        { to: 'testing', icon: 'test' },
        { to: 'in-progress', icon: 'redo' },
    ],
};

/**
 * Returns the moves a card of a column may make.
 *
 * @param {ColumnKey} column The column the card is in.
 *
 * @return {ColumnMove[]} The moves.
 */
export function movesFrom(column: ColumnKey): ColumnMove[] {
    return MOVES[column] || [];
}

/**
 * Returns the name a column is shown under.
 *
 * @param {ColumnKey} column The column.
 * @param {BoardSettings} [settings] What the workspace configured.
 *
 * @return {string} The name.
 */
export function columnName(
    column: ColumnKey,
    settings?: BoardSettings,
): string {
    const CONFIGURED = settings && settings.columns
        ? toStringSafe(settings.columns[column]?.name).trim()
        : '';

    return '' === CONFIGURED ? DEFAULT_COLUMN_NAMES[column]
                             : CONFIGURED;
}

/**
 * Returns every column with the name it is shown under.
 *
 * @param {BoardSettings} [settings] What the workspace configured.
 *
 * @return {Array} The columns, in board order.
 */
export function namedColumns(
    settings?: BoardSettings,
): Array<{ key: ColumnKey; name: string }> {
    return COLUMN_KEYS.map(key => ({
        key: key,
        name: columnName(key, settings),
    }));
}
