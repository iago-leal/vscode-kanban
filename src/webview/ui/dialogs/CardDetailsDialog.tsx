/**
 * The details of a card.
 *
 * Both text fields are rendered by the same path the card itself uses, so the
 * Markdown, the diagrams and the highlighted code look the same here as they
 * do on the board, and the sanitising barrier is the same one.
 *
 * It was read only, and is no longer, in exactly one respect: a task can be
 * ticked here. This is where the details field is READ -- the card on the board
 * shows the description alone -- so a checklist that lives in the details had
 * nowhere at all to be ticked, and the only way to record that one item got
 * done was to open the edit dialog and change the text by hand.
 */

import { Button } from '@primer/react';

import { BoardCard, contentOf } from '../../domain/types';
import type { CardTextField } from '../../domain/board-operations';
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
    /**
     * Ticks one task of one of the two texts. Without it the boxes are drawn
     * and announced as disabled, which is what the dialog showed before.
     */
    onToggleTask?(field: CardTextField, index: number): void;
}) {
    const { time } = useServices();

    const CARD = props.card;

    const DESCRIPTION = contentOf(CARD.description);
    const DETAILS = contentOf(CARD.details);

    const CREATED = toStringSafe(CARD.creation_time).trim();

    // one field at a time, so that the index a box reports is counted within
    // the text that box belongs to
    const TOGGLE = (field: CardTextField) => {
        const HANDLER = props.onToggleTask;

        return HANDLER ? (index: number) => HANDLER(field, index)
                       : undefined;
    };

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
                { /*
                   * The identifier, whole and never shortened. The card shows
                   * a long one cut down to the tail that tells two cards
                   * apart, so this is the one place the rest of it can be read
                   * at all (RF-07).
                   */ }
                <dt>Identifier</dt>
                <dd>{ toStringSafe(CARD.id).trim() || '—' }</dd>

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
                    <Markdown
                        source={ DESCRIPTION }
                        onToggleTask={ TOGGLE('description') }
                    />
                </section>
            ) }

            { '' === DETAILS ? null : (
                <section className="vsckb-details-section">
                    <h3>Details</h3>
                    <Markdown
                        source={ DETAILS }
                        onToggleTask={ TOGGLE('details') }
                    />
                </section>
            ) }
        </Dialog>
    );
}
