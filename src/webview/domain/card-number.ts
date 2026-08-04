/**
 * The number a card shows, out of the identifier it already carries.
 *
 * The card has had an 'id' since the beginning and the interface never showed
 * it. Issue #17 asked for readable identifiers precisely so that one could say
 * "card 42" in a conversation, and 'simpleIDs' was the answer; the readable
 * identifier was delivered, the display of it was not. So the agent that
 * operates this board writes "card [35]" and the maintainer opens the JSON to
 * find out which one that is.
 *
 * What lives here is display and nothing else. The identifier is READ, never
 * generated, corrected or renumbered -- renumbering would break 'references'
 * and the scripts of the user, and that rule stays where it is, in
 * 'card-id.ts' and in the extension (RN-01, D-09).
 *
 * The rule is in the domain rather than in the card for a reason this project
 * can measure: 'test:coverage' reads 'out/webview/domain/**' and nothing else.
 * A rule inside the component would be a rule no test could reach.
 */

import { toStringSafe } from './text';

/**
 * The widest identifier shown whole.
 *
 * The simple identifier is a whole number, and eight digits hold any board a
 * person will ever open, so in practice nothing is ever cut. The ceiling is
 * for the long form, which is around fifty characters and would push the title
 * of the card into a line it does not need (RF-05, D-05).
 */
const WIDEST_WHOLE = 8;

/**
 * How much of a long identifier survives the cut.
 *
 * The END is what tells two cards apart. The beginning is a timestamp, shared
 * entirely by every card created in the same second, so keeping the head would
 * keep the half that discriminates nothing (RN-05).
 */
const TAIL_KEPT = 6;

/**
 * The marker of a card, as it is written on the card itself.
 *
 * The identifier is treated as TEXT from beginning to end. Reading '007' as
 * seven would put a number on the screen that is not in the file, and the
 * board tolerates identifiers that are not whole numbers at all -- the counter
 * of new ones skips them rather than rejecting them.
 *
 * @param {string} [id] The identifier of the card, as the file has it.
 *
 * @return {string|undefined} The marker; nothing when the card has no
 *                            identifier, which is a card the sandbox has and
 *                            the editor does not (RF-10, RD-07).
 */
export function cardNumberLabel(id?: string): string | undefined {
    const VALUE = toStringSafe(id).trim();

    if ('' === VALUE) {
        return undefined;
    }

    if (VALUE.length <= WIDEST_WHOLE) {
        return `[${ VALUE }]`;
    }

    return `[…${ VALUE.substr(VALUE.length - TAIL_KEPT) }]`;
}

/**
 * The whole identifier, for the balloon of the pointer.
 *
 * Only when the marker was cut. A balloon that repeats what is already written
 * on the screen is noise, and this project already avoids it:
 * 'vsckb-card-progress' carries one to reveal the percentage its bar does not
 * write, and for nothing else (D-07).
 *
 * The card is not the only way out of a shortened marker: the details dialog
 * writes the identifier out in full, and does so for every card (RF-07).
 *
 * @param {string} [id] The identifier of the card.
 *
 * @return {string|undefined} The whole identifier when the marker hides part
 *                            of it; nothing otherwise.
 */
export function cardNumberTitle(id?: string): string | undefined {
    const VALUE = toStringSafe(id).trim();

    if ('' === VALUE || VALUE.length <= WIDEST_WHOLE) {
        return undefined;
    }

    return VALUE;
}
