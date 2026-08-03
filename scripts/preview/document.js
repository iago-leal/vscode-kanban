/**
 * What the page of the preview IS.
 *
 * The document is not written here either: it is built by 'out/html.js', the
 * same function 'boards.ts' calls to serve the panel. What this module supplies
 * is the three things the editor supplies and a browser does not -- an address
 * for each resource, a host for the interface to talk to, and the board itself.
 *
 * Keeping that to one module is what lets the claim be checked: the page under
 * inspection carries the same stylesheets, the same vendored scripts, the same
 * cascade and the same content security policy the editor serves, and the only
 * differences are the three below. A preview that assembled its own page would
 * drift from the real one and would validate the wrong thing.
 */

const FS = require('fs');
const Path = require('path');

const { ROOT, fail } = require('./failure');

/**
 * Where the built resources live, and what the extension serves from there.
 */
const RESOURCE_DIR = Path.join(ROOT, 'out', 'res');

/**
 * The bundle, named exactly as 'boards.ts' names it.
 */
const BUNDLE_FILE = 'webview/main.js';

/**
 * The stylesheet of the user, served last, exactly as the extension serves it.
 */
const USER_STYLESHEET = 'vscode-kanban.css';

/**
 * The themes the editor may be pretended to be showing, as the class it writes
 * on the body. 'theme-provider.tsx' reads that class and nothing else, which is
 * why pretending one is a matter of a class name and nothing more.
 */
const EDITOR_THEMES = {
    'light': 'vscode-light',
    'dark': 'vscode-dark',
    'high-contrast': 'vscode-high-contrast',
    'high-contrast-light': 'vscode-high-contrast-light',
};

/**
 * Loads the generator of documents the extension itself uses.
 *
 * It lives in 'out/', which means 'npm run compile' has to have run. That is a
 * dependency worth having: the alternative is a second generator here, which
 * would drift from the real one and quietly validate a page the editor never
 * serves.
 *
 * @return {object} The module.
 */
function loadDocumentGenerator() {
    const COMPILED = Path.join(ROOT, 'out', 'html.js');

    if (!FS.existsSync(COMPILED)) {
        fail(
            `'out/html.js' is missing, and the document of the board is built by it`,
            `run 'npm run compile' first -- the preview serves the same document` +
            ` the editor does, and refuses to invent one of its own`
        );
    }

    //
    // Everything on the side of the extension reaches for the module the editor
    // injects, and 'html.js' reaches it transitively through 'vscode-helpers'.
    // There is no editor here, so one is stood in for: an object that answers
    // to any name with an empty one. It is the same stand-in
    // 'src/test/document-shape.unit.test.ts' uses, and for the same reason.
    //
    // The substitution lasts exactly one 'require' and is undone even if that
    // require throws. Leaving it in place would mean every later failure to
    // find the editor came back as an empty object instead of as an error,
    // which is the kind of help that costs an afternoon.
    //
    const MODULE = require('module');

    const EDITOR = new Proxy({}, {
        get: () => new Proxy(function () { /* answers to anything */ }, {
            get: () => undefined,
        }),
    });

    const ORIGINAL_LOAD = MODULE._load;

    MODULE._load = function (request, ...rest) {
        return 'vscode' === request ? EDITOR
                                    : ORIGINAL_LOAD.call(this, request, ...rest);
    };

    try {
        /* tslint:disable-next-line:no-var-requires */
        return require(COMPILED);
    } finally {
        MODULE._load = ORIGINAL_LOAD;
    }
}

/**
 * Makes a value safe to embed inside a script tag.
 *
 * A board is user content, and a card whose description contains the closing
 * tag of a script would end the tag early and turn the rest of the board into
 * markup. The sequence that opens a comment gets the same treatment, for the
 * same reason.
 *
 * @param {any} value The value.
 *
 * @return {string} The literal to embed.
 */
function toScriptLiteral(value) {
    return JSON.stringify(value)
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        // legal inside a JSON string and NOT inside a JavaScript one: left as
        // they are, the line ends early and the rest of the board becomes a
        // syntax error. Both sides are written as escapes on purpose -- the
        // characters are invisible in an editor, and one of them pasted as a
        // plain space would silently rewrite every space of the board
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

/**
 * The host the interface talks to, pretended.
 *
 * This is the whole of the fiction, and it is deliberately small: everything
 * the board sends is recorded and nothing is acted upon, so that a preview can
 * never write to the file it is showing. 'window.__preview.posted' is where the
 * messages pile up, which is how a session can check what the board TRIED to do
 * without letting it happen.
 *
 * @param {string} nonce The nonce of the document.
 *
 * @return {string} The markup.
 */
function pretendHost(nonce) {
    return `    <script nonce="${ nonce }">
        window.__preview = { posted: [], state: undefined };

        window.acquireVsCodeApi = function () {
            return {
                postMessage: function (message) {
                    window.__preview.posted.push(message);

                    if (message && 'log' === message.command) {
                        console.log('[vsckb]', message.data && message.data.message);
                    }
                },
                getState: function () { return window.__preview.state; },
                setState: function (state) { window.__preview.state = state; },
            };
        };
    </script>`;
}

/**
 * The messages the extension sends once the interface is up.
 *
 * The board travels EMBEDDED, and not fetched: the policy the document declares
 * says 'connect-src: none', so a preview that fetched its board would either be
 * blocked or would prove that the policy had been loosened for its benefit.
 * Embedding keeps the page under the same policy the editor serves.
 *
 * @param {string} nonce The nonce of the document.
 * @param {object} board The board.
 * @param {string} title What the board is called.
 * @param {string} file Where it came from.
 *
 * @return {string} The markup.
 */
function deliverBoard(nonce, board, title, file) {
    return `    <script nonce="${ nonce }">
        (function () {
            var BOARD = ${ toScriptLiteral(board) };

            function send(command, data) {
                window.postMessage({ command: command, data: data }, '*');
            }

            send('setViewPreferences', {
                theme: 'follow-editor',
                hideDone: false,
                collapsedColumns: [],
                viewMode: 'columns'
            });

            send('setTitleAndFilePath', {
                title: ${ toScriptLiteral(title) },
                filePath: ${ toScriptLiteral(file) }
            });

            send('setBoard', { cards: BOARD, settings: {} });
        })();
    </script>`;
}

/**
 * Resolves a resource to the address this server answers on.
 *
 * It answers 'undefined' for a file that is not there, which is the same answer
 * the extension gives, and which the footer of the document relies on to leave
 * the stylesheet of the user out when the workspace has none.
 *
 * @param {string} origin The origin of this server.
 *

/**
 * Resolves a resource to the address this server answers on.
 *
 * It answers 'undefined' for a file that is not there, which is the same answer
 * the extension gives, and which the footer of the document relies on to leave
 * the stylesheet of the user out when the workspace has none.
 *
 * @param {string} origin The origin of this server.
 *
 * @return {Function} The resolver.
 */
function resourceResolver(origin) {
    return (path) => {
        const RESOURCE = Path.join(RESOURCE_DIR, String(path));

        // the stylesheet of the user is not a resource of the extension: the
        // extension looks for it in the workspace, and so does this
        if (USER_STYLESHEET === path) {
            return FS.existsSync(Path.join(ROOT, '.vscode', USER_STYLESHEET))
                ? `${ origin }/user/${ USER_STYLESHEET }`
                : undefined;
        }

        return FS.existsSync(RESOURCE)
            ? `${ origin }/res/${ String(path).split(Path.sep).join('/') }`
            : undefined;
    };
}

/**
 * Builds the document of the board, by the same generator the extension uses.
 *
 * @param {object} html The generator, from 'out/html.js'.
 * @param {object} options What to show.
 *

/**
 * Builds the document of the board, by the same generator the extension uses.
 *
 * @param {object} html The generator, from 'out/html.js'.
 * @param {object} options What to show.
 *
 * @return {string} The document.
 */
function buildDocument(html, options) {
    const GET_RESOURCE_URI = resourceResolver(options.origin);

    return html.generateHtmlDocument({
        // The policy IS declared, and names this server as the origin. That is
        // the point: the preview runs under the same rules the panel does, so
        // a resource the policy would refuse in the editor is refused here too
        // instead of loading and passing inspection.
        cspSource: options.origin,
        getResourceUri: GET_RESOURCE_URI,
        name: 'board',
        title: options.title,
        bundleFile: BUNDLE_FILE,

        // before the bundle: the interface calls 'acquireVsCodeApi' as it mounts
        getContent: (nonce) => pretendHost(nonce),

        // after it: the stylesheet of the user stays last, as the cascade of
        // 'interfaces/style-anchors.md' §8 promises, and the board arrives the
        // way the extension sends it
        getFooter: (nonce) => {
            const USER_STYLE = GET_RESOURCE_URI(USER_STYLESHEET);

            return [
                USER_STYLE ? `<link rel="stylesheet" href="${ USER_STYLE }">` : '',
                deliverBoard(nonce, options.board, options.title, options.file),
            ].filter(part => '' !== part).join('\n');
        },
    });
}

module.exports = {
    BUNDLE_FILE: BUNDLE_FILE,
    EDITOR_THEMES: EDITOR_THEMES,
    RESOURCE_DIR: RESOURCE_DIR,
    USER_STYLESHEET: USER_STYLESHEET,
    buildDocument: buildDocument,
    deliverBoard: deliverBoard,
    loadDocumentGenerator: loadDocumentGenerator,
    pretendHost: pretendHost,
    resourceResolver: resourceResolver,
    toScriptLiteral: toScriptLiteral,
};
