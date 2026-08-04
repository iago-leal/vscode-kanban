/**
 * The compatibility layer with the class names of version 1.33.1 (RF-28).
 *
 * The map in 'interfaces/legacy-class-map.md' is the contract, and the module
 * under 'src/webview/theme/' is generated from it. What is checked here is that
 * the two never part company, in either direction:
 *
 *   - every name §3 maps arrives somewhere an element can carry it;
 *   - nothing §4 deliberately excluded sneaks in;
 *   - every destination is an anchor 'style-anchors.md' actually declares.
 *
 * The third is the one that matters most. A map that points at something
 * nobody marked produces no error at all: the user writes the old selector, it
 * matches nothing, and the only symptom is a stylesheet that quietly stopped
 * working.
 *
 * WHY A MODULE AND NOT A STYLESHEET. The plan asked for a generated CSS file.
 * No stylesheet can do this: a rule the user writes against
 * '.vsckb-kanban-card' matches elements carrying that class, and ':is()' or
 * ':where()' reach only inside the rule they appear in. So the old names go
 * back onto the elements, which is the effect the contract asked for.
 */

import * as Path from 'path';
import * as assert from 'assert';

import { LEGACY_FOR_ANCHOR, LEGACY_FOR_PRESENCE, LEGACY_FOR_STATE } from '../webview/theme/legacy-compat';
import { offenceReport, projectRoot, sourceOf, sourcesUnder } from './sources';
import { anchored } from '../webview/ui/anchors';

/**
 * The generator, loaded from where it lives rather than copied.
 */
/* tslint:disable-next-line:no-var-requires */
const GENERATOR = require(
    Path.join(projectRoot(), 'scripts', 'generate-legacy-compat.js')
);

/**
 * The map, as the contract writes it.
 */
const MAP = '_reversa_forward/002-primer-design-system/interfaces/legacy-class-map.md';

/**
 * How many names §3 says it covers.
 */
const MAPPED_NAMES = 39;

/**
 * Every old name the generated module puts back on an element.
 */
function coveredNames(): Set<string> {
    const COVERED = new Set<string>();

    const ABSORB = (names: { classes: string[]; id?: string }) => {
        for (const CLASS of names.classes) {
            COVERED.add(`.${ CLASS }`);
        }

        if (names.id) {
            COVERED.add(`#${ names.id }`);
        }
    };

    for (const KEY of Object.keys(LEGACY_FOR_ANCHOR)) {
        ABSORB(LEGACY_FOR_ANCHOR[KEY]);
    }

    for (const ATTRIBUTE of Object.keys(LEGACY_FOR_STATE)) {
        for (const VALUE of Object.keys(LEGACY_FOR_STATE[ATTRIBUTE])) {
            ABSORB(LEGACY_FOR_STATE[ATTRIBUTE][VALUE]);
        }
    }

    for (const ATTRIBUTE of Object.keys(LEGACY_FOR_PRESENCE)) {
        ABSORB(LEGACY_FOR_PRESENCE[ATTRIBUTE]);
    }

    return COVERED;
}

/**
 * The names §4 says are deliberately NOT covered.
 *
 * Only the ones written whole are read: the section also names families by a
 * pattern, like the fields of a form, which are not selectors to look for.
 */
function excludedNames(): string[] {
    const SOURCE = sourceOf(MAP);

    assert.ok(SOURCE, `${ MAP } is missing`);

    const SECTION = SOURCE!.text.split(/^##\s+4\./m)[1];

    assert.ok(SECTION, 'Section 4 of the map, of what is not covered, is missing');

    const NAMES: string[] = [];

    const CELLS = /`([^`]+)`/g;

    let match = CELLS.exec(SECTION.split(/^##\s/m)[0]);

    while (match) {
        const NAME = match[1].trim();

        // a whole name, not a family written with a wildcard nor a truncated
        // prefix the old code produced by accident
        if (/^[.#][a-z-]+$/.test(NAME) && !NAME.endsWith('-')) {
            NAMES.push(NAME);
        }

        match = CELLS.exec(SECTION.split(/^##\s/m)[0]);
    }

    return NAMES;
}

suite('The compatibility layer of version 1.33.1', function () {
    test('covers every name the map claims to cover', function () {
        const PAIRS = GENERATOR.readMap();

        assert.strictEqual(
            PAIRS.length, MAPPED_NAMES,
            `The map of §3 pairs ${ PAIRS.length } names, and §4 says ${
                MAPPED_NAMES }. One of the two is wrong, and both are read by` +
            ' people deciding whether their stylesheet still works'
        );
    });

    test('puts each of them back on an element', function () {
        const COVERED = coveredNames();
        const OFFENCES: string[] = [];

        for (const PAIR of GENERATOR.readMap()) {
            if (!COVERED.has(PAIR.legacy)) {
                OFFENCES.push(
                    `${ PAIR.legacy } is mapped to ${ PAIR.anchor } and reaches` +
                    ' no element'
                );
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport('names of 1.33.1 mapped but not carried', OFFENCES)
        );
    });

    test('lets in nothing the map deliberately left out', function () {
        const COVERED = coveredNames();
        const EXCLUDED = excludedNames();

        assert.ok(
            EXCLUDED.length > 0,
            'Section 4 of the map yielded no name, so this test proves nothing'
        );

        const OFFENCES = EXCLUDED
            .filter(name => COVERED.has(name))
            .map(name => `${ name } is listed as not covered and is covered`);

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport('names covered against the decision of §4', OFFENCES)
        );
    });

    test('points every name at an anchor that is actually declared', function () {
        const DECLARED: Set<string> = GENERATOR.declaredAnchors();
        const OFFENCES: string[] = [];

        for (const PAIR of GENERATOR.readMap()) {
            if (!DECLARED.has(PAIR.anchor)) {
                OFFENCES.push(
                    `${ PAIR.legacy } points at ${ PAIR.anchor }, which` +
                    ' style-anchors.md does not declare'
                );
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0,
            offenceReport('names pointing at an undeclared anchor', OFFENCES)
        );
    });

    test('has not drifted from the map it was generated from', function () {
        const GROUPED = GENERATOR.groupByAnchor(
            GENERATOR.readMap(), GENERATOR.declaredAnchors()
        );

        const EXPECTED = GENERATOR.render(GROUPED, GENERATOR.readMap().length);
        const CURRENT = sourceOf('src/webview/theme/legacy-compat.ts');

        assert.ok(CURRENT, 'The generated module is missing');

        assert.strictEqual(
            CURRENT!.text, EXPECTED,
            'The generated module and the map disagree. The map is the source' +
            ' of truth: run "node ./scripts/generate-legacy-compat.js"'
        );
    });
});

suite('Marking an element', function () {
    test('gives it the anchor and the old names at once', function () {
        const PROPS = anchored({ anchor: 'card' });

        assert.strictEqual(PROPS['data-vsckb'], 'card');
        assert.ok(
            (PROPS.className || '').split(' ').indexOf('vsckb-kanban-card') > -1,
            `A card was marked without its name of 1.33.1: ${ PROPS.className }`
        );
    });

    test('keeps the class the component asked for', function () {
        const PROPS = anchored({ anchor: 'card', className: 'own-class' });

        const CLASSES = (PROPS.className || '').split(' ');

        assert.ok(CLASSES.indexOf('own-class') > -1, PROPS.className);
        assert.ok(CLASSES.indexOf('vsckb-kanban-card') > -1, PROPS.className);
    });

    test('gives back an identifier where the old name was one', function () {
        const PROPS = anchored({ anchor: 'column', column: 'done' });

        assert.strictEqual(PROPS['data-vsckb-column'], 'done');
        assert.strictEqual(PROPS.id, 'vsckb-card-done');
    });

    test('writes a state that is either there or not as an empty value', function () {
        const COLLAPSED = anchored({ anchor: 'column', collapsed: true });
        const OPEN = anchored({ anchor: 'column', collapsed: false });

        assert.strictEqual(COLLAPSED['data-vsckb-collapsed'], '');
        assert.strictEqual(OPEN['data-vsckb-collapsed'], undefined);
    });
});

/**
 * The anchors the contract declares and no element carries yet.
 *
 * Each one names a control that version 1.33.1 had and the interface of today
 * does not, so there is nothing to mark. They are listed rather than quietly
 * absent, because the gap between what the contract promises and what the
 * interface carries should be a number a test watches, not something a reader
 * has to notice.
 *
 * Instrumenting one of them means deleting its line here. A line APPEARING
 * here means a promise stopped being kept.
 */
const UNCARRIED_ANCHORS = [
    // the board saves as it is edited since feature 001: there is no button
    'action-save',
    // and no button to clear the finished column either
    'action-clear',
    // a card stores links to other cards and nothing renders them, because
    // what the link MEANS was never decided (card [13] of the board)
    'card-reference',
    'card-references',
];

/**
 * Every anchor some component actually writes on an element.
 */
function carriedAnchors(): Set<string> {
    const CARRIED = new Set<string>();

    for (const FILE of sourcesUnder('src/webview/ui', ['.ts', '.tsx'])) {
        const NAMED = /anchor(?::\s*|=")'?([a-z-]+)'?/g;

        let match = NAMED.exec(FILE.text);

        while (match) {
            CARRIED.add(match[1]);

            match = NAMED.exec(FILE.text);
        }
    }

    return CARRIED;
}

suite('The anchors the contract promises', function () {
    test('are carried by an element, except the ones known not to be', function () {
        const CARRIED = carriedAnchors();

        const DECLARED = Object.keys(LEGACY_FOR_ANCHOR).concat([
            'board', 'board-header', 'columns', 'column', 'column-header',
            'column-body', 'card', 'card-title', 'card-body', 'card-footer',
            'card-actions', 'list', 'dialog',
        ]);

        const MISSING = DECLARED
            .filter(name => !CARRIED.has(name))
            .filter(name => UNCARRIED_ANCHORS.indexOf(name) < 0);

        assert.strictEqual(
            MISSING.length, 0,
            offenceReport(
                'anchors promised by style-anchors.md that no element carries',
                MISSING.map(n => `[data-vsckb="${ n }"]` +
                    ' reaches nothing, so a stylesheet using it silently does nothing')
            )
        );
    });

    test('has the known gap and no larger one', function () {
        const CARRIED = carriedAnchors();

        const CLOSED = UNCARRIED_ANCHORS.filter(name => CARRIED.has(name));

        assert.strictEqual(
            CLOSED.length, 0,
            offenceReport(
                'anchors listed as uncarried that an element now carries --' +
                ' delete their line, the list is meant to shrink',
                CLOSED
            )
        );

        assert.strictEqual(
            UNCARRIED_ANCHORS.length, 4,
            'The gap between the contract and the interface changed size.' +
            ' Growing it needs a decision; shrinking it needs this number'
        );
    });
});
