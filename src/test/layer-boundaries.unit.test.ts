/**
 * The line the design system may not cross.
 *
 * The whole argument for adopting a design system is that appearance becomes
 * somebody else's maintenance. That argument only holds while the dependency
 * stays on one side of the house: the moment a rule of the board imports a
 * component library, replacing that library stops being a change of look and
 * becomes a change of behaviour, and the board is back to owning what it meant
 * to stop owning.
 *
 * So 'domain/', 'adapters/' and 'bridge/' know nothing about it. The interface
 * is the only tenant of the design system, and this test is the wall.
 */

import * as assert from 'assert';

import {
    numberedLines,
    offenceReport,
    sourcesUnder,
    withoutComments,
} from './sources';

/**
 * The directories that may not reach for the design system.
 */
const SEALED_LAYERS = [
    'src/webview/domain',
    'src/webview/adapters',
    'src/webview/bridge',
];

/**
 * The packages the design system is made of.
 */
const DESIGN_SYSTEM_PACKAGES = [
    '@primer/react',
    '@primer/primitives',
    '@primer/octicons-react',
];

/**
 * What a module reaches for on a line, whether by import or by require.
 */
const MODULE_REFERENCE = /(?:from\s*|require\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;

suite('The line the design system may not cross', function () {
    test('no rule of the board imports it', function () {
        const OFFENCES: string[] = [];

        for (const LAYER of SEALED_LAYERS) {
            for (const FILE of sourcesUnder(LAYER, ['.ts', '.tsx'])) {
                for (const LINE of numberedLines(withoutComments(FILE.text))) {
                    MODULE_REFERENCE.lastIndex = 0;

                    let match = MODULE_REFERENCE.exec(LINE.text);

                    while (match) {
                        const TARGET = match[1];

                        const FORBIDDEN = DESIGN_SYSTEM_PACKAGES.some(
                            p => TARGET === p || TARGET.startsWith(`${ p }/`)
                        );

                        if (FORBIDDEN) {
                            OFFENCES.push(
                                `${ FILE.path }:${ LINE.line }: ${ TARGET }`
                            );
                        }

                        match = MODULE_REFERENCE.exec(LINE.text);
                    }
                }
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport(
                'The design system belongs to the interface alone; a rule that' +
                ' imports it can no longer be replaced without changing' +
                ' behaviour',
                OFFENCES
            )
        );
    });

    test('nor does it reach them through a stylesheet', function () {
        const OFFENCES: string[] = [];

        for (const LAYER of SEALED_LAYERS) {
            for (const FILE of sourcesUnder(LAYER)) {
                if (FILE.path.endsWith('.css')) {
                    OFFENCES.push(FILE.path);
                }
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport(
                'A rule of the board has no appearance to declare and therefore' +
                ' no stylesheet to carry',
                OFFENCES
            )
        );
    });
});
