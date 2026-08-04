/**
 * The preview server ('scripts/preview.js').
 *
 * The value of the preview rests entirely on one claim: that the page it serves
 * is the page the editor serves. If that stops being true, the tool becomes
 * worse than useless — it validates a document nobody ships, and it does so
 * convincingly, because everything on screen looks right.
 *
 * These tests hold that claim, and the two properties that make embedding a
 * board into a script tag safe. They do NOT start a server: what is worth
 * pinning is the document, and the document is a pure function of the board and
 * the resolver.
 */

import * as HtmlEntities from 'html-entities';
import * as Path from 'path';
import * as assert from 'assert';

//
// The command and the page it serves are different modules, and the split is
// what these tests follow: 'preview.js' reads what was asked for, and
// 'preview/document.js' decides what the page is.
//

/* tslint:disable-next-line:no-var-requires */
const COMMAND = require('../../scripts/preview.js');

/* tslint:disable-next-line:no-var-requires */
const PREVIEW = require('../../scripts/preview/document.js');

//
// Loaded through the preview itself, and NOT by a 'require' of its own.
//
// 'out/html.js' reaches the module the editor injects, transitively through
// 'vscode-helpers', and there is no editor here. The preview stands one in to
// get past that, which is the part most likely to break: the day it stops
// working, 'npm run preview' dies at the prompt with a module not found. Going
// through the same door is what makes this suite notice.
//
// A plain 'require("../html")' would ALSO have worked, and that is the trap: it
// works only because another test file stands the editor in first and leaves
// the module cached, so the pass depends on mocha loading 'document-shape'
// before 'preview' — true today by alphabet, and by nothing else.
//
const HTML = PREVIEW.loadDocumentGenerator();

const ORIGIN = 'http://127.0.0.1:8777';

/**
 * A board with the shapes that break naive embedding: markup in a description,
 * a card the interface has to render, and the closing tag of a script.
 */
const BOARD = {
    todo: [
        {
            title: 'A card',
            type: 'bug',
            description: { content: 'plain enough', mime: 'text/markdown' },
        },
    ],
    'in-progress': [],
    testing: [],
    done: [],
};

/**
 * Builds a document the way the server does, resolving every resource as if it
 * existed. Whether a file is on disk is the business of the resolver, and the
 * resolver has a test of its own.
 */
function documentOf(board: unknown): string {
    return PREVIEW.buildDocument(HTML, {
        origin: ORIGIN,
        board: board,
        title: 'vscode-kanban',
        file: '.vscode/vscode-kanban.json',
        theme: 'dark',
        port: 8777,
    });
}

suite('The preview server', function () {
    suite('the document it serves', function () {
        test('is built by the generator the extension uses', function () {
            //
            // Not a tautology: it asserts that 'preview.js' can be handed
            // 'out/html.js' and produce a document from it. The day the
            // signature of the generator changes, this is what fails —
            // instead of the preview quietly falling back to a page of its
            // own that nobody would notice was different.
            //
            const DOCUMENT = documentOf(BOARD);

            assert.ok(
                DOCUMENT.startsWith('<!doctype html>'),
                'the generator did not produce a document'
            );

            assert.ok(
                DOCUMENT.indexOf(`id="${ HTML.WEBVIEW_ROOT_ELEMENT_ID }"`) > -1,
                'the mount point the bundle renders into is missing'
            );

            assert.ok(
                DOCUMENT.indexOf('webview/main.js') > -1,
                'the bundle is not loaded'
            );
        });

        test('declares the same content security policy the panel does', function () {
            const DOCUMENT = documentOf(BOARD);

            assert.ok(
                DOCUMENT.indexOf('Content-Security-Policy') > -1,
                'no policy is declared, so the preview runs under rules the' +
                ' editor does not: a resource the panel would refuse would' +
                ' load here and pass inspection'
            );

            // the quote arrives escaped, and which escape the encoder picks is
            // its business, not this test's
            const POLICY = HtmlEntities.decode(
                (/content="([^"]*)"/.exec(DOCUMENT) || ['', ''])[1]
            );

            assert.ok(
                POLICY.indexOf("connect-src 'none'") > -1,
                'the policy no longer forbids connections, which is the clause' +
                ` that forces the board to travel embedded -- ${ POLICY }`
            );

            assert.ok(
                POLICY.indexOf(`style-src ${ ORIGIN }`) > -1,
                'the policy does not name this server as an origin, so every' +
                ` stylesheet of the board is refused and the page opens` +
                ` unpainted -- which is card [43] all over again: ${ POLICY }`
            );
        });

        test('puts the pretend host before the bundle', function () {
            const DOCUMENT = documentOf(BOARD);

            const HOST = DOCUMENT.indexOf('acquireVsCodeApi');
            const BUNDLE = DOCUMENT.indexOf('webview/main.js');

            assert.ok(HOST > -1, 'the pretend host is missing');
            assert.ok(BUNDLE > -1, 'the bundle is missing');

            //
            // The interface calls 'acquireVsCodeApi' while it mounts. A host
            // declared after the bundle is a host that does not exist yet, and
            // the board comes up with every button inert and one line in the
            // log — which reads exactly like a broken build.
            //
            assert.ok(
                HOST < BUNDLE,
                'the pretend host is declared after the bundle, so the' +
                ' interface finds no host when it mounts'
            );
        });

        test('carries every script under the nonce of the document', function () {
            const DOCUMENT = documentOf(BOARD);

            const TAGS = DOCUMENT.match(/<script(?![^>]*\bnonce=)[^>]*>/g) || [];

            assert.strictEqual(
                TAGS.length, 0,
                'a script without the nonce is a script the policy refuses to' +
                ' run, and the preview would open blank: ' + TAGS.join(', ')
            );
        });

        test('embeds the board instead of fetching it', function () {
            const DOCUMENT = documentOf(BOARD);

            assert.ok(
                DOCUMENT.indexOf('"A card"') > -1 ||
                DOCUMENT.indexOf('A card') > -1,
                'the board is not in the document'
            );

            assert.ok(
                DOCUMENT.indexOf('fetch(') < 0,
                'the board is fetched, which the policy of the document' +
                ' forbids: it would either be blocked or prove the policy was' +
                ' loosened for the preview'
            );
        });

        test('keeps the stylesheet of the user last, as the cascade promises', function () {
            //
            // §8 of 'interfaces/style-anchors.md' promises the stylesheet of
            // the user is the last one injected and therefore wins on equal
            // specificity. A preview that got the order wrong would report a
            // user stylesheet as broken when it is not, or as working when it
            // is not.
            //
            const DOCUMENT = PREVIEW.buildDocument(HTML, {
                origin: ORIGIN,
                board: BOARD,
                title: 'vscode-kanban',
                file: '.vscode/vscode-kanban.json',
                theme: 'dark',
                port: 8777,
            });

            const SHEETS = DOCUMENT.match(/<link rel="stylesheet"[^>]*>/g) || [];

            assert.ok(SHEETS.length > 0, 'no stylesheet is served at all');

            const USER = SHEETS.filter(
                (sheet: string) => sheet.indexOf('vscode-kanban.css') > -1
            );

            // the workspace may have no stylesheet of its own, and then there
            // is nothing to order; when it has one, it comes last
            if (USER.length) {
                assert.strictEqual(
                    SHEETS[SHEETS.length - 1], USER[0],
                    'the stylesheet of the user is not the last one'
                );
            }
        });
    });

    suite('embedding the board', function () {
        test('neutralises markup that would end the script tag', function () {
            const LITERAL = PREVIEW.toScriptLiteral({
                title: '</script><img src=x onerror=alert(1)>',
            });

            assert.ok(
                LITERAL.indexOf('</script>') < 0,
                'a card whose title closes the script tag turns the rest of' +
                ' the board into markup, and the preview into a way of running' +
                ' whatever a board file says'
            );

            assert.deepStrictEqual(
                JSON.parse(LITERAL.replace(/\\u003c/g, '<').replace(/\\u003e/g, '>')),
                { title: '</script><img src=x onerror=alert(1)>' },
                'the escaping changed what the board says'
            );
        });

        test('leaves ordinary text exactly as it was', function () {
            //
            // The regression this guards is real and was made once here: the
            // separators U+2028 and U+2029 are invisible in an editor, and the
            // pattern meant to escape them was pasted as a plain space, which
            // would have rewritten every space of every card.
            //
            const CARD = { title: 'a b  c', description: 'x  y' };

            assert.deepStrictEqual(
                JSON.parse(PREVIEW.toScriptLiteral(CARD)),
                CARD,
                'embedding changed text that had nothing wrong with it'
            );
        });

        test('escapes the line separators that are legal in JSON only', function () {
            const RAW = 'a\u2028b\u2029c';

            const LITERAL = PREVIEW.toScriptLiteral({ title: RAW });

            assert.ok(
                LITERAL.indexOf('\u2028') < 0 && LITERAL.indexOf('\u2029') < 0,
                'a raw line separator ends the statement, and the rest of the' +
                ' board becomes a syntax error'
            );

            assert.strictEqual(
                JSON.parse(LITERAL).title, RAW,
                'escaping the separators changed what the board says'
            );
        });
    });

    suite('resolving a resource', function () {
        test('answers with nothing for a file that is not there', function () {
            const RESOLVE = PREVIEW.resourceResolver(ORIGIN);

            assert.strictEqual(
                RESOLVE('webview/there-is-no-such-file.js'), undefined,
                'the footer of the document relies on this answer to leave the' +
                ' stylesheet of the user out when the workspace has none'
            );
        });

        test('answers with an address of this server for one that is', function () {
            const RESOLVE = PREVIEW.resourceResolver(ORIGIN);
            const ADDRESS = RESOLVE('js/showdown.min.js');

            assert.ok(
                ADDRESS && ADDRESS.startsWith(`${ ORIGIN }/res/`),
                `'js/showdown.min.js' did not resolve to this server: ${ ADDRESS }`
            );

            assert.ok(
                ADDRESS.indexOf('\\') < 0,
                'a Windows separator reached the address, where only the' +
                ' forward slash is a separator'
            );
        });
    });

    suite('reading the arguments', function () {
        test('defaults to the board of this workspace', function () {
            const OPTIONS = COMMAND.readArguments([]);

            assert.ok(
                OPTIONS.board.endsWith(
                    Path.join('.vscode', 'vscode-kanban.json')
                ),
                `defaulted to '${ OPTIONS.board }'`
            );

            assert.strictEqual(OPTIONS.build, true);
        });

        test('refuses a theme the editor never announces', function () {
            //
            // 'theme-provider.tsx' reads the class off the body and nothing
            // else, so a name it does not know is not a different theme: it is
            // a board silently painted light while the person at the keyboard
            // believes they asked for something else.
            //
            assert.throws(
                () => COMMAND.readArguments(['--theme', 'solarized']),
                (e: Error) => e.name === 'PreviewError'
            );
        });

        test('refuses a port that is not one', function () {
            assert.throws(
                () => COMMAND.readArguments(['--port', 'later']),
                (e: Error) => e.name === 'PreviewError'
            );
        });

        test('refuses an argument it does not know', function () {
            assert.throws(
                () => COMMAND.readArguments(['--sandbox-mode']),
                (e: Error) => e.name === 'PreviewError'
            );
        });
    });
});
