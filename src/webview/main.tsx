/**
 * Entry point of the Webview interface.
 *
 * This is the composition root, and the only place where a concrete adapter is
 * chosen. Everything below receives what it needs and never reaches for a
 * library by name, which is what makes 'Showdown' or 'Filtrex' replaceable
 * without touching a component.
 */

import { BaseStyles } from '@primer/react';
import { createRoot } from 'react-dom/client';

import { App } from './ui/App';
import { Services } from './ui/services';
import { createBridge } from './bridge/vscode-bridge';
import { createHighlightJs } from './adapters/highlight';
import { createMermaidDiagrams } from './adapters/diagrams';
import { createMomentTime } from './adapters/datetime';
import { createShowdownMarkdown } from './adapters/markdown';

/**
 * The element 'html.ts' emits for this bundle to render into.
 */
const ROOT_ELEMENT_ID = 'vsckb-root';

/**
 * Builds everything the board runs on.
 */
function createServices(): Services {
    const BRIDGE = createBridge();

    return {
        bridge: BRIDGE,
        markdown: createShowdownMarkdown(),
        diagrams: createMermaidDiagrams(BRIDGE.log),
        highlight: createHighlightJs(BRIDGE.log),
        time: createMomentTime(),
    };
}

/**
 * Reports whatever the interface failed to catch.
 *
 * The document used to declare this inline, beside 'acquireVsCodeApi'. It
 * belongs to the bundle: a failure that reaches the window is exactly the kind
 * this feature promised would never pass silently.
 */
function installErrorReporting(log: (message: string) => void): void {
    window.onerror = (message, url, line, column, error) => {
        log(`window.onerror: ${ String(message) } (${ url }:${ line }:${ column })${
            error ? `\n${ String(error.stack || error) }` : '' }`);

        return false;
    };

    window.addEventListener('unhandledrejection', (event) => {
        log(`window.unhandledrejection: ${ String(event.reason) }`);
    });
}

function mount(): void {
    const SERVICES = createServices();

    installErrorReporting(SERVICES.bridge.log);

    const ELEMENT = document.getElementById(ROOT_ELEMENT_ID);

    if (!ELEMENT) {
        SERVICES.bridge.log(`main.mount(): mount point '#${ ROOT_ELEMENT_ID }' not found`);

        return;
    }

    try {
        // The base of the design system: type stack, line height and the
        // default foreground, all read from the tokens the theme provider
        // writes on the root of the document. It brings no preference of its
        // own -- what colour set is in force stays a question only the view
        // state answers (D-20).
        createRoot(ELEMENT).render(
            <BaseStyles className="vsckb-base">
                <App services={ SERVICES } />
            </BaseStyles>
        );
    } catch (e) {
        SERVICES.bridge.log(`main.mount().error: ${ String(e) }`);
    }
}

mount();
