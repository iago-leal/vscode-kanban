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
 */
const TASK_ITEM = /^[ \t]*[-*+][ \t]+\[( |x|X)\][ \t]+/gm;

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
