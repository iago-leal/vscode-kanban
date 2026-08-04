/**
 * Generates the compatibility layer with the class names of version 1.33.1.
 *
 * Whoever wrote '.vscode/vscode-kanban.css' wrote it against the sixty-eight
 * names the old interface exposed. Feature 001 renamed all of them, and this
 * feature would rename them again. The map in 'legacy-class-map.md' is the
 * answer, and this script is what turns that map into something the interface
 * can honour.
 *
 * WHY A MODULE AND NOT A STYLESHEET. The contract asks that "an old selector
 * written in the stylesheet of the user produce the same visual effect it
 * produced in 1.33.1", and proposed a generated stylesheet as the vehicle. No
 * stylesheet can do it: CSS has no selector aliasing. A rule the user writes
 * against '.vsckb-kanban-card' matches elements carrying that class and
 * nothing else, and ':is()' or ':where()' group selectors inside the rule they
 * appear in -- they cannot reach into a rule someone else wrote.
 *
 * So the old names are put back on the elements. The map stays the single
 * source of truth, exactly as §5 of the contract requires; what changes is the
 * shape of what is generated from it, which the contract left to this stage:
 * "a técnica concreta fica a cargo do /reversa-coding".
 *
 * Usage:
 *     node ./scripts/generate-legacy-compat.js
 *     node ./scripts/generate-legacy-compat.js --check
 *
 * The second form regenerates in memory and fails if the committed module has
 * drifted from the map, which is what keeps the two from parting silently.
 */

const FS = require('fs');
const Path = require('path');

const ROOT = Path.resolve(__dirname, '..');

const FEATURE = Path.join(
    ROOT, '_reversa_forward', '002-primer-design-system', 'interfaces'
);

const CLASS_MAP = Path.join(FEATURE, 'legacy-class-map.md');
const STYLE_ANCHORS = Path.join(FEATURE, 'style-anchors.md');

const OUTPUT = Path.join(ROOT, 'src', 'webview', 'theme', 'legacy-compat.ts');

/**
 * A cell of a table, as the map writes them: a name in backticks.
 */
const CELL_NAMES = /`([^`]+)`/g;

/**
 * The three shapes an anchor takes in the map.
 */
const PLAIN_ANCHOR = /^\[data-vsckb="([a-z-]+)"\]$/;
const QUALIFIED_ANCHOR = /^\[data-vsckb-([a-z-]+)="([a-z-]+)"\]$/;
const BARE_ANCHOR = /^\[data-vsckb-([a-z-]+)\]$/;

/**
 * Reads every name written in backticks in a cell.
 *
 * @param {string} cell The cell.
 *
 * @return {string[]} The names.
 */
function namesIn(cell) {
    const NAMES = [];

    CELL_NAMES.lastIndex = 0;

    let match = CELL_NAMES.exec(cell);

    while (match) {
        NAMES.push(match[1].trim());

        match = CELL_NAMES.exec(cell);
    }

    return NAMES;
}

/**
 * Every anchor 'style-anchors.md' declares, in any of its three levels.
 *
 * This is what makes "map to something nobody marked" impossible: a target
 * absent from here stops the generation instead of producing a rule that
 * reaches no element.
 *
 * @return {Set<string>} The declared anchors, written as the map writes them.
 */
function declaredAnchors() {
    // the fenced examples of §2 are illustration, and their triple backticks
    // would pair with the ones of the tables and swallow whole rows. The
    // tables are what declares an anchor
    const TEXT = FS.readFileSync(STYLE_ANCHORS, 'utf8')
        .replace(/```[\s\S]*?```/g, '');

    const DECLARED = new Set();

    for (const NAME of namesIn(TEXT)) {
        if (PLAIN_ANCHOR.test(NAME) || BARE_ANCHOR.test(NAME)) {
            DECLARED.add(NAME);

            continue;
        }

        const QUALIFIED = QUALIFIED_ANCHOR.exec(NAME);

        if (QUALIFIED) {
            DECLARED.add(NAME);
            // declaring the values of an attribute declares the attribute: a
            // map that reaches for any card type is reaching for something
            // this document promised
            DECLARED.add(`[data-vsckb-${ QUALIFIED[1] }]`);

            continue;
        }

        // the state anchors are written as one cell listing the values, for
        // instance [data-vsckb-column="todo" | "in-progress" | ...]
        const ALTERNATIVES = /^\[data-vsckb-([a-z-]+)=(.+)\]$/.exec(NAME);

        if (ALTERNATIVES) {
            // the alternatives are separated by a pipe, which a table cell has
            // to escape, so the backslashes go before anything else is read
            for (const VALUE of ALTERNATIVES[2].replace(/\\/g, '').split('|')) {
                const CLEAN = VALUE.trim().replace(/^"|"$/g, '');

                if (CLEAN) {
                    DECLARED.add(`[data-vsckb-${ ALTERNATIVES[1] }="${ CLEAN }"]`);
                    DECLARED.add(`[data-vsckb-${ ALTERNATIVES[1] }]`);
                }
            }
        }
    }

    return DECLARED;
}

/**
 * Reads the map into pairs of old name and anchor.
 *
 * Only the tables of §3 are read: §4 is the list of what is deliberately NOT
 * mapped, and reading it would undo the decision it records.
 *
 * @return {Array<{legacy: string, anchor: string}>} The pairs.
 */
function readMap() {
    const LINES = FS.readFileSync(CLASS_MAP, 'utf8').split('\n');

    const PAIRS = [];

    let inMappedSection = false;

    for (const LINE of LINES) {
        if (/^##\s/.test(LINE) || /^###\s/.test(LINE)) {
            inMappedSection = /^##\s+3\.|^###\s+3\./.test(LINE);

            continue;
        }

        if (!inMappedSection || !LINE.startsWith('|')) {
            continue;
        }

        const CELLS = LINE.split('|').slice(1, -1);

        if (CELLS.length < 2) {
            continue;
        }

        const LEGACY = namesIn(CELLS[0]);
        const ANCHORS = namesIn(CELLS[1]);

        if (!LEGACY.length || !ANCHORS.length) {
            // the header row and its rule of dashes
            continue;
        }

        LEGACY.forEach((name, index) => {
            PAIRS.push({
                legacy: name,
                anchor: ANCHORS.length === LEGACY.length ? ANCHORS[index]
                                                         : ANCHORS[0],
            });
        });
    }

    return PAIRS;
}

/**
 * Sorts the pairs into what the interface has to put on an element.
 *
 * @param {Array<{legacy: string, anchor: string}>} pairs The map.
 * @param {Set<string>} declared The anchors 'style-anchors.md' declares.
 *
 * @return {object} The map, grouped by the kind of anchor.
 */
function groupByAnchor(pairs, declared) {
    const BY_ANCHOR = {};
    const BY_ATTRIBUTE = {};
    const BARE = {};

    for (const PAIR of pairs) {
        if (!declared.has(PAIR.anchor)) {
            throw new Error(
                `'${ PAIR.legacy }' maps to ${ PAIR.anchor }, which` +
                ' style-anchors.md does not declare. Either declare the anchor' +
                ' there or drop the row: a target nobody marks reaches no element'
            );
        }

        // an old identifier is honoured by putting the identifier back; an old
        // class, by putting the class back. A rule written against
        // '#vsckb-card-done' matches nothing else, whatever classes it carries
        const KIND = PAIR.legacy.startsWith('#') ? 'id' : 'classes';
        const NAME = PAIR.legacy.slice(1);

        const PLAIN = PLAIN_ANCHOR.exec(PAIR.anchor);

        if (PLAIN) {
            add(BY_ANCHOR, PLAIN[1], KIND, NAME);

            continue;
        }

        const QUALIFIED = QUALIFIED_ANCHOR.exec(PAIR.anchor);

        if (QUALIFIED) {
            BY_ATTRIBUTE[QUALIFIED[1]] = BY_ATTRIBUTE[QUALIFIED[1]] || {};

            add(BY_ATTRIBUTE[QUALIFIED[1]], QUALIFIED[2], KIND, NAME);

            continue;
        }

        const BARE_MATCH = BARE_ANCHOR.exec(PAIR.anchor);

        if (BARE_MATCH) {
            add(BARE, BARE_MATCH[1], KIND, NAME);
        }
    }

    return { anchors: BY_ANCHOR, attributes: BY_ATTRIBUTE, bare: BARE };
}

/**
 * Files one name under one key.
 */
function add(into, key, kind, name) {
    into[key] = into[key] || { classes: [], id: undefined };

    if ('id' === kind) {
        if (into[key].id && into[key].id !== name) {
            throw new Error(
                `Two identifiers of 1.33.1 map to the same anchor '${ key }':` +
                ` '${ into[key].id }' and '${ name }'. An element carries one`
            );
        }

        into[key].id = name;

        return;
    }

    if (into[key].classes.indexOf(name) < 0) {
        into[key].classes.push(name);
    }
}

/**
 * Writes the grouped map as a TypeScript module.
 *
 * @param {object} grouped What 'groupByAnchor' returned.
 * @param {number} count How many names were mapped.
 *
 * @return {string} The module.
 */
function render(grouped, count) {
    const LINES = [
        '/**',
        ' * GENERATED FROM',
        ' * \'_reversa_forward/002-primer-design-system/interfaces/legacy-class-map.md\'.',
        ' * DO NOT EDIT BY HAND: run \'node ./scripts/generate-legacy-compat.js\'.',
        ' *',
        ' * The names version 1.33.1 exposed, filed under the style anchor that',
        ' * reaches the same element today. Putting them back on the element is what',
        ' * makes a stylesheet written against the old interface keep working, which',
        ' * no stylesheet of ours could have done: CSS has no selector aliasing.',
        ' *',
        ` * ${ count } names of 1.33.1 are covered. What is deliberately left out is`,
        ' * listed in §4 of the map, and the reason is given there for each.',
        ' *',
        ' * The life of this module is the life of the compatibility layer described',
        ' * in §5 of the map. It goes when that goes, in the same major version.',
        ' */',
        '',
        '/**',
        ' * What an element has to carry to answer by its old name.',
        ' */',
        'export interface LegacyNames {',
        '    classes: string[];',
        '    id?: string;',
        '}',
        '',
        '/**',
        ' * Filed under the value of \'data-vsckb\'.',
        ' */',
        `export const LEGACY_FOR_ANCHOR: { [anchor: string]: LegacyNames } = ${
            literal(grouped.anchors, 0) };`,
        '',
        '/**',
        ' * Filed under a qualifying attribute and its value, as in',
        ' * \'data-vsckb-column="done"\'.',
        ' */',
        'export const LEGACY_FOR_STATE: {',
        '    [attribute: string]: { [value: string]: LegacyNames };',
        `} = ${ literal(grouped.attributes, 0) };`,
        '',
        '/**',
        ' * Filed under a qualifying attribute alone, whatever its value.',
        ' */',
        `export const LEGACY_FOR_PRESENCE: { [attribute: string]: LegacyNames } = ${
            literal(grouped.bare, 0) };`,
        '',
    ];

    return LINES.join('\n');
}

/**
 * Renders a value as TypeScript, quoted and indented like the rest of the
 * project. A key with nothing under it is left out rather than written as
 * 'undefined', which would be noise in a file people read.
 */
function literal(value, depth) {
    const PAD = '    '.repeat(depth + 1);
    const CLOSING = '    '.repeat(depth);

    if (Array.isArray(value)) {
        if (!value.length) {
            return '[]';
        }

        return `[\n${ value.map(v => `${ PAD }${ quote(v) },`).join('\n')
            }\n${ CLOSING }]`;
    }

    if (value && 'object' === typeof value) {
        const KEYS = Object.keys(value)
            .filter(key => undefined !== value[key])
            .sort();

        if (!KEYS.length) {
            return '{}';
        }

        return `{\n${ KEYS.map((key) => {
            return `${ PAD }${ quote(key) }: ${ literal(value[key], depth + 1) },`;
        }).join('\n') }\n${ CLOSING }}`;
    }

    return quote(value);
}

/**
 * A string as the project writes them.
 */
function quote(text) {
    return `'${ String(text).replace(/\\/g, '\\\\').replace(/'/g, '\\\'') }'`;
}

function main() {
    const PAIRS = readMap();
    const GROUPED = groupByAnchor(PAIRS, declaredAnchors());
    const MODULE = render(GROUPED, PAIRS.length);

    if (process.argv.includes('--check')) {
        const CURRENT = FS.existsSync(OUTPUT) ? FS.readFileSync(OUTPUT, 'utf8') : '';

        if (CURRENT !== MODULE) {
            console.error(
                `${ Path.relative(ROOT, OUTPUT) } has drifted from the map in` +
                ' legacy-class-map.md. Run: node ./scripts/generate-legacy-compat.js'
            );

            process.exit(1);
        }

        console.log(`${ PAIRS.length } names of 1.33.1 covered, module in step with the map.`);

        return;
    }

    FS.writeFileSync(OUTPUT, MODULE, 'utf8');

    console.log(
        `${ Path.relative(ROOT, OUTPUT) } written: ${ PAIRS.length } names of 1.33.1 covered.`
    );
}

module.exports = {
    declaredAnchors: declaredAnchors,
    groupByAnchor: groupByAnchor,
    readMap: readMap,
    render: render,
};

if (require.main === module) {
    main();
}
