/**
 * How the page reaches the browser.
 *
 * A static file server over 'out/res/', plus the document rebuilt on every
 * request. Rebuilding per request is deliberate: editing a stylesheet and
 * reloading the tab is then the whole cycle, and a board edited while the
 * server runs shows up on the next reload instead of on the next restart.
 */

const FS = require('fs');
const HTTP = require('http');
const Path = require('path');

const { ROOT, fail, nameOf } = require('./failure');
const {
    EDITOR_THEMES,
    RESOURCE_DIR,
    USER_STYLESHEET,
    buildDocument,
} = require('./document');

/**
 * Reads the board that is to be shown.
 *
 * @param {string} file The file.
 *
 * @return {object} The board.
 */
function loadBoard(file) {
    if (!FS.existsSync(file)) {
        fail(
            `no board at '${ nameOf(file) }'`,
            `pass '--board <file>', or '--sandbox' for the fixture`
        );
    }

    try {
        return JSON.parse(FS.readFileSync(file, 'utf8'));
    } catch (e) {
        fail(
            `'${ nameOf(file) }' is not readable as JSON: ${ e.message }`,
            'the preview shows a board, it does not repair one'
        );
    }
}

/**
 * What to answer with, by extension.
 */
const CONTENT_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

/**
 * Serves one file, refusing anything outside the directory it belongs to.
 *
 * The guard is not ceremony: the address arrives from a browser, and a request
 * for '../../..' would otherwise read whatever the process can read. Card [8]
 * of the board is the same mistake made by the extension itself.
 *
 * @param {object} response Where to write.
 * @param {string} directory The directory the file has to be inside.
 * @param {string} path The path asked for, relative to it.

/**
 * Serves one file, refusing anything outside the directory it belongs to.
 *
 * The guard is not ceremony: the address arrives from a browser, and a request
 * for '../../..' would otherwise read whatever the process can read. Card [8]
 * of the board is the same mistake made by the extension itself.
 *
 * @param {object} response Where to write.
 * @param {string} directory The directory the file has to be inside.
 * @param {string} path The path asked for, relative to it.
 */
function serveFile(response, directory, path) {
    const FILE = Path.resolve(Path.join(directory, decodeURIComponent(path)));

    if (FILE !== directory && !FILE.startsWith(directory + Path.sep)) {
        response.writeHead(403).end('outside the served directory');

        return;
    }

    FS.readFile(FILE, (error, content) => {
        if (error) {
            response.writeHead(404).end('not found');

            return;
        }

        response.writeHead(200, {
            'Content-Type': CONTENT_TYPES[Path.extname(FILE).toLowerCase()]
                            || 'application/octet-stream',
            // the document is rebuilt on every request, and so is everything
            // it points at: a preview that served a stale bundle would be
            // reporting on a build that no longer exists
            'Cache-Control': 'no-store',
        });

        response.end(content);
    });
}

/**
 * Serves the board until the process is stopped.
 *
 * @param {object} options What to show.

/**
 * Serves the board until the process is stopped.
 *
 * @param {object} options What to show.
 */
function serve(options, html) {
    const SERVER = HTTP.createServer((request, response) => {
        const PATH = (request.url || '/').split('?')[0];

        if ('/' === PATH || '/index.html' === PATH) {
            let document;

            // The board is read per request, and so is everything the document
            // points at, so that editing a stylesheet and reloading the tab is
            // the whole cycle. It also means a board edited into invalid JSON
            // while the server runs arrives HERE, as a page that says so --
            // never as a crashed server or, worse, as the last good board
            // served as if nothing had happened.
            try {
                document = buildDocument(html, {
                    ...options,
                    origin: `http://127.0.0.1:${ options.port }`,
                    board: loadBoard(options.file),
                });
            } catch (e) {
                report(e);

                response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                response.end(`preview: ${ e.message }\n${ e.remedy || '' }`);

                return;
            }

            response.writeHead(200, {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-store',
            });

            response.end(
                // the class the editor writes on the body, which is the only
                // thing 'theme-provider.tsx' reads to follow it
                document.replace(
                    '<body>',
                    `<body class="${ EDITOR_THEMES[options.theme] }">`
                )
            );

            return;
        }

        if (PATH.startsWith('/res/')) {
            serveFile(response, RESOURCE_DIR, PATH.substr('/res/'.length));

            return;
        }

        if (PATH.startsWith('/user/')) {
            serveFile(
                response, Path.join(ROOT, '.vscode'), PATH.substr('/user/'.length)
            );

            return;
        }

        response.writeHead(404).end('not found');
    });

    // the listener runs outside 'main', so it reports and exits here instead of
    // throwing into a callback nobody catches
    SERVER.on('error', (error) => {
        report(
            'EADDRINUSE' === error.code
                ? new PreviewError(
                    `port ${ options.port } is taken`,
                    `pass '--port <n>' for another one`
                )
                : new PreviewError(`the server failed: ${ error.message }`)
        );

        process.exit(1);
    });

    SERVER.listen(options.port, '127.0.0.1', () => {
        console.log('');
        console.log(`preview: http://127.0.0.1:${ options.port }`);
        console.log(`preview: board  ${ nameOf(options.file) }`);
        console.log(`preview: theme  ${ options.theme } (${ EDITOR_THEMES[options.theme] })`);
        console.log('');
        console.log('preview: this is a browser, not the editor. What is verified');
        console.log('preview: here belongs in \'testing\', never in \'done\'.');
        console.log('');
    });
}

module.exports = {
    loadBoard: loadBoard,
    serve: serve,
    serveFile: serveFile,
};
