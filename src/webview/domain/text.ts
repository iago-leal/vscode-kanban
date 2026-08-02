/**
 * The string handling the board has always used.
 *
 * These four functions are ported from 'script.js' without any change of
 * behaviour: sorting, filtering and the display of a card all depend on their
 * exact results, down to how they treat null and how they trim.
 */

/**
 * Tells whether a value is null or undefined.
 *
 * @param {unknown} value The value to check.
 *
 * @return {boolean} Is nil or not.
 */
export function isNil(value: unknown): boolean {
    return null === value ||
           'undefined' === typeof value;
}

/**
 * Converts a value to a string, mapping null and undefined to an empty one.
 *
 * @param {unknown} value The value to convert.
 *
 * @return {string} The string.
 */
export function toStringSafe(value: unknown): string {
    if ('string' === typeof value) {
        return value;
    }

    if (isNil(value)) {
        return '';
    }

    return '' + value;
}

/**
 * Normalises a value for comparison: lower case, without surrounding spaces.
 *
 * @param {unknown} value The value to normalise.
 *
 * @return {string} The normalised string.
 */
export function normalizeString(value: unknown): string {
    return toStringSafe(value).toLowerCase()
                              .trim();
}

/**
 * Compares two values the way the board sorts by title.
 *
 * @param {T} x The left value.
 * @param {T} y The right value.
 *
 * @return {number} -1, 0 or 1.
 */
export function compareValues<T>(x: T, y: T): number {
    if (x !== y) {
        if (x > y) {
            return 1;
        }

        return -1;
    }

    return 0;
}
