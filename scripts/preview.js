/**
 * Serves the board in a browser, outside the editor.
 *
 * WHY THIS EXISTS. Three defects shipped past a green suite and were found only
 * by looking at a screenshot: the column that crushed its cards to 28 px
 * (card [36]), the board served with no design system at all (card [43]), and
 * the board that lost the meaning of its colours (cards [41] and [46]). Each
 * time, the way in was the same improvised harness -- the real bundle loaded in
 * a browser with a pretend host -- rebuilt from scratch and thrown away after.
 * This is that harness, kept.
 *
 * WHAT IT CANNOT TELL YOU. It is a browser, not the editor. The panel lifecycle,
 * the real bridge, the theme classes the editor writes on the body and anything
 * touching the file system are all pretended. A card verified this way is
 * verified for 'testing', never for 'done' -- which is how the board has treated
 * this evidence since card [36].
 *
 * The work is in 'scripts/preview/': what the page IS ('document.js'), how it
 * reaches the browser ('server.js'), and how it fails ('failure.js'). What is
 * left here is what was asked for.
 *
 * Usage:
 *     npm run preview                        the board of this workspace
 *     npm run preview -- --board <file>      another board file
 *     npm run preview -- --sandbox           the fixture meant to be abused
 *     npm run preview -- --port 8080
 *     npm run preview -- --theme dark        which theme the editor pretends
 *     npm run preview -- --no-build          serve what is already built
 */

const Path = require('path');

const { ROOT, fail, report } = require('./preview/failure');
const { EDITOR_THEMES, loadDocumentGenerator } = require('./preview/document');
const { loadBoard, serve } = require('./preview/server');

/**
 * The board of this workspace, which is the one worth looking at by default:
 * it is large, it is real, and it is the one whose defects matter.
 */
const WORKSPACE_BOARD = Path.join(ROOT, '.vscode', 'vscode-kanban.json');

/**
 * The fixture of the manual verification script, which exists to be abused.
 * It covers what the workspace board happens not to: a raw string description,
 * a dirty priority, a Mermaid diagram, a task list part done.
 */
const SANDBOX_BOARD = Path.join(
    ROOT, '_reversa_forward', '001-interface-react-tema-e-done',
    'reference', 'sandbox', '.vscode', 'vscode-kanban.json'
);

const DEFAULT_PORT = 8777;

/**
 * Reads the arguments after the ones npm keeps for itself.
 *
 * @param {string[]} argv The arguments.
 *
 * @return {object} What was asked for.
 */
function readArguments(argv) {
    const OPTIONS = {
        board: WORKSPACE_BOARD,
        port: DEFAULT_PORT,
        theme: 'dark',
        build: true,
    };

    for (let i = 0; i < argv.length; i++) {
        const ARGUMENT = argv[i];

        switch (ARGUMENT) {
            case '--sandbox':
                OPTIONS.board = SANDBOX_BOARD;
                break;

            case '--board':
                OPTIONS.board = Path.resolve(argv[++i] || '');
                break;

            case '--port':
                OPTIONS.port = parseInt(argv[++i], 10);
                break;

            case '--theme':
                OPTIONS.theme = String(argv[++i] || '').trim();
                break;

            case '--no-build':
                OPTIONS.build = false;
                break;

            default:
                fail(
                    `unknown argument '${ ARGUMENT }'`,
                    `known ones: --board <file>, --sandbox, --port <n>, --theme <${
                        Object.keys(EDITOR_THEMES).join('|') }>, --no-build`
                );
        }
    }

    if (isNaN(OPTIONS.port) || OPTIONS.port < 1 || OPTIONS.port > 65535) {
        fail(`'--port' needs a number between 1 and 65535`);
    }

    if (!EDITOR_THEMES[OPTIONS.theme]) {
        fail(
            `'--theme ${ OPTIONS.theme }' is not one the editor announces`,
            `known ones: ${ Object.keys(EDITOR_THEMES).join(', ') }`
        );
    }

    return OPTIONS;
}

/**
 * Builds the Webview bundle, unless told not to.
 *
 * The build runs in this process rather than as a child, so that a failure
 * arrives as a failure instead of as an exit code nobody reads.
 *
 * @param {boolean} wanted Whether to build at all.
 */
function buildBundle(wanted) {
    if (!wanted) {
        return;
    }

    console.log('preview: building the Webview bundle ...');

    const { execFileSync } = require('child_process');

    try {
        execFileSync(
            process.execPath,
            [Path.join(ROOT, 'scripts', 'build-webview.js')],
            { cwd: ROOT, stdio: 'inherit' }
        );
    } catch (e) {
        fail(
            'the Webview bundle failed to build',
            `fix the build, or pass '--no-build' to serve what is already there`
        );
    }
}

function main() {
    let options;
    let html;

    try {
        options = readArguments(process.argv.slice(2));

        buildBundle(options.build);

        html = loadDocumentGenerator();

        // read once before listening, so that a missing or unreadable board is
        // reported at the prompt instead of at the first request
        loadBoard(options.board);
    } catch (e) {
        report(e);
        process.exit(1);
    }

    serve(
        {
            file: options.board,
            port: options.port,
            theme: options.theme,
            title: Path.basename(Path.dirname(Path.dirname(options.board))),
        },
        html
    );
}

// running the file is what starts the server; requiring it, as
// 'src/test/preview.unit.test.ts' does, starts nothing
if (require.main === module) {
    main();
}

module.exports = {
    DEFAULT_PORT: DEFAULT_PORT,
    SANDBOX_BOARD: SANDBOX_BOARD,
    WORKSPACE_BOARD: WORKSPACE_BOARD,
    readArguments: readArguments,
};
