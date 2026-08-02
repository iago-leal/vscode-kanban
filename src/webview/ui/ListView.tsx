/**
 * The board as a single list.
 *
 * The cards are exactly the ones the columns would show, in the same order,
 * because both layouts read the same 'VisibleBoard' (RF-21). Each card names
 * the column it belongs to, since there is no header above it to do so
 * (RF-22), and it offers the same actions the columns offer (RF-20).
 *
 * This is the layout a narrow panel gets: one column of cards needs about
 * 320 px, while four side by side need eight hundred.
 */

import { BoardSettings, ColumnKey } from '../domain/types';
import { Card, CardActions } from './Card';
import { VisibleBoard } from '../domain/visibility';
import { keyOf } from './Column';
import { namedColumns } from '../domain/columns';

/**
 * Renders the board as a list.
 */
export function ListView(props: {
    board: VisibleBoard;
    settings?: BoardSettings;
    actions: CardActions;
    onAddCard(column: ColumnKey): void;
}) {
    const COLLAPSED = props.board.columns.filter(c => c.collapsed);

    return (
        <div className="vsckb-list">
            <div className="vsckb-list-toolbar">
                { namedColumns(props.settings).map(column => (
                    <button
                        key={ column.key }
                        type="button"
                        className="vsckb-list-add"
                        onClick={ () => props.onAddCard(column.key) }
                    >
                        { `Add to '${ column.name }'` }
                    </button>
                )) }
            </div>

            { COLLAPSED.length > 0 ? (
                <p className="vsckb-list-hidden">
                    { hiddenNotice(COLLAPSED.map(c => c.hiddenCount)) }
                </p>
            ) : null }

            { props.board.cards.map(entry => (
                <Card
                    key={ keyOf(entry.card) }
                    card={ entry.card }
                    column={ entry.column }
                    settings={ props.settings }
                    actions={ props.actions }
                    showColumn={ true }
                />
            )) }

            { props.board.cards.length < 1 ? (
                <p className="vsckb-list-empty">No card to show.</p>
            ) : null }
        </div>
    );
}

/**
 * Says how many cards a collapsed column is keeping out of the list.
 *
 * The list has no strips to carry that count, so it is stated once at the top:
 * the same rule as RN-13, told in the way this layout can tell it.
 */
function hiddenNotice(counts: number[]): string {
    const TOTAL = counts.reduce((sum, count) => sum + count, 0);

    return 1 === TOTAL ? '1 card is hidden by a collapsed column.'
                       : `${ TOTAL } cards are hidden by collapsed columns.`;
}
