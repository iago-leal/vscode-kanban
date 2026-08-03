/**
 * The trimming that keeps the stylesheets of the design system down to what
 * the board ships ('scripts/theme-tokens.js').
 *
 * This file exists because of a defect that shipped. The pattern that
 * recognises a component stylesheet captured the name of the component with a
 * greedy '.*' ahead of it, so the capture came back holding the last letter
 * before the hash -- 'ButtonBase-311501b9.css' yielded 'e' -- and the importer
 * built from it named a file that does not exist. No stylesheet was ever
 * recognised as shipping, all eighty-two were served empty, and the board came
 * out with no component styling whatsoever.
 *
 * What made it survive a suite of 216 tests is worth naming: the trimming had
 * no test at all, the build reported the damage as a saving, and the more
 * completely it broke the larger the number it printed.
 *
 * The rule under test is one line long: the name of the component goes in, the
 * module that imports its stylesheet comes out.
 */

import * as assert from 'assert';
import * as Path from 'path';

/* tslint:disable-next-line:no-var-requires */
const TOKENS = require('../../scripts/theme-tokens.js');

const importerOf: (path: string) => string | undefined = TOKENS.importerOf;
const COMPONENT_STYLE: RegExp = TOKENS.COMPONENT_STYLE;

/**
 * Stylesheets shaped like the ones the design system actually files, taken
 * from 'node_modules/@primer/react/dist' as it stands.
 */
const SHEETS = [
    { file: 'Button/ButtonBase-311501b9.css', component: 'ButtonBase' },
    { file: 'Text/Text-d649cda5.css', component: 'Text' },
    { file: 'BaseStyles-fda34843.css', component: 'BaseStyles' },
    { file: '_VisuallyHidden-1f156b61.css', component: '_VisuallyHidden' },
    { file: 'Tooltip/Tooltip-dd983e5b.css', component: 'Tooltip' },
];

const DIST = Path.join('node_modules', '@primer', 'react', 'dist');

suite('Trimming the stylesheets of the design system', () => {
    suite('naming the module that imports a stylesheet', () => {
        for (const SHEET of SHEETS) {
            test(`recovers '${ SHEET.component }' whole, not its last letter`, () => {
                const PATH = Path.join(DIST, SHEET.file);

                assert.strictEqual(
                    importerOf(PATH),
                    Path.join(Path.dirname(PATH), `${ SHEET.component }.module.css.js`)
                );
            });
        }

        test('leaves a stylesheet of an unfamiliar shape unclaimed', () => {
            // No hash: not one of theirs, and guessing an importer for it
            // would drop a sheet that nothing can vouch for.
            assert.strictEqual(
                importerOf(Path.join(DIST, 'Button', 'ButtonBase.css')),
                undefined
            );
        });

        test('does not claim a stylesheet from outside the design system', () => {
            assert.strictEqual(
                importerOf(Path.join('src', 'webview', 'theme', 'board-1234abcd.css')),
                undefined
            );
        });
    });

    suite('recognising a component stylesheet', () => {
        for (const SHEET of SHEETS) {
            test(`matches '${ SHEET.file }'`, () => {
                assert.ok(COMPONENT_STYLE.test(Path.join(DIST, SHEET.file)));
            });
        }

        test('refuses the stylesheet of this project', () => {
            assert.ok(
                !COMPONENT_STYLE.test(Path.join('src', 'webview', 'theme', 'board.css'))
            );
        });
    });
});
