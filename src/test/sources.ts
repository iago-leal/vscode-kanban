/**
 * Reading the sources of the project as text.
 *
 * Several rules of this feature are about the SHAPE of the source rather than
 * about what it computes: no file above four hundred lines, no visual literal
 * outside the design system, no design system inside the domain. None of them
 * can be checked by calling a function, so they are checked by reading the
 * files, and this is the one place that knows how to find them.
 *
 * The tests run from 'out/test/', while the sources they read stay in 'src/'.
 */

import * as FS from 'fs';
import * as Path from 'path';

/**
 * The root of the project, wherever the compiled tests happen to run from.
 */
export function projectRoot(): string {
    const CANDIDATES = [
        // out/test/ -> the root
        Path.resolve(__dirname, '..', '..'),
        // src/test/, should the tests ever run without compiling
        Path.resolve(__dirname, '..', '..', '..'),
    ];

    for (const DIR of CANDIDATES) {
        if (FS.existsSync(Path.join(DIR, 'package.json')) &&
            FS.existsSync(Path.join(DIR, 'src', 'webview'))) {
            return DIR;
        }
    }

    throw new Error(
        `Project root not found! Looked into: ${ CANDIDATES.join(', ') }`
    );
}

/**
 * A source file, with the path it is reported under.
 */
export interface SourceFile {
    /**
     * The path relative to the root, with forward slashes, which is how the
     * documents of the feature name a file.
     */
    path: string;
    text: string;
}

/**
 * Reads every file under a directory of the project, recursively.
 *
 * A directory that does not exist yields nothing rather than throwing: a rule
 * about files that are not there yet is satisfied, not broken.
 *
 * @param {string} relativeDir The directory, relative to the root.
 * @param {string[]} [extensions] The extensions to keep, '.ts' style. All of
 *                                them when left out.
 *
 * @return {SourceFile[]} The files, in path order.
 */
export function sourcesUnder(
    relativeDir: string,
    extensions?: string[],
): SourceFile[] {
    const ROOT = projectRoot();
    const FULL_DIR = Path.resolve(ROOT, relativeDir);

    if (!FS.existsSync(FULL_DIR)) {
        return [];
    }

    const FOUND: SourceFile[] = [];

    const WALK = (dir: string) => {
        for (const ENTRY of FS.readdirSync(dir, { withFileTypes: true })) {
            const FULL_PATH = Path.join(dir, ENTRY.name);

            if (ENTRY.isDirectory()) {
                WALK(FULL_PATH);
                continue;
            }

            if (extensions && extensions.indexOf(Path.extname(ENTRY.name)) < 0) {
                continue;
            }

            FOUND.push({
                path: Path.relative(ROOT, FULL_PATH).split(Path.sep).join('/'),
                text: FS.readFileSync(FULL_PATH, 'utf8'),
            });
        }
    };

    WALK(FULL_DIR);

    return FOUND.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Reads a single file of the project.
 *
 * @param {string} relativePath The path, relative to the root.
 *
 * @return {SourceFile|undefined} The file, nothing when it is not there.
 */
export function sourceOf(relativePath: string): SourceFile | undefined {
    const FULL_PATH = Path.resolve(projectRoot(), relativePath);

    if (!FS.existsSync(FULL_PATH)) {
        return undefined;
    }

    return {
        path: relativePath,
        text: FS.readFileSync(FULL_PATH, 'utf8'),
    };
}

/**
 * The number of lines of a text.
 *
 * A trailing newline ends the last line rather than starting an empty one, so
 * it is not counted.
 *
 * @param {string} text The text.
 *
 * @return {number} The number of lines.
 */
export function lineCountOf(text: string): number {
    const LINES = text.split(/\r?\n/);

    if (LINES.length > 0 && '' === LINES[LINES.length - 1]) {
        LINES.pop();
    }

    return LINES.length;
}

/**
 * Strips the comments of a stylesheet or of a source file, so that a rule
 * about declarations is not broken by a sentence that mentions one.
 *
 * The line breaks inside a comment are kept, and only the text is blanked, so
 * that a failure message can still say which line of the ORIGINAL file is at
 * fault. A report that points at the wrong line is worse than none.
 *
 * @param {string} text The text.
 *
 * @return {string} The text, with the comments blanked out.
 */
export function withoutComments(text: string): string {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
        .replace(/^(\s*)\/\/.*$/gm, '$1');
}

/**
 * Numbers the lines of a text, for a failure message that says where.
 *
 * @param {string} text The text.
 *
 * @return {Array} The lines, from one.
 */
export function numberedLines(text: string): Array<{ line: number; text: string }> {
    return text.split(/\r?\n/).map((t, i) => ({ line: i + 1, text: t }));
}

/**
 * The most offences a failure message lists before summarising the rest.
 */
const OFFENCES_SHOWN = 12;

/**
 * Turns a list of offences into a message worth reading.
 *
 * A rule of shape can be broken a hundred times by a single file, and a
 * hundred lines of diff say less than twelve lines and a count: whoever reads
 * the failure needs to know WHAT is wrong and WHERE to start, not to scroll.
 *
 * @param {string} what What the rule expects.
 * @param {string[]} offences The offences found.
 *
 * @return {string} The message.
 */
export function offenceReport(what: string, offences: string[]): string {
    const SHOWN = offences.slice(0, OFFENCES_SHOWN);
    const REST = offences.length - SHOWN.length;

    return [
        `${ what } (${ offences.length } found)`,
        ...SHOWN.map(o => `  ${ o }`),
        REST > 0 ? `  ... and ${ REST } more` : '',
    ].filter(l => '' !== l).join('\n');
}
