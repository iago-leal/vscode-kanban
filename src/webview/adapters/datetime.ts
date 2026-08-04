/**
 * Dates and times, over Moment.
 *
 * The only file that names Moment. It answers the 'TimePort' the filter and
 * the card ask for, keeping the readings of 'board.js:762' intact: 'is_after'
 * compares two instants at full precision, while 'is_older' first reduces both
 * to their date, so that "older than one day" means "created on an earlier
 * day" and not "created more than twenty-four hours ago".
 *
 * When Moment is not on the page — which is the case inside a test running on
 * Node — the same readings are done with the built-in Date. That covers the
 * ISO 8601 timestamps the board writes into 'creation_time'; a value in one of
 * the looser formats Moment also accepts is reported as unusable there, which
 * is the same answer the board gives for a value it cannot read.
 */

import { TimePort } from '../domain/ports';
import { lookUpVendor } from './vendor';
import { toStringSafe } from '../domain/text';

/**
 * The part of Moment this adapter uses.
 */
interface MomentInstance {
    isValid(): boolean;
    unix(): number;
    valueOf(): number;
    format(pattern: string): string;
    fromNow(): string;
    utc(): MomentInstance;
    local(): MomentInstance;
    diff(other: MomentInstance, unit: string): number;
}

interface MomentLib {
    (value?: unknown, pattern?: string): MomentInstance;
    utc(value?: unknown, pattern?: string): MomentInstance;
}

/**
 * The name of the global.
 */
const VENDOR = 'moment';

/**
 * How many milliseconds a day has, for the fallback.
 */
const DAY = 24 * 60 * 60 * 1000;

/**
 * Builds the reading of dates and times.
 *
 * @return {TimePort} The reading.
 */
export function createMomentTime(): TimePort {
    return {
        unix: (value: unknown, utc: boolean): number | false => {
            const MOMENT = lookUpVendor<MomentLib>(VENDOR);

            if (MOMENT) {
                const TIME = utc ? MOMENT.utc(toStringSafe(value))
                                 : MOMENT(toStringSafe(value));

                return TIME.isValid() ? TIME.unix()
                                      : false;
            }

            const MILLIS = parseNative(value);

            return undefined === MILLIS ? false
                                        : Math.floor(MILLIS / 1000);
        },

        now: (utc: boolean): number => {
            const MOMENT = lookUpVendor<MomentLib>(VENDOR);

            if (MOMENT) {
                return utc ? MOMENT.utc().unix()
                           : MOMENT().unix();
            }

            // an instant is the same instant in either zone: the board asks
            // for both names because its filter language offers both
            return Math.floor(Date.now() / 1000);
        },

        compare: (left: unknown, right: unknown): number | false => {
            const LEFT = instantOf(left);
            const RIGHT = instantOf(right);

            if (undefined === LEFT || undefined === RIGHT) {
                return false;
            }

            if (LEFT === RIGHT) {
                return 0;
            }

            return LEFT > RIGHT ? 1 : -1;
        },

        daysSince: (value: unknown): number | false => {
            const MOMENT = lookUpVendor<MomentLib>(VENDOR);

            if (MOMENT) {
                const TIME = MOMENT.utc(toStringSafe(value));

                if (!TIME.isValid()) {
                    return false;
                }

                return toDate(MOMENT, MOMENT.utc()).diff(toDate(MOMENT, TIME), 'days');
            }

            const MILLIS = parseNative(value);

            if (undefined === MILLIS) {
                return false;
            }

            return Math.round(
                (atMidnight(Date.now()) - atMidnight(MILLIS)) / DAY
            );
        },

        prettyTime: (value: unknown): string => {
            const MILLIS = instantOf(value);

            if (undefined === MILLIS) {
                return '';
            }

            return prettyTime(MILLIS, Date.now());
        },

        duration: (millis: number): string => {
            const SECONDS = Math.floor(Math.abs(millis) / 1000);

            const HOURS = Math.floor(SECONDS / 3600);
            const MINUTES = Math.floor((SECONDS % 3600) / 60);

            if (HOURS > 0) {
                return `${ HOURS } h ${ MINUTES } min`;
            }

            if (MINUTES > 0) {
                return `${ MINUTES } min`;
            }

            return `${ SECONDS } s`;
        },
    };
}

/**
 * Says how long ago an instant was, exactly as 'vsckb_to_pretty_time()'
 * ('script.js:376') always has.
 *
 * The thresholds are reproduced rather than replaced: someone reading a board
 * knows what '~ 1 d' means there, and a rewrite is not the place to renegotiate
 * it. Both instants are read in UTC, which is why a card created late in the
 * evening can say 'yesterday' before local midnight.
 *
 * @param {number} millis The instant.
 * @param {number} nowMillis The present moment.
 *
 * @return {string} The text.
 */
export function prettyTime(millis: number, nowMillis: number): string {
    const SECONDS = Math.floor((nowMillis - millis) / 1000);

    if (SECONDS < 60) {
        return '< 1 min';
    }

    if (SECONDS < 120) {
        return '~ 1 min';
    }

    if (SECONDS < 3600) {
        return `~ ${ Math.floor(SECONDS / 60.0) } min`;
    }

    if (SECONDS < 7200) {
        return '~ 1 h';
    }

    const DAY_OF = (value: number) => new Date(value).toISOString().substr(0, 10);

    if (DAY_OF(nowMillis) === DAY_OF(millis)) {
        return 'today';
    }

    if (DAY_OF(nowMillis - DAY) === DAY_OF(millis)) {
        return 'yesterday';
    }

    if (SECONDS < 172800) {
        return '~ 1 d';
    }

    return `~ ${ Math.floor(SECONDS / 86400.0) } d`;
}

/**
 * Reads an instant into milliseconds, whichever library is available.
 */
function instantOf(value: unknown): number | undefined {
    const MOMENT = lookUpVendor<MomentLib>(VENDOR);

    if (MOMENT) {
        const TIME = MOMENT(toStringSafe(value));

        return TIME.isValid() ? TIME.valueOf()
                              : undefined;
    }

    return parseNative(value);
}

/**
 * Reads an instant with the built-in Date.
 */
function parseNative(value: unknown): number | undefined {
    const TEXT = toStringSafe(value).trim();

    if ('' === TEXT) {
        return undefined;
    }

    const MILLIS = Date.parse(TEXT);

    return isNaN(MILLIS) ? undefined
                         : MILLIS;
}

/**
 * Reduces a moment to its date at midnight UTC.
 */
function toDate(lib: MomentLib, time: MomentInstance): MomentInstance {
    return lib.utc(
        `${ time.format('YYYY-MM-DD') } 00:00:00`,
        'YYYY-MM-DD HH:mm:ss'
    );
}

/**
 * Reduces a timestamp to its date at midnight UTC.
 */
function atMidnight(millis: number): number {
    const DATE = new Date(millis);

    return Date.UTC(
        DATE.getUTCFullYear(),
        DATE.getUTCMonth(),
        DATE.getUTCDate()
    );
}
