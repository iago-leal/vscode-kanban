/**
 * What gets written to the board file.
 *
 * Two rules meet here, and they pull in opposite directions.
 *
 * The first is that the order written must not change (RF-03). The old board
 * sorted 'allCards' in place while rendering, so the displayed order became
 * the stored order — an accident (finding E3) that every existing file has
 * already been through. Dropping it would rewrite the file of every user on
 * the first save, so it is reproduced ON PURPOSE, here, at the one moment the
 * board is persisted.
 *
 * The second is that nothing the user merely LOOKS at may reach the file
 * (RF-15). Hiding the finished cards, collapsing a column, choosing a layout
 * or a theme: none of it belongs to the board. The payload is built from the
 * board alone, never from what is on screen, which is what makes that
 * structural rather than a matter of remembering.
 */

import { Board, BoardCard, COLUMN_KEYS } from '../domain/types';
import { columnOf, sortBoardForPersistence } from '../domain/sorting';

/**
 * Builds the payload of 'saveBoard'.
 *
 * @param {Board} board The board, as the Webview holds it.
 *
 * @return {Board} The payload, ordered and without the identity of the
 *                 session.
 */
export function toSavePayload(board: Board): Board {
    const ORDERED = sortBoardForPersistence(board);

    const PAYLOAD = {} as Board;

    for (const COLUMN of COLUMN_KEYS) {
        PAYLOAD[COLUMN] = columnOf(ORDERED, COLUMN).map(withoutUid);
    }

    return PAYLOAD;
}

/**
 * Returns a copy of a card without its identity of the session.
 *
 * '__uid' is generated again on every load and has never been written to the
 * file; leaking it in would change what the file looks like.
 */
function withoutUid(card: BoardCard): BoardCard {
    const COPY: BoardCard = { ...card };

    delete COPY.__uid;

    return COPY;
}
