/// <reference path="../webview/assets.d.ts" />

/**
 * The one place that maps a theme of the board onto a colour set of the design
 * system (RF-08, and the bundle size of the performance requirement).
 *
 * Two things are checked here, and the second is the expensive one.
 *
 * The first is that every state the board offers lands on a set that exists:
 * a name outside the imported ones has no stylesheet in the bundle and would
 * leave the board unpainted.
 *
 * The second is the converse, and it is a size rule wearing the clothes of a
 * correctness rule. The design system ships fourteen colour sets at roughly
 * 118 KB each. Importing one the user can never reach costs the whole of it
 * and buys nothing, so the set of names offered and the set of stylesheets
 * imported have to be the SAME set, checked in both directions.
 */

import * as assert from 'assert';

import { EffectiveTheme, ThemePreference } from '../webview/domain/types';
import { THEME_CYCLE, isHighContrast, resolveTheme } from '../webview/domain/view-state';
import { sourceOf } from './sources';

// The types come by a static import, which is what puts the module into the
// compilation; the values come by 'require', after the line below. A static
// import of the values would run the module before that line, and the module
// imports stylesheets.
import type * as PrimerThemes from '../webview/theme/primer-themes';

// A stylesheet imported from a module is an instruction to the bundler, not a
// value: esbuild resolves it, Node knows nothing of it. So Node is told to
// ignore the extension before the module under test is loaded.
require.extensions['.css'] = () => undefined;

/* tslint:disable-next-line:no-var-requires */
const THEMES: typeof PrimerThemes = require('../webview/theme/primer-themes');

const OFFERED_THEMES: readonly string[] = THEMES.OFFERED_THEMES;
const primerThemeAttributes = THEMES.primerThemeAttributes;
const primerThemeName = THEMES.primerThemeName;

/**
 * Where the design system keeps its colour sets.
 */
const THEME_MODULE = 'src/webview/theme/primer-themes.ts';
const THEME_IMPORT = /@primer\/primitives\/dist\/css\/functional\/themes\/([a-z-]+)\.css/g;

/**
 * The two axes a set is chosen by.
 */
const MODES: EffectiveTheme[] = ['light', 'dark'];
const CONTRASTS = [false, true];

suite('The colour sets the board offers', function () {
    test('are four, and all different', function () {
        assert.strictEqual(OFFERED_THEMES.length, 4);
        assert.strictEqual(new Set(OFFERED_THEMES).size, 4);
    });

    test('answer one for each mode and degree of contrast', function () {
        const RESOLVED = [];

        for (const MODE of MODES) {
            for (const CONTRAST of CONTRASTS) {
                RESOLVED.push(primerThemeName(MODE, CONTRAST));
            }
        }

        assert.strictEqual(
            new Set(RESOLVED).size, RESOLVED.length,
            `Two states share a colour set: ${ RESOLVED.join(', ') }`
        );

        assert.deepStrictEqual(
            RESOLVED.slice().sort(), OFFERED_THEMES.slice().sort(),
            'Every set imported has to be reachable, and every state reachable' +
            ' has to have a set'
        );
    });

    test('cover every preference the theme control cycles through', function () {
        for (const PREFERENCE of THEME_CYCLE) {
            for (const EDITOR of MODES) {
                const NAME = primerThemeName(
                    resolveTheme(PREFERENCE as ThemePreference, EDITOR),
                    isHighContrast(PREFERENCE as ThemePreference)
                );

                assert.ok(
                    OFFERED_THEMES.indexOf(NAME) > -1,
                    `'${ PREFERENCE }' under a ${ EDITOR } editor asks for` +
                    ` '${ NAME }', which is not among the sets imported`
                );
            }
        }
    });

    test('never come from the editor when high contrast is not chosen', function () {
        // the rule of RF-09, read through the mapping: whatever the editor
        // shows, a board that was not put into high contrast does not land on
        // a high contrast set
        for (const PREFERENCE of THEME_CYCLE) {
            if ('high-contrast' === PREFERENCE) {
                continue;
            }

            for (const EDITOR of MODES) {
                const NAME = primerThemeName(
                    resolveTheme(PREFERENCE as ThemePreference, EDITOR),
                    isHighContrast(PREFERENCE as ThemePreference)
                );

                assert.ok(
                    NAME.indexOf('high_contrast') < 0,
                    `'${ PREFERENCE }' landed on '${ NAME }'`
                );
            }
        }
    });

    test('are written on the root for both modes at once', function () {
        // the editor may switch theme underneath a board that follows it, and
        // the attribute for the other mode has to be right when it does
        const ATTRIBUTES = primerThemeAttributes('light', false);

        assert.strictEqual(ATTRIBUTES['data-color-mode'], 'light');
        assert.strictEqual(ATTRIBUTES['data-light-theme'], 'light');
        assert.strictEqual(ATTRIBUTES['data-dark-theme'], 'dark');

        const CONTRASTED = primerThemeAttributes('dark', true);

        assert.strictEqual(CONTRASTED['data-color-mode'], 'dark');
        assert.strictEqual(CONTRASTED['data-light-theme'], 'light_high_contrast');
        assert.strictEqual(CONTRASTED['data-dark-theme'], 'dark_high_contrast');
    });
});

suite('The colour sets the bundle carries', function () {
    test('are exactly the ones offered, and no more', function () {
        const MODULE = sourceOf(THEME_MODULE);

        assert.ok(MODULE, `${ THEME_MODULE } is missing`);

        const IMPORTED: string[] = [];

        THEME_IMPORT.lastIndex = 0;

        let match = THEME_IMPORT.exec(MODULE!.text);

        while (match) {
            // the stylesheets are filed under a hyphenated name and declare a
            // set under an underscored one
            IMPORTED.push(match[1].replace(/-/g, '_'));

            match = THEME_IMPORT.exec(MODULE!.text);
        }

        assert.deepStrictEqual(
            IMPORTED.slice().sort(), OFFERED_THEMES.slice().sort(),
            'Each set is around 118 KB: one imported without being offered is' +
            ' paid for and unreachable, and one offered without being imported' +
            ' leaves the board unpainted'
        );
    });

    test('are imported by that module alone', function () {
        // the mapping is the single place that knows these names, and a second
        // importer would be a second place to keep in step
        for (const FILE of ['src/webview/theme/theme-provider.tsx',
                            'src/webview/main.tsx',
                            'src/webview/ui/App.tsx']) {
            const SOURCE = sourceOf(FILE);

            if (!SOURCE) {
                continue;
            }

            assert.ok(
                SOURCE.text.indexOf('@primer/primitives/dist/css') < 0,
                `${ FILE } imports a colour set of its own; the mapping in` +
                ` ${ THEME_MODULE } is the only place that may`
            );
        }
    });
});
