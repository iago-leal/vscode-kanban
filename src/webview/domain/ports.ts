/**
 * What the domain needs from the outside, stated as interfaces.
 *
 * The board still leans on Moment, Showdown, Mermaid, highlight.js, CodeMirror
 * and Filtrex, and this feature does not replace any of them. What it does is
 * stop naming them in the rules: the domain asks for a capability, and the
 * adapters in 'src/webview/adapters/' are the only place a library is named.
 */

/**
 * Reading of dates and times.
 *
 * The filter of the cards and the display of a card both need it. Every method
 * answers 'false' for a value it cannot read, the way the board has always
 * signalled an unusable creation time.
 */
export interface TimePort {
    /**
     * Seconds since the epoch for a value.
     *
     * @param {unknown} value The value to read.
     * @param {boolean} utc Read it as UTC instead of local time.
     *
     * @return {number|false} The timestamp, false when the value is unusable.
     */
    unix(value: unknown, utc: boolean): number | false;

    /**
     * Seconds since the epoch for the present moment.
     *
     * @param {boolean} utc Count from UTC instead of local time.
     *
     * @return {number} The timestamp.
     */
    now(utc: boolean): number;

    /**
     * Orders two instants, at full precision.
     *
     * @param {unknown} left The left instant.
     * @param {unknown} right The right instant.
     *
     * @return {number|false} -1, 0 or 1; false when either is unusable.
     */
    compare(left: unknown, right: unknown): number | false;

    /**
     * Whole days from a value to the present, both reduced to their date.
     *
     * Reducing to the date first is what makes 'is_older(1)' mean "created on
     * an earlier day", rather than "created more than 24 hours ago".
     *
     * @param {unknown} value The instant to count from.
     *
     * @return {number|false} The days, false when the value is unusable.
     */
    daysSince(value: unknown): number | false;

    /**
     * Says how long ago an instant was, in the words the card has always used.
     *
     * The wording is a contract with whoever reads the board: '< 1 min',
     * '~ 3 min', 'today', 'yesterday', '~ 5 d'. It is not Moment's own
     * phrasing, and it is not localised.
     *
     * @param {unknown} value The instant.
     *
     * @return {string} The text, empty when the value is unusable.
     */
    prettyTime(value: unknown): string;

    /**
     * Says how long a span lasted, for the tracking of time.
     *
     * @param {number} millis The length of the span.
     *
     * @return {string} The text.
     */
    duration(millis: number): string;
}

/**
 * Conversion of Markdown into HTML that is safe to insert.
 *
 * The board has always rendered the description and the details of a card as
 * Markdown; the barrier that strips dangerous markup belongs to the adapter.
 */
export interface MarkdownPort {
    /**
     * Converts Markdown into HTML.
     *
     * @param {unknown} markdown The source text.
     *
     * @return {string} The HTML, already sanitised.
     */
    toHtml(markdown: unknown): string;
}

/**
 * Writing to the log of the extension.
 *
 * Nothing in the Webview may fail silently, so every place that swallows an
 * error takes one of these.
 */
export type LogPort = (message: string) => void;

/**
 * A log that goes nowhere: the default for code paths, that run in a test.
 */
export const SILENT_LOG: LogPort = () => { };
