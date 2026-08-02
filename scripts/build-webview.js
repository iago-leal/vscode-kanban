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

const ROOT = Path.resolve(__dirname, '..');

const WATCH = process.argv.includes('--watch');

/**
 * VS Code 1.62 ships an Electron whose Chromium is 91: nothing newer than
 * that may be emitted.
 */
const BROWSER_TARGET = 'chrome91';

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
    loader: {
        '.css': 'css',
        '.svg': 'text',
    },
    define: {
        'process.env.NODE_ENV': WATCH ? '"development"' : '"production"',
    },
    logLevel: 'info',
};

async function main() {
    if (WATCH) {
        const CONTEXT = await ESBUILD.context(OPTIONS);

        await CONTEXT.watch();

        console.log('Watching the Webview sources ...');

        return;
    }

    await ESBUILD.build(OPTIONS);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
