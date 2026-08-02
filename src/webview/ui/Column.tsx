/**
 * A column of the board, open or collapsed.
 *
 * A collapsed column is not a hidden column: it shrinks to a strip that keeps
 * its configured display name and states how many cards are inside (RF-14).
 * That count is the whole point. Cards missing from the screen must never be
 * mistaken for cards missing from the file, and the strip is what makes the
 * difference visible without expanding anything (RN-13).
 */

import { BoardCard, BoardSettings, ColumnKey } from '../domain/types';
import { Card, CardActions, IconButton } from './Card';
import { VisibleColumn } from '../domain/visibility';
import { columnName } from '../domain/columns';

/**
 * Renders one column.
 */
export function Column(props: {
    column: VisibleColumn;
    settings?: BoardSettings;
    actions: CardActions;
    onToggleCollapsed(column: ColumnKey, collapsed: boolean): void;
    onAddCard(column: ColumnKey): void;
}) {
    const COLUMN = props.column;
    const NAME = columnName(COLUMN.key, props.settings);

    if (COLUMN.collapsed) {
        return (
            <section
                className="vsckb-column vsckb-column-collapsed"
                data-vsckb-column={ COLUMN.key }
                aria-label={ `${ NAME }, collapsed, ${ COLUMN.hiddenCount } cards` }
            >
                <button
                    type="button"
                    className="vsckb-column-strip"
                    aria-expanded={ false }
                    title={ `Expand '${ NAME }'` }
                    onClick={ () => props.onToggleCollapsed(COLUMN.key, false) }
                >
                    <span className="vsckb-column-strip-name">{ NAME }</span>
                    <span className="vsckb-column-strip-count">{ COLUMN.hiddenCount }</span>
                </button>
            </section>
        );
    }

    return (
        <section
            className="vsckb-column"
            data-vsckb-column={ COLUMN.key }
            aria-label={ NAME }
        >
            <header className="vsckb-column-header">
                <IconButton
                    icon="collapse"
                    label={ `Collapse '${ NAME }'` }
                    className="vsckb-column-collapse"
                    onClick={ () => props.onToggleCollapsed(COLUMN.key, true) }
                />

                <h2 className="vsckb-column-name">{ NAME }</h2>

                <span className="vsckb-column-count">{ COLUMN.matchingCount }</span>

                <IconButton
                    icon="add"
                    label={ `Add a card to '${ NAME }'` }
                    onClick={ () => props.onAddCard(COLUMN.key) }
                />
            </header>

            <div className="vsckb-column-cards">
                { COLUMN.cards.map(card => (
                    <Card
                        key={ keyOf(card) }
                        card={ card }
                        column={ COLUMN.key }
                        settings={ props.settings }
                        actions={ props.actions }
                    />
                )) }
            </div>
        </section>
    );
}

/**
 * The identity React tells two cards apart by.
 *
 * The '__uid' of the session is exactly that identity, and it is generated for
 * every card on load. The title is only a fallback for a card that somehow
 * arrived without one.
 */
export function keyOf(card: BoardCard): string {
    return card.__uid || `${ card.id }:${ card.title }`;
}
