/**
 * How far the task list of a card has got.
 *
 * The board has always counted the checkboxes of the rendered Markdown
 * ('board.js:1155') and drawn a bar over the card. The count is done here on
 * the SOURCE instead, which gives the same numbers without needing a rendered
 * document, and makes the rule testable.
 *
 * The bar only appears once something is ticked, exactly as before: a list
 * where nothing is done yet shows no bar at all, rather than an empty one.
 */

/**
 * How much of the list is done.
 */
export interface TaskProgress {
    checked: number;
    total: number;
    /**
     * From 0 to 100.
     */
    percentage: number;
}

/**
 * A task item of a Markdown list, ticked or not.
 *
 * The SAME expression decides what counts for the bar and what can be ticked
 * ('toggleTaskAt'). Two expressions would be two answers to "which item is the
 * third one", and the bar would then disagree with the box the user clicked --
 * silently, and only for lists where the two happened to differ.
 */
const TASK_ITEM = /^[ \t]*[-*+][ \t]+\[( |x|X)\][ \t]+/gm;

/**
 * Ticks or unticks one item of a task list, by its position in the text.
 *
 * The text is returned changed in exactly one place: the marker of the item
 * asked for. Everything else -- the indentation, the bullet, the spacing, the
 * rest of the line, the lines around it -- is left byte for byte as it was,
 * because this text is the card of the user and not a document this project
 * gets to reformat.
 *
 * @param {unknown} markdown The text.
 * @param {number} index Which item, counting from zero in the order they
 *                       appear.
 *
 * @return {string} The text, with that one marker flipped. A text with no such
 *                  item comes back untouched, which is what makes a stale index
 *                  harmless: the interface can be a render behind without
 *                  writing to the wrong line.
 */
export function toggleTaskAt(markdown: unknown, index: number): string {
    if ('string' !== typeof markdown) {
        return '';
    }

    if (!isFinite(index) || index < 0) {
        return markdown;
    }

    TASK_ITEM.lastIndex = 0;

    let found = 0;
    let match = TASK_ITEM.exec(markdown);

    while (match) {
        if (found === index) {
            // the marker sits at a known offset inside the match, and is the
            // only character that moves
            const AT = match.index + match[0].lastIndexOf('[') + 1;

            return markdown.substring(0, AT) +
                   (' ' === match[1] ? 'x' : ' ') +
                   markdown.substring(AT + 1);
        }

        ++found;

        match = TASK_ITEM.exec(markdown);
    }

    return markdown;
}

/**
 * Counts the task items of one or more pieces of Markdown.
 *
 * @param {...unknown} sources The texts to count in.
 *
 * @return {TaskProgress|undefined} The progress; nothing when there is no
 *                                  list, or when nothing in it is done yet.
 */
export function taskProgressOf(...sources: unknown[]): TaskProgress | undefined {
    let checked = 0;
    let total = 0;

    for (const SOURCE of sources) {
        if ('string' !== typeof SOURCE) {
            continue;
        }

        // the regular expression is global, so its cursor is reset first
        TASK_ITEM.lastIndex = 0;

        let match = TASK_ITEM.exec(SOURCE);

        while (match) {
            ++total;

            if (' ' !== match[1]) {
                ++checked;
            }

            match = TASK_ITEM.exec(SOURCE);
        }
    }

    if (total < 1 || checked < 1) {
        return undefined;
    }

    return {
        checked: checked,
        total: total,
        percentage: checked / total * 100.0,
    };
}
