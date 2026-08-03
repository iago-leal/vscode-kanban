/**
 * Where the letters of the board come from (RF-26).
 *
 * The typography follows the scale of the design system, but the design system
 * does not ship the letters: they are resolved from the font stack of the
 * operating system, which is why the board reads like the editor around it and
 * why it costs nothing to load. A font file in the bundle would undo both, and
 * in a Webview that is meant to work with the machine offline it would also be
 * one more thing to serve.
 *
 * The rule is checked from two sides. The built bundle may not CARRY a font,
 * which is the fact itself; and the bundler may not be ABLE to take one in,
 * which is what keeps the fact true tomorrow. The second matters more: it
 * turns the rule into a build error rather than a test that someone has to
 * remember to run after building.
 */

import * as assert from 'assert';

import { numberedLines, offenceReport, sourceOf, sourcesUnder, withoutComments } from './sources';

/**
 * The extensions a font arrives under.
 */
const FONT_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.otf', '.eot', '.fon'];

/**
 * Where the bundler writes, and what configures it.
 */
const BUNDLE_DIR = 'out/res/webview';
const BUNDLE_STYLESHEET = 'out/res/webview/main.css';
const BUNDLER = 'scripts/build-webview.js';

/**
 * A face declared with a file behind it, as opposed to one that only names
 * what the system already has.
 */
const FACE_WITH_A_FILE = /@font-face[\s\S]*?\}/g;

suite('Where the letters of the board come from', function () {
    test('no source asks for a font file', function () {
        const OFFENCES: string[] = [];

        for (const FILE of sourcesUnder('src/webview')) {
            for (const LINE of numberedLines(withoutComments(FILE.text))) {
                for (const EXTENSION of FONT_EXTENSIONS) {
                    if (LINE.text.indexOf(EXTENSION) > -1) {
                        OFFENCES.push(
                            `${ FILE.path }:${ LINE.line }: ${ LINE.text.trim() }`
                        );
                        break;
                    }
                }
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport(
                'The board names a font, it does not carry one',
                OFFENCES
            )
        );
    });

    test('the bundler could not take one in if it were asked', function () {
        const SCRIPT = sourceOf(BUNDLER);

        assert.ok(SCRIPT, `${ BUNDLER } is missing`);

        const DECLARED = FONT_EXTENSIONS.filter(
            e => new RegExp(`['"]\\${ e }['"]\\s*:`).test(SCRIPT!.text)
        );

        assert.deepStrictEqual(
            DECLARED, [],
            'A loader for a font extension would let one into the bundle' +
            ' silently. Without it, an import of a font fails the build, which' +
            ` is the report this rule wants: ${ DECLARED.join(', ') }`
        );
    });

    test('the built bundle carries none', function () {
        const BUILT = sourcesUnder(BUNDLE_DIR);

        // the bundle is built by 'npm run build:webview', which the unit suite
        // does not run; when it has not been built there is nothing to inspect
        // and nothing to report, and the two checks above still hold
        if (0 === BUILT.length) {
            return;
        }

        const FONTS = BUILT.filter(
            f => FONT_EXTENSIONS.some(e => f.path.toLowerCase().endsWith(e))
        );

        assert.strictEqual(
            FONTS.length, 0,
            offenceReport(
                `No font file may be emitted into ${ BUNDLE_DIR }`,
                FONTS.map(f => f.path)
            )
        );
    });

    test('and its stylesheet declares no face of its own', function () {
        const SHEET = sourceOf(BUNDLE_STYLESHEET);

        if (!SHEET) {
            return;
        }

        const FACES: string[] = [];

        FACE_WITH_A_FILE.lastIndex = 0;

        let match = FACE_WITH_A_FILE.exec(SHEET.text);

        while (match) {
            // 'local(...)' names a font already installed and downloads
            // nothing; 'url(...)' is the one that fetches
            if (/url\s*\(/.test(match[0])) {
                FACES.push(match[0].replace(/\s+/g, ' ').slice(0, 120));
            }

            match = FACE_WITH_A_FILE.exec(SHEET.text);
        }

        assert.strictEqual(
            FACES.length, 0,
            offenceReport(
                'A face that fetches its file is a font shipped by another name',
                FACES
            )
        );
    });
});
