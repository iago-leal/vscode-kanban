/**
 * The contrast each colour set actually delivers (accessibility requirement).
 *
 * The requirement asks for 4,5 to 1 between running text and its ground, and
 * 3 to 1 for large text. Adopting a design system is a good reason to believe
 * those ratios hold and a bad reason to stop checking: the sets are chosen
 * HERE, from fourteen the package ships, and choosing badly is this project's
 * mistake and not the package's.
 *
 * So the numbers are read out of the stylesheets that ship and computed, by
 * the formula of WCAG 2.1. This is the automated half of action T060; the
 * other half -- reading the board with a contrast meter over it -- needs a
 * running editor, and is worth doing once.
 *
 * What is measured is the pairing the board relies on most: the default
 * foreground on the default background, and the muted foreground on the same
 * ground, which is what the metadata of a card is drawn in.
 */

import * as assert from 'assert';

import { offenceReport, projectRoot } from './sources';

import * as FS from 'fs';
import * as Path from 'path';

/**
 * The four sets the board offers, filed as the package files them.
 */
const OFFERED = [
    'light.css',
    'dark.css',
    'light-high-contrast.css',
    'dark-high-contrast.css',
];

/**
 * The pairings checked, and the ratio each one owes.
 */
const PAIRINGS = [
    { text: '--fgColor-default', ground: '--bgColor-default', ratio: 4.5, what: 'running text' },
    { text: '--fgColor-muted', ground: '--bgColor-default', ratio: 4.5, what: 'metadata of a card' },
    { text: '--fgColor-default', ground: '--bgColor-muted', ratio: 4.5, what: 'text on a raised surface' },
];

/**
 * Reads the value of a token out of a stylesheet.
 *
 * The first declaration wins, which is the one of the set proper: the blocks
 * that follow it answer for the automatic mode, and repeat the same values.
 *
 * @param {string} css The stylesheet.
 * @param {string} token The name of the token.
 *
 * @return {string|undefined} The value.
 */
function valueOf(css: string, token: string): string | undefined {
    const MATCH = new RegExp(`^\\s*${ token }\\s*:\\s*([^;]+);`, 'm').exec(css);

    return MATCH ? MATCH[1].trim() : undefined;
}

/**
 * Reads a colour into its three channels.
 *
 * Only the notations the sets actually use are understood -- three, six and
 * eight digit hexadecimal. A value in any other notation returns nothing and
 * is reported rather than guessed at.
 *
 * @param {string} value The colour.
 *
 * @return {number[]|undefined} The channels, from zero to two hundred and fifty-five.
 */
function channelsOf(value: string): number[] | undefined {
    const HEX = /^#([0-9a-fA-F]{3,8})$/.exec(value.trim());

    if (!HEX) {
        return undefined;
    }

    const DIGITS = HEX[1];

    if (3 === DIGITS.length || 4 === DIGITS.length) {
        return [0, 1, 2].map(i => parseInt(DIGITS[i] + DIGITS[i], 16));
    }

    if (6 === DIGITS.length || 8 === DIGITS.length) {
        return [0, 2, 4].map(i => parseInt(DIGITS.substr(i, 2), 16));
    }

    return undefined;
}

/**
 * The relative luminance of a colour, as WCAG 2.1 defines it.
 */
function luminanceOf(channels: number[]): number {
    const LINEAR = channels.map((channel) => {
        const VALUE = channel / 255;

        return VALUE <= 0.03928 ? VALUE / 12.92
                                : Math.pow((VALUE + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * LINEAR[0] + 0.7152 * LINEAR[1] + 0.0722 * LINEAR[2];
}

/**
 * The contrast ratio between two colours, from one to twenty-one.
 */
function contrastOf(first: number[], second: number[]): number {
    const A = luminanceOf(first);
    const B = luminanceOf(second);

    return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05);
}

/**
 * Reads one of the sets that ship.
 */
function setOf(file: string): string {
    return FS.readFileSync(
        Path.join(
            projectRoot(), 'node_modules', '@primer', 'primitives', 'dist',
            'css', 'functional', 'themes', file
        ),
        'utf8'
    );
}

suite('The contrast of the colour sets the board offers', function () {
    test('meets the ratio the requirement asks for, in all four', function () {
        const OFFENCES: string[] = [];
        const MEASURED: string[] = [];

        for (const FILE of OFFERED) {
            const CSS = setOf(FILE);

            for (const PAIRING of PAIRINGS) {
                const TEXT = valueOf(CSS, PAIRING.text);
                const GROUND = valueOf(CSS, PAIRING.ground);

                if (!TEXT || !GROUND) {
                    OFFENCES.push(
                        `${ FILE }: ${ PAIRING.text } or ${ PAIRING.ground } is` +
                        ' not declared, so the pairing cannot be measured'
                    );

                    continue;
                }

                const FOREGROUND = channelsOf(TEXT);
                const BACKGROUND = channelsOf(GROUND);

                if (!FOREGROUND || !BACKGROUND) {
                    OFFENCES.push(
                        `${ FILE }: ${ TEXT } on ${ GROUND } is written in a` +
                        ' notation this test does not read'
                    );

                    continue;
                }

                const RATIO = contrastOf(FOREGROUND, BACKGROUND);

                MEASURED.push(
                    `${ FILE } ${ PAIRING.what }: ${ RATIO.toFixed(2) }:1`
                );

                if (RATIO < PAIRING.ratio) {
                    OFFENCES.push(
                        `${ FILE }: ${ PAIRING.what } comes out at ${
                            RATIO.toFixed(2) }:1, below the ${ PAIRING.ratio }:1` +
                        ' the requirement asks for'
                    );
                }
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport(
                `pairings below the ratio owed (measured: ${ MEASURED.join('; ') })`,
                OFFENCES
            )
        );
    });

    test('separates more, not less, in the high contrast sets', function () {
        // the whole point of offering them: whatever the plain sets manage,
        // the contrasted ones have to beat it, or the fourth state of the
        // theme control is a state that changes nothing (RF-09)
        const OFFENCES: string[] = [];

        const PAIRS = [
            { plain: 'light.css', contrasted: 'light-high-contrast.css' },
            { plain: 'dark.css', contrasted: 'dark-high-contrast.css' },
        ];

        for (const PAIR of PAIRS) {
            const MEASURE = (file: string) => {
                const CSS = setOf(file);

                return contrastOf(
                    channelsOf(valueOf(CSS, '--fgColor-default') || '') || [0, 0, 0],
                    channelsOf(valueOf(CSS, '--bgColor-default') || '') || [0, 0, 0]
                );
            };

            const PLAIN = MEASURE(PAIR.plain);
            const CONTRASTED = MEASURE(PAIR.contrasted);

            if (CONTRASTED <= PLAIN) {
                OFFENCES.push(
                    `${ PAIR.contrasted } comes out at ${ CONTRASTED.toFixed(2) }:1,` +
                    ` no better than ${ PAIR.plain } at ${ PLAIN.toFixed(2) }:1`
                );
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport('high contrast sets that do not contrast more', OFFENCES)
        );
    });
});
