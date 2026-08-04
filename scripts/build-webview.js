/**
 * Bundles the Webview interface.
 *
 * The extension itself is compiled by 'tsc' into 'out/'. The Webview is a
 * separate unit: a browser bundle, built by esbuild out of
 * 'src/webview/main.tsx' into 'out/res/webview/'.
 *
 * The output lives beside the resources the extension copies, and NOT under
 * 'out/res/js/', so that it cannot collide with the legacy 'board.js' while
 * both are still served.
 *
 * Usage:
 *     node ./scripts/build-webview.js            production build
 *     node ./scripts/build-webview.js --watch    rebuild on change
 */

const ESBUILD = require('esbuild');
const Path = require('path');

const { trimColourSets } = require('./theme-tokens');

const ROOT = Path.resolve(__dirname, '..');

const WATCH = process.argv.includes('--watch');

/**
 * VS Code 1.78 ships Electron 22.3.5, whose Chromium is 108: nothing newer
 * than that may be emitted.
 *
 * The floor rose from 1.62 (Chromium 91) with the adoption of the external
 * design system: its stylesheets use the relational selector and container
 * queries, both of which need Chromium 105 (decision D-18).
 */
const BROWSER_TARGET = 'chrome108';

const OPTIONS = {
    absWorkingDir: ROOT,
    entryPoints: [Path.join('src', 'webview', 'main.tsx')],
    outdir: Path.join('out', 'res', 'webview'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: BROWSER_TARGET,
    jsx: 'automatic',
    // sources are readable in the Webview developer tools while developing
    sourcemap: WATCH ? 'inline' : false,
    minify: !WATCH,
    // a stable name, so that 'html.ts' can point at it without guessing
    entryNames: '[name]',
    assetNames: '[name]',
    // '.css' covers both the stylesheets of this project and the ones the
    // design system imports from its own modules: the packages ship plain,
    // already compiled CSS beside each component — not CSS modules — so the
    // same loader resolves them, and the whole lot is emitted as the single
    // 'main.css' that 'html.ts' already serves (action T005)
    loader: {
        '.css': 'css',
        '.svg': 'text',
    },
    define: {
        'process.env.NODE_ENV': WATCH ? '"development"' : '"production"',
    },
    logLevel: 'info',
};

/**
 * The colour sets of the design system are served trimmed to the tokens the
 * interface actually names: whole, the four of them fill 390 KB of the 400 KB
 * the performance requirement allows. The reasoning is in 'theme-tokens.js'.
 *
 * The plugin runs a probe build of its own, and therefore receives the options
 * WITHOUT itself in them.
 */
const BUILD_OPTIONS = {
    ...OPTIONS,
    plugins: [trimColourSets(OPTIONS)],
};

async function main() {
    if (WATCH) {
        const CONTEXT = await ESBUILD.context(BUILD_OPTIONS);

        await CONTEXT.watch();

        console.log('Watching the Webview sources ...');

        return;
    }

    await ESBUILD.build(BUILD_OPTIONS);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
