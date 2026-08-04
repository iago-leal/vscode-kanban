/**
 * What the board shows.
 *
 * Ordering, filter, hiding of finished cards and collapsing of a column all
 * meet here, in one function. Both layouts read from it: the columns and the
 * list must show exactly the same set of cards, and the only way to make that
 * structural instead of coincidental is to have a single place that decides.
 */

import { Board, BoardCard, COLUMN_KEYS, ColumnKey, ViewState } from './types';
import { columnOf, sortCards } from './sorting';
import { isCollapsed } from './view-state';

/**
 * Decides whether a card passes the filter of the user.
 *
 * The board keeps its filter language, and a broken expression keeps showing
 * every card, so the predicate handed in here is expected to be permissive on
 * failure, as 'vsckb_does_match' has always been.
 */
export type CardPredicate = (card: BoardCard, column: ColumnKey) => boolean;

/**
 * A column, as it is displayed.
 */
export interface VisibleColumn {
    key: ColumnKey;
    /**
     * The cards to render, ordered. Empty while the column is collapsed.
     */
    cards: BoardCard[];
    collapsed: boolean;
    /**
     * How many cards the column holds after the filter, whether they are
     * rendered or not.
     *
     * This is the number a collapsed column shows, so that cards missing from
     * the screen are never mistaken for cards missing from the file.
     */
    matchingCount: number;
    /**
     * How many cards of the column are hidden right now.
     */
    hiddenCount: number;
}

/**
 * What the board renders, in either layout.
 */
export interface VisibleBoard {
    columns: VisibleColumn[];
    /**
     * Every visible card, in column order, for the list layout.
     */
    cards: Array<{ card: BoardCard; column: ColumnKey }>;
    /**
     * Total of cards hidden by a collapsed column.
     */
    hiddenCount: number;
    /**
     * Total of cards rejected by the filter.
     */
    filteredOutCount: number;
}

/**
 * A predicate that accepts everything: the board without a filter.
 */
export const ACCEPT_ALL: CardPredicate = () => true;

/**
 * Computes what the board shows.
 *
 * @param {Board} board The board.
 * @param {ViewState} viewState The display state.
 * @param {CardPredicate} [matches] The filter; everything passes without one.
 *
 * @return {VisibleBoard} What to render.
 */
export function computeVisibleBoard(
    board: Board,
    viewState: ViewState,
    matches: CardPredicate = ACCEPT_ALL,
): VisibleBoard {
    const COLUMNS: VisibleColumn[] = [];
    const CARDS: Array<{ card: BoardCard; column: ColumnKey }> = [];

    let hiddenCount = 0;
    let filteredOutCount = 0;

    for (const KEY of COLUMN_KEYS) {
        const ALL = columnOf(board, KEY);

        // the filter and the hiding compose by conjunction: a card shows when
        // the filter accepts it AND its column is not collapsed
        const MATCHING = sortCards(
            ALL.filter(card => matches(card, KEY))
        );

        filteredOutCount += ALL.length - MATCHING.length;

        const COLLAPSED = isCollapsed(viewState, KEY);

        if (COLLAPSED) {
            hiddenCount += MATCHING.length;
        } else {
            for (const CARD of MATCHING) {
                CARDS.push({ card: CARD, column: KEY });
            }
        }

        COLUMNS.push({
            key: KEY,
            cards: COLLAPSED ? [] : MATCHING,
            collapsed: COLLAPSED,
            matchingCount: MATCHING.length,
            hiddenCount: COLLAPSED ? MATCHING.length : 0,
        });
    }

    return {
        columns: COLUMNS,
        cards: CARDS,
        hiddenCount: hiddenCount,
        filteredOutCount: filteredOutCount,
    };
}
