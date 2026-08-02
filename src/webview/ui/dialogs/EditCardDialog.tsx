/**
 * Editing a card.
 *
 * The description is capped at 255 characters here and nowhere else. The cap
 * comes from the old markup ('boards.ts:746') and from the truncation in
 * 'board.js:113', and it means a long description written through the add
 * dialog is silently shortened the first time the card is edited.
 *
 * That is a defect, and it is preserved: repairing it would change what gets
 * written to the file, which this feature is not allowed to do (RF-26). It is
 * recorded in 'legacy-impact.md' so that the repair can be a change of its own.
 */

import { useState } from 'react';

import { BoardCard } from '../../domain/types';
import { CardForm, fromFormValue, useCardForm } from './CardForm';
import { Dialog } from './Dialog';

/**
 * The cap the old edit dialog put on the description.
 */
const DESCRIPTION_MAX_LENGTH = 255;

/**
 * Renders the dialog.
 */
export function EditCardDialog(props: {
    card: BoardCard;
    columnLabel: string;
    onSave(card: BoardCard): void;
    onClose(): void;
}) {
    const [value, setValue] = useCardForm(props.card);
    const [error, setError] = useState('');

    const SAVE = () => {
        if ('' === value.title.trim()) {
            setError('A card needs a title.');

            return;
        }

        props.onSave(fromFormValue(value, props.card));
    };

    return (
        <Dialog
            title={ `Edit a card of '${ props.columnLabel }'` }
            onClose={ props.onClose }
            footer={
                <>
                    <button type="button" className="vsckb-button" onClick={ props.onClose }>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="vsckb-button vsckb-button-primary"
                        onClick={ SAVE }
                    >
                        Save
                    </button>
                </>
            }
        >
            { '' === error ? null : (
                <p className="vsckb-form-error" role="alert">{ error }</p>
            ) }

            <CardForm
                idPrefix="vsckb-edit-card"
                value={ value }
                descriptionMaxLength={ DESCRIPTION_MAX_LENGTH }
                onChange={ setValue }
            />
        </Dialog>
    );
}
