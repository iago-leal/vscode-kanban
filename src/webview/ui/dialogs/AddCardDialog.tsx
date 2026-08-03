/**
 * Adding a card.
 *
 * It writes the same fields the old dialog wrote, in the same shapes: the
 * creation time as an ISO 8601 instant, the identifier by the rule of
 * 'simpleIDs', and 'references' as an empty list. A title that is blank stops
 * the save and puts the focus back on the field, which is the only validation
 * the board has ever had.
 *
 * Unlike the edit dialog, the description here carries NO limit of characters.
 * That difference is inherited, not designed (s. 'CardForm.tsx').
 */

import { Button, Flash } from '@primer/react';
import { useState } from 'react';

import { Board, BoardCard, BoardSettings, ColumnKey } from '../../domain/types';
import { CardForm, fromFormValue, useCardForm } from './CardForm';
import { CurrentUser } from '../../bridge/messages';
import { Dialog } from './Dialog';
import { anchored } from '../anchors';
import { nextCardId } from '../../domain/card-id';

/**
 * Renders the dialog.
 */
export function AddCardDialog(props: {
    column: ColumnKey;
    columnLabel: string;
    board: Board;
    settings?: BoardSettings;
    currentUser?: CurrentUser;
    onSave(card: BoardCard): void;
    onClose(): void;
}) {
    const [value, setValue] = useCardForm(undefined, props.currentUser?.name);
    const [error, setError] = useState('');

    const SAVE = () => {
        if ('' === value.title.trim()) {
            setError('A card needs a title.');

            return;
        }

        const CREATION = new Date();

        props.onSave({
            ...fromFormValue(value),
            creation_time: CREATION.toISOString(),
            id: nextCardId(props.board, CREATION, props.settings?.simpleIDs),
            references: [],
        });
    };

    return (
        <Dialog
            title={ `Add a card to '${ props.columnLabel }'` }
            kind="add-card"
            onClose={ props.onClose }
            footer={
                <>
                    <Button
                        { ...anchored({ anchor: 'dialog-cancel' }) }
                        onClick={ props.onClose }
                    >
                        Cancel
                    </Button>

                    <Button
                        { ...anchored({ anchor: 'dialog-confirm' }) }
                        variant="primary"
                        onClick={ SAVE }
                    >
                        Add
                    </Button>
                </>
            }
        >
            { '' === error ? null : (
                <Flash className="vsckb-form-error" variant="danger" role="alert">
                    { error }
                </Flash>
            ) }

            <CardForm
                idPrefix="vsckb-new-card"
                value={ value }
                onChange={ setValue }
            />
        </Dialog>
    );
}
