/**
 * The filter of the cards.
 *
 * Two things live here, and they are deliberately kept apart from the language
 * that evaluates the expression: the environment a card offers to an
 * expression, and the rule that decides what an unusable expression means.
 *
 * That rule is the surprising one, and it is preserved on purpose: an
 * expression that fails to compile shows EVERY card instead of none. The user
 * cannot tell a filter that matches nothing from a filter that is broken. The
 * characterisation suite of commit 6d99e58 froze this behaviour, so changing
 * it is a feature of its own, not a repair to slip into a rewrite.
 */

import { BoardCard, ColumnKey, contentOf } from './types';
import { FilterFunctions, FilterValues } from './filter-functions';
import { LogPort, SILENT_LOG, TimePort } from './ports';
import { CardPredicate } from './visibility';
import { isNil, normalizeString, toStringSafe } from './text';

/**
 * What a caller may add to an expression, beyond the base environment.
 */
export interface FilterOptions {
    funcs?: FilterFunctions;
    values?: FilterValues;
}

/**
 * Compiles an expression of the filter language.
 *
 * It is the single seam between this module and Filtrex: the adapter in
 * 'adapters/filter-language.ts' is the only implementation, and it is the only
 * file that names the library.
 *
 * @param {string} expression The expression, never empty.
 * @param {FilterFunctions} funcs The functions it may call.
 *
 * @return {Function} The compiled expression.
 *
 * @throws When the expression does not compile.
 */
export type FilterEvaluator = (
    expression: string,
    funcs: FilterFunctions,
) => (values: FilterValues) => unknown;

/**
 * Evaluates an expression against an environment.
 *
 * The result is handed back RAW, exactly as the evaluator produced it: a
 * comparison answers 1 or 0, a call to 'all()' answers true or false. Callers
 * read it as a truthy value, and normalising it here would break every
 * assertion that documents the difference.
 *
 * @param {unknown} expr The expression; anything empty accepts the card.
 * @param {FilterOptions} opts The environment to evaluate against.
 * @param {FilterEvaluator} evaluate The language.
 * @param {FilterFunctions} baseFuncs The functions of the language itself.
 * @param {LogPort} [log] Where a failure is reported.
 *
 * @return {unknown} The raw result; true when nothing could be decided.
 */
export function doesMatch(
    expr: unknown,
    opts: FilterOptions | undefined,
    evaluate: FilterEvaluator,
    baseFuncs: FilterFunctions,
    log: LogPort = SILENT_LOG,
): unknown {
    const OPTIONS = opts || {};

    const FUNCS: FilterFunctions = { ...baseFuncs, ...(OPTIONS.funcs || {}) };
    const VALUES: FilterValues = { ...(OPTIONS.values || {}) };

    try {
        const EXPRESSION = toStringSafe(expr);

        if ('' !== EXPRESSION.trim()) {
            return evaluate(EXPRESSION, FUNCS)(VALUES);
        }
    } catch (e) {
        // the card is shown anyway, and the reason only reaches the log
        log(`doesMatch().error: ${ toStringSafe(e) }`);
    }

    return true;
}

/**
 * Builds what a single card offers to an expression.
 *
 * Every name here already existed: 'cat' beside 'category', 'is_emerg' beside
 * 'is_emergency', 'no' beside 'false'. The duplicates are part of the language
 * users write against.
 *
 * @param {BoardCard} card The card.
 * @param {TimePort} time The reading of dates.
 *
 * @return {FilterOptions} The environment of the card.
 */
export function createCardEnvironment(
    card: BoardCard,
    time: TimePort,
): FilterOptions {
    const TYPE = normalizeString(card.type);

    const IS_BUG = ['bug', 'issue'].indexOf(TYPE) > -1;
    const IS_NOTE = ['', 'note', 'task'].indexOf(TYPE) > -1;
    const IS_EMERGENCY = 'emergency' === TYPE;

    // a card without a readable creation time answers 'false' to every
    // question about its age, rather than being treated as very old
    const CREATED = toStringSafe(card.creation_time).trim();
    const CREATION_TIME = '' === CREATED ? undefined
                                         : CREATED;

    const ASSIGNED_TO = card.assignedTo ? card.assignedTo.name
                                        : undefined;

    const PRIO = readPrio(card.prio);

    const IS_CATEGORY = (value: unknown): boolean => {
        return normalizeString(value) === normalizeString(card.category);
    };

    const COMPARE_WITH_CREATION = (date: unknown): number | false => {
        if (undefined === CREATION_TIME) {
            return false;
        }

        return time.compare(CREATION_TIME, date);
    };

    const AGE_IN_DAYS = (): number | false => {
        if (undefined === CREATION_TIME) {
            return false;
        }

        return time.daysSince(CREATION_TIME);
    };

    return {
        funcs: {
            is_after: (date: unknown, orEqual?: unknown): boolean => {
                const ORDER = COMPARE_WITH_CREATION(date);

                if (false === ORDER) {
                    return false;
                }

                return orEqual ? ORDER >= 0
                               : ORDER > 0;
            },

            is_before: (date: unknown, orEqual?: unknown): boolean => {
                const ORDER = COMPARE_WITH_CREATION(date);

                if (false === ORDER) {
                    return false;
                }

                return orEqual ? ORDER <= 0
                               : ORDER < 0;
            },

            is_cat: IS_CATEGORY,
            is_category: IS_CATEGORY,

            is_older: (days: unknown, orEqual?: unknown): boolean => {
                const AGE = AGE_IN_DAYS();

                if (false === AGE) {
                    return false;
                }

                const LIMIT = parseFloat(toStringSafe(days).trim());

                return orEqual ? AGE >= LIMIT
                               : AGE > LIMIT;
            },

            is_younger: (days: unknown, orEqual?: unknown): boolean => {
                const AGE = AGE_IN_DAYS();

                if (false === AGE) {
                    return false;
                }

                const LIMIT = parseFloat(toStringSafe(days).trim());

                return orEqual ? AGE <= LIMIT
                               : AGE < LIMIT;
            },
        },
        values: {
            assigned_to: ASSIGNED_TO,
            cat: card.category,
            category: card.category,
            description: markdownValue(card.description),
            details: markdownValue(card.details),
            'false': false,
            id: card.id,
            is_bug: IS_BUG,
            is_emerg: IS_EMERGENCY,
            is_emergency: IS_EMERGENCY,
            is_issue: IS_BUG,
            is_note: IS_NOTE,
            is_task: IS_NOTE,
            no: false,
            now: time.now(false),
            'null': null,
            prio: PRIO,
            priority: PRIO,
            tag: card.tag,
            time: undefined === CREATION_TIME ? false
                                              : time.unix(CREATION_TIME, true),
            title: card.title,
            'true': true,
            type: TYPE,
            'undefined': undefined,
            utc: time.now(true),
            yes: true,
        },
    };
}

/**
 * Turns the expression of the user into the predicate the board renders with.
 *
 * An expression that is blank never reaches the language at all: the board
 * skips the whole environment and shows everything, as it always has.
 *
 * @param {unknown} expr The expression the user typed.
 * @param {FilterEvaluator} evaluate The language.
 * @param {FilterFunctions} baseFuncs The functions of the language itself.
 * @param {TimePort} time The reading of dates.
 * @param {LogPort} [log] Where a failure is reported.
 *
 * @return {CardPredicate} The predicate.
 */
export function createCardPredicate(
    expr: unknown,
    evaluate: FilterEvaluator,
    baseFuncs: FilterFunctions,
    time: TimePort,
    log: LogPort = SILENT_LOG,
): CardPredicate {
    if ('' === toStringSafe(expr).trim()) {
        return () => true;
    }

    return (card: BoardCard, _column: ColumnKey): boolean => {
        if (isNil(card)) {
            return false;
        }

        return !!doesMatch(
            expr,
            createCardEnvironment(card, time),
            evaluate,
            baseFuncs,
            log,
        );
    };
}

/**
 * Reads the priority of a card, which is 0 whenever it cannot be read.
 */
function readPrio(value: unknown): number {
    const PRIO = parseFloat(toStringSafe(value).trim());

    return isNaN(PRIO) ? 0
                       : PRIO;
}

/**
 * Reads a field, that may be a plain string or a content object.
 *
 * A field that is absent stays absent: it does NOT become an empty string,
 * because an expression asking 'is_nil(details)' must keep answering true.
 */
function markdownValue(value: unknown): string | undefined {
    if (isNil(value)) {
        return undefined;
    }

    return contentOf(value as any);
}
