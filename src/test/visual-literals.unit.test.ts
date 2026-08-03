/**
 * Where the appearance of the board is allowed to come from (RF-01, RF-24,
 * RN-07).
 *
 * Three rules, and they are not the same one written three times.
 *
 * The components under 'src/webview/ui/' may not carry a visual LITERAL: a
 * colour, a radius, a shadow or a font size written out by hand. They are
 * free to name a variable of the design system, because that is precisely the
 * adoption this feature is about.
 *
 * The stylesheet of the board is held to more than that. It is allowed to
 * declare GEOMETRY only — the width of a column lane, the stack of cards, the
 * drop area, the collapse — and no colour, radius, shadow or font size at all,
 * variable or not. That is the whole proof of RN-07: with the stylesheet of
 * the design system switched off, the board has to lose its colour. It cannot
 * lose it if a second stylesheet is quietly redeclaring it.
 *
 * The stylesheet of appearance is the other half of that split, and the rule
 * on it is the mirror image: it exists to paint, and every painting
 * declaration in it has to name a token. That is what keeps the proof intact
 * once the board has colour again. A sheet painting through 'var(--token)'
 * cannot survive the design system being switched off — the tokens go and the
 * paint goes with them — and a sheet with one hex value in it becomes a second
 * source of colour, which is exactly what RN-07 forbids. Splitting the sheets
 * without this test would move the offence rather than prevent it.
 */

import * as assert from 'assert';

import {
    numberedLines,
    offenceReport,
    sourceOf,
    sourcesUnder,
    withoutComments,
} from './sources';

/**
 * The stylesheet of the board, which is held to the stricter of the two rules.
 */
const BOARD_STYLESHEET = 'src/webview/theme/board.css';

/**
 * The stylesheet that paints, and may paint only by naming a token.
 */
const APPEARANCE_STYLESHEET = 'src/webview/theme/appearance.css';

/**
 * A colour written out by hand, in any of the notations CSS accepts.
 */
const COLOUR_LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(|\bcolor-mix\s*\(/;

/**
 * A length written out by hand, which is a literal wherever a font size, a
 * radius or a shadow is expected.
 */
const LENGTH_LITERAL = /\b\d+(\.\d+)?(px|pt|em|rem|ch|vh|vw)\b/;

/**
 * The properties that paint, as opposed to the ones that place.
 */
const COLOUR_PROPERTIES = [
    'color', 'background', 'background-color', 'background-image',
    'border-color', 'border-top-color', 'border-right-color',
    'border-bottom-color', 'border-left-color', 'outline-color',
    'caret-color', 'accent-color', 'text-decoration-color',
    'column-rule-color', 'fill', 'stroke',
];

/**
 * The shorthands that may carry a colour among other things.
 */
const COLOUR_SHORTHANDS = [
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'outline', 'text-decoration', 'column-rule',
];

/**
 * The properties of a radius.
 */
const RADIUS_PROPERTIES = [
    'border-radius', 'border-top-left-radius', 'border-top-right-radius',
    'border-bottom-left-radius', 'border-bottom-right-radius',
];

/**
 * The properties of a shadow, and the size of a text.
 */
const SHADOW_PROPERTIES = ['box-shadow', 'text-shadow'];
const FONT_SIZE_PROPERTIES = ['font-size'];

/**
 * A declaration of a stylesheet, as a property and its value.
 */
interface Declaration {
    line: number;
    property: string;
    value: string;
}

/**
 * Reads the declarations out of a stylesheet.
 *
 * This is deliberately a reader of lines and not a parser of CSS: the rule is
 * about what a maintainer sees written down, and one declaration per line is
 * how this project writes them.
 *
 * @param {string} css The stylesheet.
 *
 * @return {Declaration[]} The declarations found.
 */
function declarationsOf(css: string): Declaration[] {
    const FOUND: Declaration[] = [];

    for (const LINE of numberedLines(withoutComments(css))) {
        const MATCH = /^\s*([a-zA-Z-]+)\s*:\s*([^;]+);?\s*$/.exec(LINE.text);

        // a custom property declares a value, it does not paint with one
        if (!MATCH || MATCH[1].startsWith('--')) {
            continue;
        }

        FOUND.push({
            line: LINE.line,
            property: MATCH[1].toLowerCase(),
            value: MATCH[2].trim(),
        });
    }

    return FOUND;
}

/**
 * Tells whether the value of a shorthand mentions a colour.
 *
 * 'border: 0' places without painting and stays; 'border: 1px solid <colour>'
 * paints and does not.
 *
 * @param {string} value The value.
 *
 * @return {boolean} Mentions a colour or not.
 */
function mentionsColour(value: string): boolean {
    return COLOUR_LITERAL.test(value) ||
           /\bvar\s*\(/.test(value) ||
           /\b(transparent|currentcolor)\b/i.test(value);
}

suite('Where the appearance of the board comes from', function () {
    suite('the components of the interface', function () {
        test('write no visual value by hand', function () {
            const OFFENCES: string[] = [];

            for (const FILE of sourcesUnder('src/webview/ui', ['.ts', '.tsx'])) {
                for (const LINE of numberedLines(withoutComments(FILE.text))) {
                    if (COLOUR_LITERAL.test(LINE.text)) {
                        OFFENCES.push(
                            `${ FILE.path }:${ LINE.line }: colour written out` +
                            ` -- ${ LINE.text.trim() }`
                        );
                        continue;
                    }

                    // a length is only a visual literal where a visual
                    // property is being set; a width or a gap is geometry
                    const VISUAL = /\b(font-size|fontSize|border-radius|borderRadius|box-shadow|boxShadow|text-shadow|textShadow)\b/;

                    if (VISUAL.test(LINE.text) && LENGTH_LITERAL.test(LINE.text)) {
                        OFFENCES.push(
                            `${ FILE.path }:${ LINE.line }: visual size written` +
                            ` out -- ${ LINE.text.trim() }`
                        );
                    }
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport(
                    'A component may name a variable of the design system,' +
                    ' never a value of its own',
                    OFFENCES
                )
            );
        });
    });

    suite('the stylesheet of the board', function () {
        test('declares geometry, and nothing that paints', function () {
            const SHEET = sourceOf(BOARD_STYLESHEET);

            assert.ok(SHEET, `${ BOARD_STYLESHEET } is missing`);

            const OFFENCES: string[] = [];

            for (const DECLARATION of declarationsOf(SHEET!.text)) {
                const NAME = DECLARATION.property;

                const PAINTS =
                    COLOUR_PROPERTIES.indexOf(NAME) > -1 ||
                    RADIUS_PROPERTIES.indexOf(NAME) > -1 ||
                    SHADOW_PROPERTIES.indexOf(NAME) > -1 ||
                    FONT_SIZE_PROPERTIES.indexOf(NAME) > -1 ||
                    (COLOUR_SHORTHANDS.indexOf(NAME) > -1 &&
                     mentionsColour(DECLARATION.value));

                if (PAINTS) {
                    OFFENCES.push(
                        `${ BOARD_STYLESHEET }:${ DECLARATION.line }:` +
                        ` ${ NAME }: ${ DECLARATION.value }`
                    );
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport(
                    'With the design system switched off the board has to lose' +
                    ' its colour, which it cannot do while this sheet still' +
                    ' paints -- what paints belongs in ' + APPEARANCE_STYLESHEET,
                    OFFENCES
                )
            );
        });
    });

    suite('the stylesheet of appearance', function () {
        test('paints only by naming a token of the design system', function () {
            const SHEET = sourceOf(APPEARANCE_STYLESHEET);

            assert.ok(SHEET, `${ APPEARANCE_STYLESHEET } is missing`);

            const OFFENCES: string[] = [];

            for (const DECLARATION of declarationsOf(SHEET!.text)) {
                const NAME = DECLARATION.property;
                const VALUE = DECLARATION.value;

                const PAINTS =
                    COLOUR_PROPERTIES.indexOf(NAME) > -1 ||
                    COLOUR_SHORTHANDS.indexOf(NAME) > -1 ||
                    RADIUS_PROPERTIES.indexOf(NAME) > -1 ||
                    SHADOW_PROPERTIES.indexOf(NAME) > -1 ||
                    FONT_SIZE_PROPERTIES.indexOf(NAME) > -1;

                if (!PAINTS) {
                    continue;
                }

                // 'border: 0' places without painting, and a shorthand that
                // names no colour at all is the one case a painting property
                // may carry a bare value
                const IS_BARE_SHORTHAND =
                    COLOUR_SHORTHANDS.indexOf(NAME) > -1 && !mentionsColour(VALUE);

                if (IS_BARE_SHORTHAND) {
                    continue;
                }

                if (COLOUR_LITERAL.test(VALUE) || LENGTH_LITERAL.test(VALUE)) {
                    OFFENCES.push(
                        `${ APPEARANCE_STYLESHEET }:${ DECLARATION.line }:` +
                        ` value written out -- ${ NAME }: ${ VALUE }`
                    );
                    continue;
                }

                if (!/\bvar\s*\(\s*--/.test(VALUE)) {
                    OFFENCES.push(
                        `${ APPEARANCE_STYLESHEET }:${ DECLARATION.line }:` +
                        ` names no token -- ${ NAME }: ${ VALUE }`
                    );
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport(
                    'This sheet is the only one allowed to paint, and only' +
                    ' through the tokens of the design system: a value written' +
                    ' out here would survive the design system being switched' +
                    ' off, and RN-07 says nothing may',
                    OFFENCES
                )
            );
        });

        test('is the one this project imports for its appearance', function () {
            const APP = sourceOf('src/webview/ui/App.tsx');

            assert.ok(APP, 'src/webview/ui/App.tsx is missing');

            assert.ok(
                APP!.text.indexOf('theme/appearance.css') > -1,
                'A sheet nothing imports paints nothing: the board would go' +
                ' back to the unpainted state card [41] describes, and every' +
                ' rule above would still pass.'
            );
        });
    });
});
