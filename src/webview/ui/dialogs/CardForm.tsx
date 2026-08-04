/**
 * The form both card dialogs are built from.
 *
 * Adding and editing a card ask for the same seven things, and the old board
 * declared them twice — once in the 'new card' modal and once in the 'edit
 * card' modal, as two blocks of literal HTML inside 'boards.ts' that had
 * already drifted apart from each other. One form, two dialogs.
 *
 * One of those drifts is preserved on purpose. Only the EDIT dialog caps the
 * description at 255 characters ('boards.ts:746', 'board.js:113'); the add
 * dialog never did. The cap is therefore a property of the caller, not of the
 * form, and the difference is reproduced rather than tidied away.
 */

import { FormControl, Select, TextInput } from '@primer/react';
import { useState } from 'react';

import { BoardCard, contentOf } from '../../domain/types';
import { MarkdownField } from './MarkdownField';
import { toStringSafe } from '../../domain/text';

/**
 * The types the selector of the interface offers.
 *
 * It is a SHORTER list than the filter understands: the filter also knows
 * 'issue', 'note' and 'task'. Unifying the two vocabularies would change what
 * existing filters match, so they stay apart.
 */
const TYPES: Array<{ value: string; label: string }> = [
    { value: '', label: 'Note' },
    { value: 'bug', label: 'Bug' },
    { value: 'emergency', label: 'Emergency' },
];

/**
 * What the user is editing.
 */
export interface CardFormValue {
    title: string;
    type: string;
    prio: string;
    category: string;
    assignedTo: string;
    description: string;
    details: string;
}

/**
 * Reads a card into the form.
 *
 * @param {BoardCard} [card] The card; without one, an empty form.
 * @param {string} [assignedTo] Who the card is assigned to by default.
 *
 * @return {CardFormValue} The form.
 */
export function toFormValue(card?: BoardCard, assignedTo?: string): CardFormValue {
    return {
        title: toStringSafe(card?.title),
        type: toStringSafe(card?.type),
        prio: undefined === card?.prio || null === card?.prio ? ''
                                                              : toStringSafe(card.prio),
        category: toStringSafe(card?.category),
        assignedTo: toStringSafe(card?.assignedTo?.name || assignedTo),
        description: contentOf(card?.description),
        details: contentOf(card?.details),
    };
}

/**
 * Writes the form back onto a card.
 *
 * A field left empty is REMOVED from the card rather than stored as an empty
 * string, which is what keeps the file looking the way it always has.
 *
 * @param {CardFormValue} value The form.
 * @param {BoardCard} [card] The card being edited, if any.
 *
 * @return {BoardCard} The card.
 */
export function fromFormValue(value: CardFormValue, card?: BoardCard): BoardCard {
    const RESULT: BoardCard = { ...(card || {}), title: value.title.trim() };

    assign(RESULT, 'type', value.type.trim());
    assign(RESULT, 'category', value.category.trim());

    const PRIO = parseFloat(value.prio.trim());

    if (isNaN(PRIO)) {
        delete RESULT.prio;
    } else {
        RESULT.prio = PRIO;
    }

    const ASSIGNED = value.assignedTo.trim();

    if ('' === ASSIGNED) {
        delete RESULT.assignedTo;
    } else {
        RESULT.assignedTo = { name: ASSIGNED };
    }

    setContent(RESULT, 'description', value.description);
    setContent(RESULT, 'details', value.details);

    return RESULT;
}

/**
 * Renders the form.
 */
export function CardForm(props: {
    idPrefix: string;
    value: CardFormValue;
    /**
     * The cap on the description, when the dialog has one.
     */
    descriptionMaxLength?: number;
    onChange(value: CardFormValue): void;
}) {
    const VALUE = props.value;

    const SET = (field: keyof CardFormValue, next: string) => {
        props.onChange({ ...VALUE, [field]: next });
    };

    const ID = (name: string) => `${ props.idPrefix }-${ name }`;

    return (
        <div className="vsckb-form">
            <FormControl id={ ID('title') } className="vsckb-field">
                <FormControl.Label>Title</FormControl.Label>
                <TextInput
                    block
                    type="text"
                    value={ VALUE.title }
                    onChange={ e => SET('title', e.target.value) }
                />
            </FormControl>

            <div className="vsckb-field-row">
                <FormControl id={ ID('type') } className="vsckb-field">
                    <FormControl.Label>Type</FormControl.Label>
                    <Select
                        block
                        value={ VALUE.type }
                        onChange={ e => SET('type', e.target.value) }
                    >
                        { TYPES.map(type => (
                            <Select.Option key={ type.value } value={ type.value }>
                                { type.label }
                            </Select.Option>
                        )) }
                    </Select>
                </FormControl>

                <FormControl id={ ID('prio') } className="vsckb-field">
                    <FormControl.Label>Prio</FormControl.Label>
                    <TextInput
                        block
                        type="number"
                        placeholder="0"
                        value={ VALUE.prio }
                        onChange={ e => SET('prio', e.target.value) }
                    />
                </FormControl>
            </div>

            <FormControl id={ ID('category') } className="vsckb-field">
                <FormControl.Label>Category</FormControl.Label>
                <TextInput
                    block
                    type="text"
                    value={ VALUE.category }
                    onChange={ e => SET('category', e.target.value) }
                />
            </FormControl>

            <FormControl id={ ID('assigned-to') } className="vsckb-field">
                <FormControl.Label>Assigned to</FormControl.Label>
                <TextInput
                    block
                    type="text"
                    value={ VALUE.assignedTo }
                    onChange={ e => SET('assignedTo', e.target.value) }
                />
            </FormControl>

            <MarkdownField
                id={ ID('description') }
                label="Description"
                rows={ 5 }
                value={ VALUE.description }
                maxLength={ props.descriptionMaxLength }
                onChange={ next => SET('description', next) }
            />

            <MarkdownField
                id={ ID('details') }
                label="Details"
                rows={ 7 }
                value={ VALUE.details }
                onChange={ next => SET('details', next) }
            />
        </div>
    );
}

/**
 * Holds the form of a card while a dialog is open.
 *
 * @param {BoardCard} [card] The card being edited.
 * @param {string} [assignedTo] Who a new card is assigned to by default.
 *
 * @return {Array} The form and how to change it.
 */
export function useCardForm(
    card?: BoardCard,
    assignedTo?: string,
): [CardFormValue, (value: CardFormValue) => void] {
    const [value, setValue] = useState<CardFormValue>(
        () => toFormValue(card, assignedTo)
    );

    return [value, setValue];
}

/**
 * Writes a field, or removes it when it is empty.
 */
function assign(card: BoardCard, field: 'type' | 'category', value: string): void {
    if ('' === value) {
        delete card[field];
    } else {
        card[field] = value;
    }
}

/**
 * Writes a Markdown field.
 *
 * A saved field is ALWAYS written as '{ content, mime: "text/markdown" }',
 * even when it arrived from the file as a plain string, and an empty one is
 * removed. That is what 'vsckb_get_card_description_markdown()'
 * ('board.js:423') has always done: saving a card normalises its two text
 * fields into the object form. Keeping the original shape instead would look
 * tidier and would change the file.
 */
function setContent(
    card: BoardCard,
    field: 'description' | 'details',
    value: string,
): void {
    if ('' === value.trim()) {
        delete card[field];

        return;
    }

    card[field] = { content: value, mime: 'text/markdown' };
}
