/**
 * The functions a filter expression may call.
 *
 * They are ported from 'vsckb_does_match()' ('script.js:58') one by one, with
 * their quirks intact: 'contains' does not trim while 'all' does, 'float' and
 * 'number' are the same function under two names, and a value that cannot be
 * read comes back as NaN rather than as an error. The filter language is a
 * contract with every expression a user has already written, so none of this
 * is tidied up here.
 */

import { LogPort, SILENT_LOG, TimePort } from './ports';
import { isNil, normalizeString, toStringSafe } from './text';

/**
 * A function callable from a filter expression.
 */
export type FilterFunction = (...args: any[]) => any;

/**
 * The functions available to an expression.
 */
export interface FilterFunctions {
    [name: string]: FilterFunction;
}

/**
 * The values available to an expression.
 */
export interface FilterValues {
    [name: string]: any;
}

/**
 * Builds the functions every expression may call, whatever card it is being
 * evaluated against.
 *
 * @param {TimePort} time The reading of dates.
 * @param {LogPort} [log] Where 'debug()' writes.
 *
 * @return {FilterFunctions} The functions.
 */
export function createBaseFilterFunctions(
    time: TimePort,
    log: LogPort = SILENT_LOG,
): FilterFunctions {
    return {
        all: (value: unknown, ...parts: unknown[]): boolean => {
            const TEXT = normalizeString(value);

            return parts.every(p => TEXT.indexOf(normalizeString(p)) > -1);
        },

        any: (value: unknown, ...parts: unknown[]): boolean => {
            const TEXT = normalizeString(value);

            return parts.some(p => TEXT.indexOf(normalizeString(p)) > -1);
        },

        concat: (...values: unknown[]): string => {
            return values.map(toStringSafe)
                         .join('');
        },

        // unlike 'all' and 'any', this one does not trim
        contains: (value: unknown, search: unknown): boolean => {
            return toStringSafe(value).toLowerCase()
                                      .indexOf(toStringSafe(search).toLowerCase()) > -1;
        },

        debug: (value: unknown, ...rest: unknown[]): unknown => {
            log(toStringSafe(value));

            return rest.length < 1 ? true
                                   : rest[0];
        },

        float: (value: unknown): number => {
            return parseFloat(normalizeString(value).trim());
        },

        int: (value: unknown): number => {
            return parseInt(normalizeString(value).trim());
        },

        integer: (value: unknown): number => {
            return parseInt(normalizeString(value).trim());
        },

        is_empty: (value: unknown): boolean => {
            return '' === toStringSafe(value).trim();
        },

        is_nan: (value: unknown, asInt?: unknown): boolean => {
            const TEXT = toStringSafe(value).trim();

            return isNaN(asInt ? parseInt(TEXT)
                               : parseFloat(TEXT));
        },

        is_nil: (value: unknown): boolean => {
            return isNil(value);
        },

        norm: (value: unknown): string => {
            return normalizeString(value);
        },

        normalize: (value: unknown): string => {
            return normalizeString(value);
        },

        number: (value: unknown): number => {
            return parseFloat(normalizeString(value).trim());
        },

        regex: (value: unknown, pattern: unknown, ...rest: unknown[]): boolean => {
            // the flags stay undefined when they were not given at all, which
            // is not the same as having been given as an empty string
            const FLAGS = rest.length > 0 ? toStringSafe(rest[0])
                                          : undefined;

            return RegExp(toStringSafe(pattern), FLAGS).test(toStringSafe(value));
        },

        str: (value: unknown): string => {
            return toStringSafe(value);
        },

        // calls a chain of methods of the string, named as 'a,b,c'
        str_invoke: (value: unknown, funcs: unknown, ...args: unknown[]): unknown => {
            const NAMES = toStringSafe(funcs).split(',')
                                             .map(f => f.trim())
                                             .filter(f => '' !== f);

            let result: any = toStringSafe(value);

            for (const NAME of NAMES) {
                result = result[NAME].apply(result, args);
            }

            return result;
        },

        unix: (value: unknown, ...rest: unknown[]): number | false => {
            // without a second argument the value is read as UTC
            const IS_UTC = rest.length < 1 ? true
                                           : !!rest[0];

            return time.unix(value, IS_UTC);
        },
    };
}
