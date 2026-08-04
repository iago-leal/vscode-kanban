/**
 * The document the board is served in (RF-18, RF-19, and §8 of the anchors).
 *
 * Three promises live in the shape of that document rather than in any
 * component, and all three are invisible until they are broken:
 *
 *   - it declares a content policy, and the policy names an origin for every
 *     kind of resource it lets through;
 *   - it asks the network for nothing, so a board opens with the machine
 *     unplugged;
 *   - the stylesheet of the user is the LAST one injected, which is the whole
 *     of what makes it win a tie.
 *
 * These are the automated halves of actions T042, T053 and T054. Watching the
 * console of a live panel with the network off, and proving a real user
 * stylesheet wins, still needs a running editor -- but a document that fails
 * here would fail there too, and fails here in a tenth of a second.
 */

import * as HtmlEntities from 'html-entities';
import * as assert from 'assert';

import type * as Html from '../html';
import { offenceReport } from './sources';

//
// The document is built on the side of the extension, and everything on that
// side reaches for the module the editor injects. There is no editor here, so
// one is stood in for: an object that answers to any name with an empty one.
//
// The type comes by a static import, which is what puts the module into the
// compilation; the values come by 'require', after the stand-in is in place.
//
const MODULE = require('module');

const EDITOR: any = new Proxy({}, {
    get: () => new Proxy(function () { /* answers to anything */ }, {
        get: () => undefined,
    }),
});

const ORIGINAL_LOAD = MODULE._load;

MODULE._load = function (request: string, ...rest: any[]) {
    return 'vscode' === request ? EDITOR
                                : ORIGINAL_LOAD.call(this, request, ...rest);
};

/* tslint:disable-next-line:no-var-requires */
const { generateHtmlDocument }: typeof Html = require('../html');

MODULE._load = ORIGINAL_LOAD;

/**
 * A stand-in for the address the Webview mints for a local file.
 */
const RESOURCE = 'vscode-webview-resource://kanban';

/**
 * What the Webview accepts as the origin of its own resources.
 */
const CSP_SOURCE = 'vscode-webview-resource:';

/**
 * The document, as the board is served it.
 */
function document(cspSource?: string): string {
    return generateHtmlDocument({
        bundleFile: 'webview/main.js',
        cspSource: cspSource,
        getFooter: () => `<link rel="stylesheet" href="${ RESOURCE }/vscode-kanban.css">`,
        getResourceUri: (path: string) => `${ RESOURCE }/${ path }` as any,
        name: 'board',
        title: 'A board',
    });
}

/**
 * The policy of a document, read back out of it.
 */
function policyOf(html: string): string {
    const MATCH = /content="([^"]*)"/.exec(
        /<meta http-equiv="Content-Security-Policy"[^>]*>/.exec(html)?.[0] || ''
    );

    // the policy is written into an attribute, so it reaches the document
    // encoded; what is asserted below is the policy, not its encoding
    return MATCH ? HtmlEntities.decode(MATCH[1]) : '';
}

suite('The document the board is served in', function () {
    suite('its content policy', function () {
        test('is declared when the Webview says what its origin is', function () {
            assert.ok(
                policyOf(document(CSP_SOURCE)).length > 0,
                'No policy was declared, so nothing constrains what the panel loads'
            );
        });

        test('is left out when nobody could say what the origin is', function () {
            // a policy that names no origin blocks the document it protects,
            // which is worse than the absence it would be replacing
            assert.strictEqual(policyOf(document(undefined)), '');
        });

        test('refuses everything it does not name', function () {
            assert.ok(
                policyOf(document(CSP_SOURCE)).indexOf(`default-src 'none'`) > -1,
                'Without a default of none, every kind of resource nobody' +
                ' thought to name is allowed'
            );
        });

        test('allows no connection to be opened at all', function () {
            assert.ok(
                policyOf(document(CSP_SOURCE)).indexOf(`connect-src 'none'`) > -1,
                'The board reads a file and talks to the extension; it has' +
                ' never had a reason to open a connection (RF-18)'
            );
        });

        test('names an origin for every kind it lets through', function () {
            const POLICY = policyOf(document(CSP_SOURCE));

            const OFFENCES: string[] = [];

            for (const KIND of ['img-src', 'style-src', 'font-src', 'script-src']) {
                if (POLICY.indexOf(KIND) < 0) {
                    OFFENCES.push(`${ KIND } is not declared, so it falls to the default`);
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0, offenceReport('kinds left undeclared', OFFENCES)
            );
        });

        test('lets a script through only with the nonce of this document', function () {
            const HTML = document(CSP_SOURCE);

            const NONCE = /<script nonce="([^"]+)"/.exec(HTML);

            assert.ok(NONCE, 'No script carries a nonce');
            assert.ok(
                policyOf(HTML).indexOf(`script-src 'nonce-${ NONCE![1] }'`) > -1,
                'The policy and the script tags disagree about the nonce, which' +
                ' would leave the panel with no script at all'
            );
        });

        test('refuses an inline stylesheet while allowing the style attribute', function () {
            const POLICY = policyOf(document(CSP_SOURCE));

            assert.ok(
                POLICY.indexOf(`style-src ${ CSP_SOURCE }`) > -1,
                'Stylesheets have to come from this extension'
            );
            assert.ok(
                POLICY.indexOf(`style-src-attr 'unsafe-inline'`) > -1,
                'A progress bar states how far along it is in an attribute,' +
                ' which no stylesheet can hold'
            );
            assert.ok(
                !/style-src [^;]*unsafe-inline/.test(POLICY),
                'Allowing inline stylesheets outright gives away what the' +
                ' narrower clause above was for'
            );
        });

        test('states plainly that eval is the one thing still owed', function () {
            // it is declared, it is not the design system's doing, and the
            // work that removes it is card [7]. What must never happen is for
            // it to be there without anyone knowing
            assert.ok(
                policyOf(document(CSP_SOURCE)).indexOf(`'unsafe-eval'`) > -1,
                'If the filter evaluator stopped needing eval, this clause and' +
                ' this test both go -- see src/res/VENDORED.md'
            );
        });
    });

    suite('what it loads', function () {
        test('asks the network for nothing', function () {
            const HTML = document(CSP_SOURCE);

            const OFFENCES: string[] = [];

            // the policy itself names 'https:' for images, which permits an
            // image a card carries and fetches none by itself
            const BODY = HTML.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '');

            for (const ADDRESS of BODY.match(/https?:\/\/[^"'\s>]+/g) || []) {
                OFFENCES.push(`the document names ${ ADDRESS }`);
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport('external addresses in the document', OFFENCES)
            );
        });

        test('says something when the interface fails to load', function () {
            const HTML = document(CSP_SOURCE);

            assert.ok(
                HTML.indexOf('The board interface did not load') > -1,
                'A bundle that is missing or throws would leave a blank panel,' +
                ' which is the failure this project has least patience for'
            );
        });
    });

    suite('the order of its stylesheets', function () {
        test('puts the stylesheet of the user last of all', function () {
            const HTML = document(CSP_SOURCE);

            const USER = HTML.indexOf('vscode-kanban.css');
            const BUNDLE = HTML.indexOf('webview/main.css');

            assert.ok(BUNDLE > -1, 'The stylesheet of the interface is not served');
            assert.ok(USER > -1, 'The stylesheet of the user is not served');

            assert.ok(
                USER > BUNDLE,
                'The stylesheet of the user comes before the one of the' +
                ' interface, so it loses a tie instead of winning it' +
                ' (interfaces/style-anchors.md §8)'
            );

            const LAST_LINK = HTML.lastIndexOf('rel="stylesheet"');

            assert.ok(
                LAST_LINK === HTML.lastIndexOf('rel="stylesheet"', USER),
                'Something is injected after the stylesheet of the user'
            );
        });

        test('serves both sets of colours for highlighted code', function () {
            const HTML = document(CSP_SOURCE);

            const OFFENCES: string[] = [];

            for (const ID of ['vsckb-highlight-light', 'vsckb-highlight-dark']) {
                if (HTML.indexOf(`id="${ ID }"`) < 0) {
                    OFFENCES.push(`${ ID } is not served`);
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport(
                    'The interface switches off the set not in force, and can' +
                    ' only do that with both served (D-26)',
                    OFFENCES
                )
            );
        });
    });
});
