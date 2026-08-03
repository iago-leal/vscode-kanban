/**
 * The size of a file of the interface (RF-23).
 *
 * Four hundred lines is not an aesthetic preference: a file above it has
 * stopped being one thing, and the maintainer who comes back to this project
 * after months reads a file, not a module graph. The limit is checked rather
 * than asked for, because a limit nobody measures is a wish.
 */

import * as assert from 'assert';

import { lineCountOf, offenceReport, sourcesUnder } from './sources';

/**
 * The most lines a file of the interface may have.
 */
const LINE_LIMIT = 400;

suite('The size of a file of the interface', function () {
    test('stays at or below four hundred lines', function () {
        const OVER = sourcesUnder('src/webview')
            .map(f => ({ path: f.path, lines: lineCountOf(f.text) }))
            .filter(f => f.lines > LINE_LIMIT)
            .sort((a, b) => b.lines - a.lines);

        assert.strictEqual(
            OVER.length, 0,
            offenceReport(
                `No file under 'src/webview' may pass ${ LINE_LIMIT } lines`,
                OVER.map(f => `${ f.path }: ${ f.lines } lines`)
            )
        );
    });
});
