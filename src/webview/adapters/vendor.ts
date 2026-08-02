/**
 * Reaching the vendored libraries.
 *
 * Filtrex, Showdown, Mermaid, highlight.js, CodeMirror and Moment are not
 * packages: they are scripts served by 'html.ts' and they arrive as globals.
 * The bundle cannot import them, so every adapter picks its library up from
 * here, and nowhere else does the code reach for the window.
 *
 * A library that is missing raises a NAMED error instead of producing
 * 'undefined is not a function' three call frames later.
 */

/**
 * Raised when a vendored library is not on the page.
 */
export class MissingVendorError extends Error {
    constructor(public readonly vendor: string) {
        super(`The vendored library '${ vendor }' is not loaded`);

        this.name = 'MissingVendorError';
    }
}

/**
 * Returns a global served by the document.
 *
 * @param {string} name The name of the global.
 *
 * @return {T} The library.
 *
 * @throws {MissingVendorError} It is not loaded.
 */
export function requireVendor<T>(name: string): T {
    const VALUE = lookUpVendor<T>(name);

    if (undefined === VALUE) {
        throw new MissingVendorError(name);
    }

    return VALUE;
}

/**
 * Returns a global served by the document, or nothing when it is absent.
 *
 * @param {string} name The name of the global.
 *
 * @return {T|undefined} The library, when it is there.
 */
export function lookUpVendor<T>(name: string): T | undefined {
    if ('undefined' === typeof globalThis) {
        return undefined;
    }

    const VALUE = (globalThis as unknown as Record<string, unknown>)[name];

    return undefined === VALUE || null === VALUE ? undefined
                                                 : VALUE as T;
}
