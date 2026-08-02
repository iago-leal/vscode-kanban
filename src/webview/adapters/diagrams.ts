/**
 * Diagrams, over Mermaid.
 *
 * The only file that names Mermaid. It keeps the rule of
 * 'vsckb_apply_mermaid()' ('script.js:9'): only a code block marked as
 * 'language-mermaid' becomes a diagram, and everything else is left to the
 * syntax highlighter. Rendering the whole document would turn any code block
 * that happens to parse into a picture.
 *
 * What is new is the theme: the diagram follows the board rather than the
 * editor, so that a board fixed to light over a dark editor does not draw
 * black diagrams on a white card.
 */

import { EffectiveTheme } from '../domain/types';
import { LogPort, SILENT_LOG } from '../domain/ports';
import { lookUpVendor } from './vendor';

/**
 * The part of Mermaid this adapter uses.
 */
interface Mermaid {
    initialize(config: Record<string, unknown>): void;
    init(config: undefined, nodes: ArrayLike<Element>): void;
}

/**
 * The name of the global.
 */
const VENDOR = 'mermaid';

/**
 * The class a rendered diagram carries.
 */
const DIAGRAM_CLASS = 'vsckb-mermaid';

/**
 * The renderer of diagrams.
 */
export interface DiagramPort {
    /**
     * Turns the marked code blocks of a tree into diagrams.
     *
     * @param {Element} root The tree.
     * @param {EffectiveTheme} theme The scheme the board is painted in.
     */
    render(root: Element, theme: EffectiveTheme): void;
}

/**
 * Builds the renderer of diagrams.
 *
 * @param {LogPort} [log] Where a failure is reported.
 *
 * @return {DiagramPort} The renderer.
 */
export function createMermaidDiagrams(log: LogPort = SILENT_LOG): DiagramPort {
    return {
        render: (root: Element, theme: EffectiveTheme): void => {
            const MERMAID = lookUpVendor<Mermaid>(VENDOR);

            if (!MERMAID) {
                // the code block stays a code block, which is still readable
                log('diagrams.render(): mermaid is not loaded');

                return;
            }

            const BLOCKS = root.querySelectorAll('pre code.language-mermaid');

            for (let i = 0; i < BLOCKS.length; i++) {
                replaceWithDiagram(BLOCKS[i]);
            }

            const DIAGRAMS = root.querySelectorAll(`.${ DIAGRAM_CLASS }`);

            if (DIAGRAMS.length < 1) {
                return;
            }

            try {
                MERMAID.initialize({
                    startOnLoad: false,
                    theme: 'dark' === theme ? 'dark' : 'default',
                });

                MERMAID.init(undefined, DIAGRAMS);
            } catch (e) {
                log(`diagrams.render().error: ${ String(e) }`);
            }
        },
    };
}

/**
 * Puts a diagram holder where a marked code block was.
 *
 * The source goes in as TEXT, never as markup: it is Mermaid that reads it,
 * and nothing of it is ever parsed as HTML.
 */
function replaceWithDiagram(block: Element): void {
    const PRE = block.parentElement;

    if (!PRE) {
        return;
    }

    const HOLDER = document.createElement('div');

    HOLDER.className = `mermaid ${ DIAGRAM_CLASS }`;
    HOLDER.textContent = block.textContent;

    PRE.replaceWith(HOLDER);
}
