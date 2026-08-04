/**
 * The style anchors of the board, and the old names that ride with them.
 *
 * An anchor is a promise: a selector the project undertakes to keep reaching
 * the same element, so that the stylesheet of the user survives a version. The
 * contract is 'interfaces/style-anchors.md'; this module is where the promise
 * is actually kept.
 *
 * Marking an element and giving it back its name of version 1.33.1 are the
 * same act here, and deliberately so. They were two in the plan -- instrument
 * the anchor, then generate a compatibility stylesheet -- and could not stay
 * two, because a stylesheet cannot alias a selector. Doing both at once is
 * also what stops them from drifting apart: an element that gains an anchor
 * gains the old names of that anchor, and an element that loses one loses
 * both.
 *
 * Nothing here decides WHICH old name belongs to which anchor. That is the map
 * in 'legacy-class-map.md', read by 'scripts/generate-legacy-compat.js' into
 * the generated module this one consumes.
 */

import {
    LEGACY_FOR_ANCHOR,
    LEGACY_FOR_PRESENCE,
    LEGACY_FOR_STATE,
    LegacyNames,
} from '../theme/legacy-compat';

/**
 * The structural anchors of §3 and the compatibility ones of §5.
 *
 * Written out rather than derived from the generated module, because an anchor
 * exists whether or not any old name maps to it: '[data-vsckb="columns"]' is
 * promised by the contract and has no name of 1.33.1 behind it.
 */
export type AnchorName =
    | 'board'
    | 'board-header'
    | 'columns'
    | 'column'
    | 'column-header'
    | 'column-body'
    | 'card'
    | 'card-title'
    | 'card-body'
    | 'card-footer'
    | 'card-actions'
    | 'list'
    | 'dialog'
    | 'action-save'
    | 'action-reload'
    | 'action-filter'
    | 'action-add'
    | 'action-edit'
    | 'action-clear'
    | 'dialog-confirm'
    | 'dialog-cancel'
    | 'card-category'
    | 'card-progress'
    | 'card-progress-bar'
    | 'card-reference'
    | 'card-references';

/**
 * What an anchor asks to be written on an element.
 */
export interface AnchorProps {
    'data-vsckb'?: AnchorName;
    'data-vsckb-column'?: string;
    'data-vsckb-dialog'?: string;
    'data-vsckb-card-type'?: string;
    'data-vsckb-view'?: string;
    'data-vsckb-collapsed'?: string;
    'data-vsckb-dragging'?: string;
    'data-vsckb-drop-target'?: string;
    className?: string;
    id?: string;
}

/**
 * What to mark an element with.
 */
export interface AnchorSpec {
    anchor?: AnchorName;

    /**
     * The state anchors of §4, each qualifying the structural one.
     */
    column?: string;
    dialog?: string;
    cardType?: string;
    view?: string;
    collapsed?: boolean;
    dragging?: boolean;
    dropTarget?: boolean;

    /**
     * Whatever the component wanted to put there anyway.
     */
    className?: string;
}

/**
 * Adds one set of old names to what is being collected.
 */
function absorb(into: { classes: string[]; id?: string }, names?: LegacyNames): void {
    if (!names) {
        return;
    }

    for (const CLASS of names.classes) {
        if (into.classes.indexOf(CLASS) < 0) {
            into.classes.push(CLASS);
        }
    }

    if (names.id && !into.id) {
        into.id = names.id;
    }
}

/**
 * Marks an element with its anchors, and with the names it answered by in
 * version 1.33.1.
 *
 * Spread the result: '<div { ...anchored({ anchor: "card" }) } />'.
 *
 * @param {AnchorSpec} spec What the element is.
 *
 * @return {AnchorProps} What to write on it.
 */
export function anchored(spec: AnchorSpec): AnchorProps {
    const LEGACY: { classes: string[]; id?: string } = { classes: [] };

    const PROPS: AnchorProps = {};

    if (spec.anchor) {
        PROPS['data-vsckb'] = spec.anchor;

        absorb(LEGACY, LEGACY_FOR_ANCHOR[spec.anchor]);
    }

    if (undefined !== spec.column) {
        PROPS['data-vsckb-column'] = spec.column;

        absorb(LEGACY, (LEGACY_FOR_STATE['column'] || {})[spec.column]);
        absorb(LEGACY, LEGACY_FOR_PRESENCE['column']);
    }

    if (undefined !== spec.dialog) {
        PROPS['data-vsckb-dialog'] = spec.dialog;

        absorb(LEGACY, (LEGACY_FOR_STATE['dialog'] || {})[spec.dialog]);
        absorb(LEGACY, LEGACY_FOR_PRESENCE['dialog']);
    }

    if (undefined !== spec.cardType) {
        PROPS['data-vsckb-card-type'] = spec.cardType;

        absorb(LEGACY, (LEGACY_FOR_STATE['card-type'] || {})[spec.cardType]);
        absorb(LEGACY, LEGACY_FOR_PRESENCE['card-type']);
    }

    if (undefined !== spec.view) {
        PROPS['data-vsckb-view'] = spec.view;
    }

    // a state that is either there or not is written as the empty string, so
    // that '[data-vsckb-collapsed]' is true exactly when the state is
    if (spec.collapsed) {
        PROPS['data-vsckb-collapsed'] = '';
    }

    if (spec.dragging) {
        PROPS['data-vsckb-dragging'] = '';
    }

    if (spec.dropTarget) {
        PROPS['data-vsckb-drop-target'] = '';
    }

    const CLASSES = (spec.className ? [spec.className] : []).concat(LEGACY.classes);

    if (CLASSES.length) {
        PROPS.className = CLASSES.join(' ');
    }

    if (LEGACY.id) {
        PROPS.id = LEGACY.id;
    }

    return PROPS;
}
