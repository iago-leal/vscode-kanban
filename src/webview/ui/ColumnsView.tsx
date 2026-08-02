/**
 * The board as four columns.
 *
 * The space a collapsed column gives up is redistributed among the ones still
 * open, instead of being left as a gap (RF-13). That is why the open columns
 * grow and the collapsed ones are pinned to the width of their strip: with a
 * fixed quarter each, collapsing would only hide cards without ever making the
 * remaining ones easier to read.
 */

import { BoardSettings, ColumnKey } from '../domain/types';
import { CardActions } from './Card';
import { Column } from './Column';
import { VisibleBoard } from '../domain/visibility';

/**
 * Renders the board in columns.
 */
export function ColumnsView(props: {
    board: VisibleBoard;
    settings?: BoardSettings;
    actions: CardActions;
    onToggleCollapsed(column: ColumnKey, collapsed: boolean): void;
    onAddCard(column: ColumnKey): void;
}) {
    return (
        <div className="vsckb-columns">
            { props.board.columns.map(column => (
                <Column
                    key={ column.key }
                    column={ column }
                    settings={ props.settings }
                    actions={ props.actions }
                    onToggleCollapsed={ props.onToggleCollapsed }
                    onAddCard={ props.onAddCard }
                />
            )) }
        </div>
    );
}
