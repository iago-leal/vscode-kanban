/**
 * Serves the colour sets of the design system trimmed to what the bundle
 * actually asks for.
 *
 * Each set of '@primer/primitives' declares around nine hundred and sixty
 * tokens and weighs about 118 KB, because it is written for every component
 * the design system ships. The board uses a handful of those components, and
 * the four sets it offers were therefore costing 390 KB of the 400 KB the
 * performance requirement allows for stylesheets -- before a single component
 * was migrated.
 *
 * Offering fewer sets would have cost the high contrast pair, which is exactly
 * what RF-09 exists to provide. Raising the ceiling would have been deciding
 * by writing the decision down. So neither: the sets stay, and what leaves is
 * the part of them nothing can reach.
 *
 * The trimming is measured, not guessed. A probe build is run first with the
 * sets emptied out, so that whatever remains referencing a token is the
 * interface itself: the stylesheets of the components that were imported, the
 * board stylesheet, and any token named from code. Those names seed a
 * transitive closure over the set -- a token whose value names another token
 * keeps that one alive -- and every declaration outside the closure is dropped.
 *
 * WHAT THIS DELIBERATELY DOES NOT SEE: a token named only by the stylesheet of
 * the user, in '.vscode/vscode-kanban.css'. That is not a regression of this
 * step but the contract of 'interfaces/style-anchors.md' §7, which promises
 * anchors and never computed values. A user stylesheet that wants a colour of
 * the design system has to declare it.
 */

const ESBUILD = require('esbuild');
const FS = require('fs');
const Path = require('path');

/**
 * Where the design system keeps the colour sets.
 *
 * The set of files trimmed is whatever the interface imports from this
 * directory: this file never names a colour set, which keeps
 * 'src/webview/theme/primer-themes.ts' the only place that knows those names.
 */
const THEME_DIRECTORY = Path.join(
    '@primer', 'primitives', 'dist', 'css', 'functional', 'themes'
);

/**
 * Matches the path of a colour set, whatever the separator of the platform.
 */
const THEME_FILE = new RegExp(
    `${ THEME_DIRECTORY.replace(/[\\/]/g, '[\\\\/]') }[\\\\/][a-z-]+\\.css$`
);

/**
 * A token named from somewhere: 'var(--x)', with or without a fallback.
 */
const REFERENCE = /var\(\s*(--[A-Za-z0-9_-]+)/g;

/**
 * A declaration of a token, one per line in the files of the design system.
 */
const DECLARATION = /^(\s*)(--[A-Za-z0-9_-]+)\s*:/;

/**
 * Every token named by a piece of text.
 *
 * @param {string} text The text to read.
 * @param {Set<string>} into Where to collect the names.
 *
 * @return {Set<string>} The same set, for chaining.
 */
function collectReferences(text, into) {
    REFERENCE.lastIndex = 0;

    let match = REFERENCE.exec(text);

    while (match) {
        into.add(match[1]);

        match = REFERENCE.exec(text);
    }

    return into;
}

/**
 * Reads a colour set into the declarations it makes, keeping every other line
 * as it is.
 *
 * The files are generated, one declaration per line, so a line is enough of a
 * unit to work with: anything that is not a declaration is structure -- a
 * selector, an at-rule, a brace -- and is kept verbatim.
 *
 * @param {string} text The stylesheet.
 *
 * @return {Array<{line: string, token?: string, references: string[]}>} The lines.
 */
function readSet(text) {
    return text.split('\n').map((line) => {
        const MATCH = DECLARATION.exec(line);

        if (!MATCH) {
            return { line: line, references: [] };
        }

        return {
            line: line,
            token: MATCH[2],
            references: Array.from(collectReferences(line, new Set())),
        };
    });
}

/**
 * Grows a set of names until it names nothing new.
 *
 * A token kept alive by the interface may itself be written in terms of
 * another one, and dropping that one would leave the first resolving to
 * nothing. The closure is what makes the trimming safe rather than merely
 * small.
 *
 * @param {Array} lines The lines of the set, as 'readSet' returns them.
 * @param {Set<string>} seed The names the interface asks for.
 *
 * @return {Set<string>} Every name that has to survive.
 */
function closeOver(lines, seed) {
    const BY_TOKEN = new Map();

    for (const LINE of lines) {
        if (LINE.token) {
            BY_TOKEN.set(LINE.token, LINE.references);
        }
    }

    const KEPT = new Set();
    const PENDING = Array.from(seed);

    while (PENDING.length) {
        const NAME = PENDING.pop();

        if (KEPT.has(NAME) || !BY_TOKEN.has(NAME)) {
            continue;
        }

        KEPT.add(NAME);

        for (const REFERENCED of BY_TOKEN.get(NAME)) {
            if (!KEPT.has(REFERENCED)) {
                PENDING.push(REFERENCED);
            }
        }
    }

    return KEPT;
}

/**
 * Drops from a colour set every declaration nothing can reach.
 *
 * @param {string} text The stylesheet.
 * @param {Set<string>} kept The names that survive.
 *
 * @return {string} The trimmed stylesheet.
 */
function trimSet(text, kept) {
    const LINES = readSet(text);

    return LINES
        .filter(line => !line.token || kept.has(line.token))
        .map(line => line.line)
        .join('\n');
}

/**
 * A stylesheet of a component of the design system.
 *
 * They are filed beside the component, under the name of the component and a
 * hash: 'dist/Button/ButtonBase-311501b9.css'.
 *
 * The name of the component is captured, and capturing it correctly is the
 * whole point: it is what 'importerOf' turns back into the module that imports
 * the sheet. The directory part is therefore matched by a group that CANNOT
 * capture and that has to end at a separator. Written as '.*' instead, the
 * match is greedy, eats the name along with the directory, and leaves the
 * capture holding the single last letter before the hash -- 'ButtonBase'
 * becomes 'e'. Every importer then resolves to a file that does not exist,
 * every sheet is taken for one that does not ship, and the interface is served
 * with no component styling at all while the build reports a saving.
 */
const COMPONENT_STYLE =
    /@primer[\\/]react[\\/]dist[\\/](?:.*[\\/])?([A-Za-z_][A-Za-z0-9_]*)-[0-9a-f]{8}\.css$/;

/**
 * The module that imports one of those stylesheets, given the stylesheet.
 *
 * @param {string} path The stylesheet.
 *
 * @return {string|undefined} The module, or nothing if the shape is unfamiliar.
 */
function importerOf(path) {
    const MATCH = COMPONENT_STYLE.exec(path);

    return MATCH
        ? Path.join(Path.dirname(path), `${ MATCH[1] }.module.css.js`)
        : undefined;
}

/**
 * Learns what the interface actually ships, by building it once.
 *
 * Two things are read off that build, and the second is what makes the first
 * honest:
 *
 *   - the tokens the interface names, with the colour sets emptied out, so
 *     that a set cannot keep itself alive by naming its own tokens;
 *   - which modules of the design system SURVIVED, which is not the same as
 *     which ones were reached.
 *
 * The second matters because of a limitation of the bundler that costs 190 KB
 * if left alone. The entry point of the design system names all of its
 * components; unused ones are dropped from the code, correctly -- but their
 * stylesheets are not, because a stylesheet counts as a side effect and side
 * effects survive tree shaking. Asking for a button was bringing in the
 * styling of the tree view, the timeline and the page layout.
 *
 * So the surviving modules are read from the report of the build, and a
 * stylesheet whose module did not survive is served empty. A stylesheet whose
 * importer cannot be identified is kept: guessing wrong in that direction
 * loses bytes, and guessing wrong in the other loses paint.
 *
 * @param {object} options The options of the real build.
 *
 * @return {Promise<{tokens: Set<string>, survivors: Set<string>}>} What ships.
 */
async function probeBundle(options) {
    const EMPTY_SETS = {
        name: 'empty-colour-sets',
        setup(build) {
            build.onLoad({ filter: THEME_FILE }, () => {
                return { contents: '', loader: 'css' };
            });
        },
    };

    const PROBE = {
        ...options,
        metafile: true,
        // the probe is read, never served
        write: false,
        minify: false,
        sourcemap: false,
        logLevel: 'silent',
    };

    const REACHED = await ESBUILD.build({ ...PROBE, plugins: [EMPTY_SETS] });

    const SURVIVORS = new Set();

    for (const OUTPUT of Object.keys(REACHED.metafile.outputs)) {
        if (OUTPUT.endsWith('.css')) {
            continue;
        }

        for (const INPUT of Object.keys(REACHED.metafile.outputs[OUTPUT].inputs)) {
            SURVIVORS.add(Path.resolve(options.absWorkingDir, INPUT));
        }
    }

    // A second pass, now that the stylesheets of the components that do not
    // ship are known. Counting their tokens would keep alive a third of every
    // colour set on behalf of a tree view nobody renders.
    const DROP_UNSHIPPED = {
        name: 'drop-unshipped-styles',
        setup(build) {
            build.onLoad({ filter: COMPONENT_STYLE }, (args) => {
                const IMPORTER = importerOf(args.path);

                return !IMPORTER || SURVIVORS.has(IMPORTER)
                    ? null
                    : { contents: '', loader: 'css' };
            });
        },
    };

    const SHIPPED = await ESBUILD.build({
        ...PROBE,
        plugins: [EMPTY_SETS, DROP_UNSHIPPED],
    });

    const TOKENS = new Set();

    for (const FILE of SHIPPED.outputFiles) {
        collectReferences(FILE.text, TOKENS);
    }

    return { tokens: TOKENS, survivors: SURVIVORS };
}

/**
 * Reports what the trimming saved, so that a build that stops saving is
 * visible instead of silent.
 *
 * @param {Array<{name: string, before: number, after: number}>} sets What was trimmed.
 */
function report(sets) {
    const BEFORE = sets.reduce((sum, set) => sum + set.before, 0);
    const AFTER = sets.reduce((sum, set) => sum + set.after, 0);

    console.log(
        `Colour sets trimmed to what the interface asks for: ` +
        `${ sets.length } sets, ${ BEFORE } B -> ${ AFTER } B ` +
        `(${ Math.round(100 - (AFTER / BEFORE) * 100) }% dropped)`
    );
}

/**
 * The plugin that keeps the stylesheets down to what the interface uses.
 *
 * @param {object} options The options of the real build, used for the probe.
 *
 * @return {object} An esbuild plugin.
 */
function trimColourSets(options) {
    return {
        name: 'trim-colour-sets',
        setup(build) {
            let probe = null;

            const TRIMMED = [];
            const DROPPED = [];
            const KEPT = [];

            build.onStart(async () => {
                probe = await probeBundle(options);
            });

            build.onLoad({ filter: THEME_FILE }, (args) => {
                const TEXT = FS.readFileSync(args.path, 'utf8');
                const KEPT = closeOver(readSet(TEXT), probe.tokens);
                const OUTPUT = trimSet(TEXT, KEPT);

                TRIMMED.push({
                    name: Path.basename(args.path),
                    before: TEXT.length,
                    after: OUTPUT.length,
                });

                return { contents: OUTPUT, loader: 'css' };
            });

            build.onLoad({ filter: COMPONENT_STYLE }, (args) => {
                const IMPORTER = importerOf(args.path);

                if (!IMPORTER || probe.survivors.has(IMPORTER)) {
                    KEPT.push(Path.basename(args.path));

                    return null;
                }

                DROPPED.push({
                    name: Path.basename(args.path),
                    bytes: FS.statSync(args.path).size,
                });

                return { contents: '', loader: 'css' };
            });

            build.onEnd(() => {
                if (TRIMMED.length) {
                    report(TRIMMED.splice(0, TRIMMED.length));
                }

                //
                // A build that drops EVERY component stylesheet has not saved
                // anything: it has served an interface with no component
                // styling at all, and said so as if it were a saving. That is
                // exactly what a greedy pattern in 'COMPONENT_STYLE' produced
                // once, and the failure was invisible because the numbers grew
                // more impressive the more broken it got.
                //
                // The board uses components; if not one of their sheets
                // survives, the trimming is wrong and the build stops here.
                //
                if (DROPPED.length && !KEPT.length) {
                    throw new Error(
                        `Every component stylesheet was dropped (${
                            DROPPED.length } of them), which means none was ` +
                        `recognised as shipping. The interface would be served ` +
                        `unstyled. Check 'importerOf' in 'scripts/theme-tokens.js' ` +
                        `against the layout of '@primer/react/dist'.`
                    );
                }

                if (DROPPED.length) {
                    const BYTES = DROPPED.reduce((sum, sheet) => sum + sheet.bytes, 0);

                    console.log(
                        `Stylesheets of components that do not ship: ${
                            DROPPED.length } dropped, ${ BYTES } B saved; ${
                            KEPT.length } kept`
                    );

                    DROPPED.splice(0, DROPPED.length);
                }

                KEPT.splice(0, KEPT.length);
            });
        },
    };
}

module.exports = {
    COMPONENT_STYLE: COMPONENT_STYLE,
    THEME_FILE: THEME_FILE,
    closeOver: closeOver,
    collectReferences: collectReferences,
    importerOf: importerOf,
    readSet: readSet,
    trimColourSets: trimColourSets,
    trimSet: trimSet,
};
