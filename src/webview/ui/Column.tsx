/**
 * A column of the board, open or collapsed.
 *
 * A collapsed column is not a hidden column: it shrinks to a strip that keeps
 * its configured display name and states how many cards are inside (RF-14).
 * That count is the whole point. Cards missing from the screen must never be
 * mistaken for cards missing from the file, and the strip is what makes the
 * difference visible without expanding anything (RN-13).
 *
 * The column stays a composition of this project. What comes from the design
 * system is the heading, the counter and the two buttons; the arrangement, and
 * the fact that the body scrolls while the header does not, is geometry
 * declared in 'board.css' (RF-01, RF-24).
 */

import { CounterLabel, Heading } from '@primer/react';

import { BoardCard, BoardSettings, ColumnKey } from '../domain/types';
import { Card, CardActions } from './Card';
import { IconButton } from './IconButton';
import { VisibleColumn } from '../domain/visibility';
import { anchored } from './anchors';
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
                { ...anchored({
                    anchor: 'column',
                    column: COLUMN.key,
                    collapsed: true,
                    className: 'vsckb-column vsckb-column-collapsed',
                }) }
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
            { ...anchored({
                anchor: 'column',
                column: COLUMN.key,
                className: 'vsckb-column',
            }) }
            aria-label={ NAME }
        >
            <header
                { ...anchored({ anchor: 'column-header', className: 'vsckb-column-header' }) }
            >
                <IconButton
                    icon="collapse"
                    label={ `Collapse '${ NAME }'` }
                    className="vsckb-column-collapse"
                    onClick={ () => props.onToggleCollapsed(COLUMN.key, true) }
                />

                <Heading as="h2" className="vsckb-column-name">{ NAME }</Heading>

                <CounterLabel className="vsckb-column-count">
                    { COLUMN.matchingCount }
                </CounterLabel>

                <IconButton
                    anchor="action-add"
                    icon="add"
                    label={ `Add a card to '${ NAME }'` }
                    onClick={ () => props.onAddCard(COLUMN.key) }
                />
            </header>

            <div
                { ...anchored({ anchor: 'column-body', className: 'vsckb-column-cards' }) }
            >
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
