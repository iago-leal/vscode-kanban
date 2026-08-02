/**
 * What the type of a card means.
 *
 * The system has two parallel vocabularies for the type: the selector of the
 * interface offers 'bug', 'emergency' and the empty value, while the filter
 * also knows 'issue', 'note' and 'task'. They disagree, and this feature does
 * NOT unify them: doing so would change what the filter matches. The
 * divergence is reproduced here on purpose, and named, so that whoever reads
 * this knows it is a decision and not an oversight.
 */

import { BoardCard } from './types';
import { normalizeString, toStringSafe } from './text';

/**
 * The group a type belongs to, for colour purposes.
 *
 * Three groups, as the board has always had. The tones of each one are
 * calibrated per theme, the grouping itself is not touched.
 */
export type CardColorGroup = 'emergency' | 'bug' | 'default';

/**
 * The weight a type has while sorting: the lower, the earlier.
 */
export function typeSortValue(card: Pick<BoardCard, 'type'>): number {
    switch (normalizeString(card.type)) {
        case 'emergency':
            return -2;

        case 'bug':
            return -1;
    }

    return 0;
}

/**
 * The priority a card is sorted by.
 *
 * A dirty string counts by its leading number, so that '5xyz' is 5 and 'abc'
 * is 0. That is what 'parseFloat' does, and the characterisation tests pinned
 * it down.
 */
export function prioritySortValue(card: Pick<BoardCard, 'prio'>): number {
    const PRIO = parseFloat(
        toStringSafe(card.prio).trim()
    );

    if (isNaN(PRIO)) {
        return 0;
    }

    return PRIO;
}

/**
 * The colour group of a card.
 *
 * Only 'emergency' and 'bug' have one of their own; every other type, known
 * or not, shares the default. 'issue' lands here even though the filter
 * treats it as a bug, exactly as it does today.
 */
export function colorGroupOf(card: Pick<BoardCard, 'type'>): CardColorGroup {
    switch (normalizeString(card.type)) {
        case 'emergency':
            return 'emergency';

        case 'bug':
            return 'bug';
    }

    return 'default';
}
