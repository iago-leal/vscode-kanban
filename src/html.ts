/**
 * This file is part of the vscode-kanban distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 *
 * vscode-kanban is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-kanban is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//
// The document the board is served in.
//
// It is deliberately almost empty: a mount point, the libraries the bundle
// still leans on, and the bundle itself. Everything the user sees is rendered
// by 'src/webview/'.
//
// What left the document with this feature: jQuery, Bootstrap, Font Awesome,
// 'board.css', 'style.css', 'script.js' and 'board.js'. What stayed: Filtrex,
// Moment, highlight.js, CodeMirror, Mermaid and Showdown, each of them behind
// an adapter in 'src/webview/adapters/'.
//
// Every script tag carries a nonce. The Content-Security-Policy that would
// USE it is not declared here yet: Filtrex compiles with 'new Function' and
// Mermaid evaluates dynamically, so a policy strict enough to be worth having
// depends on replacing the filter evaluator first. Leaving the nonce in place
// is what makes that a small change later instead of a large one.
//

import * as Crypto from 'crypto';
import * as HtmlEntities from 'html-entities';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * The identifier of the element the Webview bundle renders into.
 */
export const WEBVIEW_ROOT_ELEMENT_ID = 'vsckb-root';

/**
 * The stylesheets the surviving libraries need.
 */
const VENDOR_STYLES = [
    'css/hljs-atom-one-dark.css',
    'css/codemirror.css',
    'css/mermaid/mermaid.css',
    'css/mermaid/mermaid.dark.css',
];

/**
 * The libraries the bundle reaches through its adapters.
 *
 * They are globals, not packages: esbuild cannot bundle them, so the document
 * loads them before the bundle runs.
 */
const VENDOR_SCRIPTS = [
    'js/filtrex.js',
    'js/moment-with-locales.min.js',
    'js/highlight.pack.js',
    'js/codemirror/codemirror.js',
    'js/codemirror/addon/display/autorefresh.js',
    'js/codemirror/mode/markdown/markdown.js',
    'js/mermaid/mermaid.js',
    'js/mermaid/mermaidAPI.js',
    'js/showdown.min.js',
];

/**
 * Creates the nonce of a document.
 *
 * @return {string} The nonce.
 */
export function createNonce(): string {
    return Crypto.randomBytes(16)
                 .toString('base64');
}

/**
 * Function to generate (additional) footer content.
 *
 * @return {string} The generated HTML code.
 */
export type GetFooterFunction = () => string;

/**
 * Options for 'generateFooter()' function.
 */
export interface GenerateFooterOptions extends ResourceUriResolver, WithNonce {
    /**
     * The path of the bundled interface, relative to the resource directory.
     *
     * When it is set, the mount point and the bundle are emitted. A document
     * that does not render a bundled interface simply leaves it out.
     */
    bundleFile?: string;
    /**
     * The function that generates additional footer content.
     */
    getFooter?: GetFooterFunction;
}

/**
 * Options for 'generateHeader()' function.
 */
export interface GenerateHeaderOptions extends ResourceUriResolver, WithNonce, WithTitle {
    /**
     * The path of the stylesheet of the bundled interface.
     */
    bundleStyleFile?: string;
}

/**
 * Options for 'generateHtmlDocument()' function.
 */
export interface GenerateHtmlDocumentOptions extends ResourceUriResolver, WithTitle {
    /**
     * The path of the bundled interface, relative to the resource directory.
     */
    bundleFile?: string;
    /**
     * The function that generates the (body) content.
     *
     * @return {string} The content.
     */
    getContent?: () => string;
    /**
     * The function that generates additional footer content.
     */
    getFooter?: GetFooterFunction;
    /**
     * The (internal) name of the document.
     */
    name: string;
}

/**
 * The function that returns the URI of a resource.
 *
 * @param {string} path The path inside the resource directory.
 *
 * @return {vscode.Uri} The URI.
 */
export type GetResourceUriFunction = (path: string) => vscode.Uri;

/**
 * An object that resolves a resource URI.
 */
export interface ResourceUriResolver {
    /**
     * The function that returns the URI of a web view resource.
     */
    getResourceUri: GetResourceUriFunction;
}

/**
 * An object that carries the nonce of the document.
 */
export interface WithNonce {
    /**
     * The nonce every script tag of the document carries.
     */
    nonce?: string;
}

/**
 * An object that can use and handle a document title.
 */
export interface WithTitle {
    /**
     * The optional title.
     */
    title?: string;
}

/**
 * Generates the common content for footer.
 *
 * @param {GenerateFooterOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateFooter(opts: GenerateFooterOptions) {
    const NONCE = vscode_helpers.toStringSafe(opts.nonce);

    const BUNDLE_FILE = vscode_helpers.toStringSafe(opts.bundleFile).trim();

    // the bundle is loaded after the mount point exists
    const BUNDLE = '' === BUNDLE_FILE ? '' : `
    <div id="${ WEBVIEW_ROOT_ELEMENT_ID }"></div>

    <script nonce="${ NONCE }" src="${ opts.getResourceUri(BUNDLE_FILE) }"></script>`;

    return `${ BUNDLE }

${ opts.getFooter ? opts.getFooter() : '' }

  </body>
</html>`;
}

/**
 * Generates the common content for 'head' tag.
 *
 * @param {GenerateHeaderOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateHeader(opts: GenerateHeaderOptions) {
    const DOC_TITLE = getDocumentTitle(opts.title);

    const NONCE = vscode_helpers.toStringSafe(opts.nonce);

    const BUNDLE_STYLE_FILE = vscode_helpers.toStringSafe(opts.bundleStyleFile).trim();

    const STYLES = VENDOR_STYLES.concat(
        '' === BUNDLE_STYLE_FILE ? [] : [BUNDLE_STYLE_FILE]
    ).map(s => {
        return `        <link rel="stylesheet" href="${ opts.getResourceUri(s) }">`;
    }).join('\n');

    const SCRIPTS = VENDOR_SCRIPTS.map(s => {
        return `        <script nonce="${ NONCE }" src="${ opts.getResourceUri(s) }"></script>`;
    }).join('\n');

    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">

        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

${ STYLES }

${ SCRIPTS }

        <title>${ HtmlEntities.encode(DOC_TITLE) }</title>
    </head>
    <body>
`;
}

/**
 * Generates a full HTML document.
 *
 * @param {GenerateHtmlDocumentOptions} opts Options.
 *
 * @return {string} The generated HTML code.
 */
export function generateHtmlDocument(opts: GenerateHtmlDocumentOptions) {
    // one nonce per document, shared by every script tag it emits
    const NONCE = createNonce();

    const BUNDLE_FILE = vscode_helpers.toStringSafe(opts.bundleFile).trim();

    return `${ generateHeader({
    bundleStyleFile: '' === BUNDLE_FILE ? undefined
                                        : BUNDLE_FILE.replace(/\.js$/, '.css'),
    getResourceUri: opts.getResourceUri,
    nonce: NONCE,
    title: opts.title,
}) }

${ opts.getContent ? opts.getContent() : '' }

${ generateFooter({
    bundleFile: opts.bundleFile,
    getFooter: opts.getFooter,
    getResourceUri: opts.getResourceUri,
    nonce: NONCE,
}) }`;
}

function getDocumentTitle(title: string) {
    title = vscode_helpers.toStringSafe(title).trim();

    let docTitle = 'Kanban Board';

    if ('' !== title) {
        docTitle = `${ docTitle } (${ title })`;
    }

    return docTitle;
}
