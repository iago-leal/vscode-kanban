/**
 * Syntax highlighting, over highlight.js.
 *
 * The only file that names highlight.js. It keeps what
 * 'vsckb_apply_highlight()' ('script.js:3') did — every 'pre code' of the tree
 * — and adds the one guard the original lacked: a block is highlighted once.
 * The board re-renders a card whenever the filter changes, and running the
 * highlighter twice over the same element nests its markup inside itself.
 */

import { LogPort, SILENT_LOG } from '../domain/ports';
import { lookUpVendor } from './vendor';

/**
 * The part of highlight.js this adapter uses.
 *
 * 'highlightBlock' is the name of the vendored copy; 'highlightElement' is
 * what later versions call it, and both are tried so that replacing the file
 * does not require touching this one.
 */
interface HighlightJs {
    highlightBlock?(block: Element): void;
    highlightElement?(block: Element): void;
}

/**
 * The name of the global.
 */
const VENDOR = 'hljs';

/**
 * The mark left on a block, that was already highlighted.
 */
const DONE_ATTRIBUTE = 'data-vsckb-highlighted';

/**
 * The syntax highlighter.
 */
export interface HighlightPort {
    /**
     * Highlights every code block of a tree.
     *
     * @param {Element} root The tree.
     */
    apply(root: Element): void;
}

/**
 * Builds the syntax highlighter.
 *
 * @param {LogPort} [log] Where a failure is reported.
 *
 * @return {HighlightPort} The highlighter.
 */
export function createHighlightJs(log: LogPort = SILENT_LOG): HighlightPort {
    return {
        apply: (root: Element): void => {
            const HLJS = lookUpVendor<HighlightJs>(VENDOR);

            if (!HLJS) {
                log('highlight.apply(): hljs is not loaded');

                return;
            }

            const BLOCKS = root.querySelectorAll('pre code');

            for (let i = 0; i < BLOCKS.length; i++) {
                const BLOCK = BLOCKS[i];

                if (BLOCK.hasAttribute(DONE_ATTRIBUTE)) {
                    continue;
                }

                // a diagram is not source code
                if (BLOCK.classList.contains('language-mermaid')) {
                    continue;
                }

                try {
                    if (HLJS.highlightElement) {
                        HLJS.highlightElement(BLOCK);
                    } else if (HLJS.highlightBlock) {
                        HLJS.highlightBlock(BLOCK);
                    }

                    BLOCK.setAttribute(DONE_ATTRIBUTE, '1');
                } catch (e) {
                    log(`highlight.apply().error: ${ String(e) }`);
                }
            }
        },
    };
}
