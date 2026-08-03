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
// Every script tag carries a nonce, and the policy that USES it is declared
// below (action T042, card [7] of the board of the project). It is as tight as
// the vendored libraries allow, and one clause of it is not tight at all:
// 'unsafe-eval'. That clause is owed to 'js/filtrex.js:57', which compiles the
// filter expression of the user with 'new Function', and to Mermaid, which
// evaluates dynamically. Neither is the design system, which needs no eval at
// all, so the requirement that the policy may not be loosened to accommodate
// the design system is kept.
//
// What the policy DOES buy, meanwhile, is worth having on its own: no script,
// stylesheet, font or connection may come from anywhere but this extension,
// and nothing at all may be fetched over the network. Replacing the filter
// evaluator -- the work card [7] describes -- is what removes the last clause,
// and by then the rest is already in place.
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
    'css/codemirror.css',
    'css/mermaid/mermaid.css',
    'css/mermaid/mermaid.dark.css',
];

/**
 * The two sets of colours for highlighted code, one per colour mode.
 *
 * Both are served, and each carries an identifier so that the interface can
 * switch off the one not in force ('src/webview/ui/Markdown.tsx', D-26). The
 * board used to be served the dark set whatever it was showing, which is why
 * a code block on a light board came out dark on dark.
 */
const HIGHLIGHT_STYLES: Array<{ id: string; file: string }> = [
    { id: 'vsckb-highlight-light', file: 'css/hljs-atom-one-light.css' },
    { id: 'vsckb-highlight-dark', file: 'css/hljs-atom-one-dark.css' },
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
    /**
     * What the Webview accepts as the origin of its own resources.
     *
     * Without it no policy is declared at all, because a policy that names no
     * origin would block the document it is meant to protect. A caller that
     * cannot supply it gets the document it always got, and says so.
     */
    cspSource?: string;
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
     * What the Webview accepts as the origin of its own resources.
     */
    cspSource?: string;
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
 * What stands in the mount point until the interface takes it over.
 *
 * The interface replaces the contents of its mount point the first time it
 * renders, so this text is seen exactly when the interface did NOT render:
 * the bundle was never built, was not copied into 'out/res/', or threw while
 * loading. Every one of those used to produce a panel that was simply blank,
 * which is the failure this project has the least patience for -- the same
 * reason 'MissingVendorError' exists on the other side of the bridge.
 *
 * It carries its own layout in attributes on purpose. The stylesheet of the
 * interface travels with the bundle, so a message about the bundle being
 * missing cannot rely on it.
 */
const MISSING_BUNDLE_NOTICE = `
        <div role="alert" style="padding: 16px; font-family: sans-serif;">
            <h2 style="margin: 0 0 8px;">The board interface did not load</h2>
            <p style="margin: 0 0 8px;">
                The bundled interface is missing from the resources of the
                extension, or it failed while loading. The board file itself
                was not touched and is safe.
            </p>
            <p style="margin: 0;">
                Building the extension from source is what produces it:
                <code>npm run build</code>. The developer tools of the Webview
                report what failed, under Help &gt; Toggle Developer Tools.
            </p>
        </div>`;

/**
 * Declares what the document is allowed to load, and from where.
 *
 * Read clause by clause: nothing is allowed unless a clause allows it; images
 * may come from this extension, from a secure address or as data, because the
 * Markdown of a card has always been able to carry one; stylesheets, fonts and
 * scripts may come only from this extension, and a script must additionally
 * carry the nonce of this document.
 *
 * Two clauses deserve to be read twice.
 *
 * 'style-src-attr' allows the inline style ATTRIBUTE while 'style-src' still
 * refuses an inline stylesheet. The attribute is how a progress bar states how
 * far along it is: a value computed per element, which no stylesheet can hold.
 * Allowing the attribute and refusing the element is the narrowest statement
 * that lets the board work.
 *
 * 'unsafe-eval' is the loose one, and it is not the design system's doing. The
 * filter language compiles the expression of the user with 'new Function'
 * ('js/filtrex.js:57', documented again at 'adapters/filter-language.ts:9'),
 * and Mermaid evaluates dynamically. The honest choices were to declare this
 * and say so, or to declare nothing at all; declaring a policy WITHOUT the
 * clause would have broken the filter and the diagrams the moment it shipped.
 * Card [7] of the board of the project is what removes it.
 *
 * @param {string} cspSource What the Webview accepts as its own origin.
 * @param {string} nonce The nonce of this document.
 *
 * @return {string} The policy.
 */
function contentSecurityPolicy(cspSource: string, nonce: string): string {
    return [
        `default-src 'none'`,
        `img-src ${ cspSource } https: data:`,
        `style-src ${ cspSource }`,
        `style-src-attr 'unsafe-inline'`,
        `font-src ${ cspSource }`,
        `script-src 'nonce-${ nonce }' 'unsafe-eval'`,
        `connect-src 'none'`,
    ].join('; ');
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
    <div id="${ WEBVIEW_ROOT_ELEMENT_ID }">${ MISSING_BUNDLE_NOTICE }</div>

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

    const CSP_SOURCE = vscode_helpers.toStringSafe(opts.cspSource).trim();

    //
    // The order of the stylesheets IS the cascade, and the cascade is a
    // promise ('interfaces/style-anchors.md' §8): the interface first, then
    // the stylesheet of the user, which is emitted in the footer and therefore
    // always last. The compatibility layer with version 1.33.1 no longer sits
    // between them -- it stopped being a stylesheet, because CSS cannot alias
    // a selector, and became the old class names written back onto the
    // elements themselves ('src/webview/theme/legacy-compat.ts').
    //
    const HIGHLIGHT = HIGHLIGHT_STYLES.map(s => {
        return `        <link rel="stylesheet" id="${ s.id }" href="${
            opts.getResourceUri(s.file) }">`;
    }).join('\n');

    const STYLES = VENDOR_STYLES.concat(
        '' === BUNDLE_STYLE_FILE ? [] : [BUNDLE_STYLE_FILE]
    ).map(s => {
        return `        <link rel="stylesheet" href="${ opts.getResourceUri(s) }">`;
    }).join('\n');

    const SCRIPTS = VENDOR_SCRIPTS.map(s => {
        return `        <script nonce="${ NONCE }" src="${ opts.getResourceUri(s) }"></script>`;
    }).join('\n');

    const POLICY = '' === CSP_SOURCE ? '' : `
        <meta http-equiv="Content-Security-Policy" content="${
            HtmlEntities.encode(contentSecurityPolicy(CSP_SOURCE, NONCE)) }">
`;

    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
${ POLICY }
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

${ HIGHLIGHT }

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
    cspSource: opts.cspSource,
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
