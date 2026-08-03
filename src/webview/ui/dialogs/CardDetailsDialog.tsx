/**
 * The details of a card, read only.
 *
 * Both text fields are rendered by the same path the card itself uses, so the
 * Markdown, the diagrams and the highlighted code look the same here as they
 * do on the board, and the sanitising barrier is the same one.
 */

import { Button } from '@primer/react';

import { BoardCard, contentOf } from '../../domain/types';
import { Dialog } from './Dialog';
import { Markdown } from '../Markdown';
import { anchored } from '../anchors';
import { toStringSafe } from '../../domain/text';
import { useServices } from '../services';

/**
 * Renders the dialog.
 */
export function CardDetailsDialog(props: {
    card: BoardCard;
    columnLabel: string;
    onClose(): void;
}) {
    const { time } = useServices();

    const CARD = props.card;

    const DESCRIPTION = contentOf(CARD.description);
    const DETAILS = contentOf(CARD.details);

    const CREATED = toStringSafe(CARD.creation_time).trim();

    return (
        <Dialog
            title={ toStringSafe(CARD.title) || 'Card without a title' }
            kind="card-details"
            onClose={ props.onClose }
            footer={
                <Button
                    { ...anchored({ anchor: 'dialog-confirm' }) }
                    variant="primary"
                    onClick={ props.onClose }
                >
                    Close
                </Button>
            }
        >
            <dl className="vsckb-details-facts">
                <dt>Column</dt>
                <dd>{ props.columnLabel }</dd>

                <dt>Type</dt>
                <dd>{ toStringSafe(CARD.type).trim() || 'note' }</dd>

                <dt>Prio</dt>
                <dd>{ undefined === CARD.prio ? '—' : toStringSafe(CARD.prio) }</dd>

                <dt>Category</dt>
                <dd>{ toStringSafe(CARD.category).trim() || '—' }</dd>

                <dt>Assigned to</dt>
                <dd>{ toStringSafe(CARD.assignedTo?.name).trim() || '—' }</dd>

                <dt>Created</dt>
                <dd>{ '' === CREATED ? '—' : time.prettyTime(CREATED) }</dd>
            </dl>

            { '' === DESCRIPTION ? null : (
                <section className="vsckb-details-section">
                    <h3>Description</h3>
                    <Markdown source={ DESCRIPTION } />
                </section>
            ) }

            { '' === DETAILS ? null : (
                <section className="vsckb-details-section">
                    <h3>Details</h3>
                    <Markdown source={ DETAILS } />
                </section>
            ) }
        </Dialog>
    );
}
