/**
 * Markdown, over Showdown.
 *
 * The only file that names Showdown. It reproduces the conversion of
 * 'vsckb_from_markdown()' ('script.js:227') step by step — the same flavour,
 * the same eleven options, the same rewriting of tables, images, task lists
 * and links — with two differences: jQuery is gone, and the sanitising is
 * stricter (s. 'html-sanitizer.ts').
 *
 * The options used to be set once, from a jQuery ready handler in 'script.js'.
 * They are set here instead, on the converter itself, so that the rendering no
 * longer depends on a script that is on its way out.
 */

import { MarkdownPort } from '../domain/ports';
import { isSafeUrl, sanitizeTree } from './html-sanitizer';
import { toStringSafe } from '../domain/text';

/**
 * The part of Showdown this adapter uses.
 */
interface Showdown {
    Converter: new (options?: Record<string, unknown>) => {
        makeHtml(markdown: string): string;
        setFlavor(name: string): void;
        setOption(name: string, value: unknown): void;
    };
}

/**
 * The name of the global.
 */
const VENDOR = 'showdown';

/**
 * The options of the conversion, exactly as 'script.js:454' set them.
 */
const OPTIONS: Record<string, unknown> = {
    completeHTMLDocument: false,
    encodeEmails: true,
    ghCodeBlocks: true,
    ghCompatibleHeaderId: true,
    // the card supplies the first two levels, so its Markdown starts at <h3>
    headerLevelStart: 3,
    openLinksInNewWindow: true,
    simpleLineBreaks: true,
    simplifiedAutoLink: true,
    strikethrough: true,
    tables: true,
    tasklists: true,
};

/**
 * The attribute a link carries its real target in.
 *
 * A link never navigates the Webview: the interface reads this attribute and
 * asks the extension to open the address, which is what puts the confirmation
 * of 'openExternalUrl' in front of the user.
 */
export const HREF_ATTRIBUTE = 'data-vsckb-href';

/**
 * The attribute a link carries its text in, for that same confirmation.
 */
export const TEXT_ATTRIBUTE = 'data-vsckb-text';

/**
 * Builds the renderer of Markdown.
 *
 * @return {MarkdownPort} The renderer.
 */
export function createShowdownMarkdown(): MarkdownPort {
    return {
        toHtml: (markdown: unknown): string => {
            const SHOWDOWN = (globalThis as unknown as Record<string, unknown>)[VENDOR];

            if (!SHOWDOWN) {
                // no converter, no HTML: the raw text is shown as text, which
                // is safe, instead of the card rendering as empty
                return escapeText(toStringSafe(markdown));
            }

            const CONVERTER = new (SHOWDOWN as Showdown).Converter();

            CONVERTER.setFlavor('github');

            for (const NAME in OPTIONS) {
                CONVERTER.setOption(NAME, OPTIONS[NAME]);
            }

            return decorate(
                CONVERTER.makeHtml(toStringSafe(markdown))
            );
        },
    };
}

/**
 * Cleans the converted HTML and puts the classes of the board on it.
 */
function decorate(html: string): string {
    const CONTENT = document.createElement('div');

    CONTENT.className = 'vsckb-markdown';
    CONTENT.innerHTML = html;

    //
    // The task lists are rewritten BEFORE the sanitising, and the order is the
    // whole of the fix.
    //
    // 'input' is on the list of elements that never survive, and the checkbox
    // Showdown emits for a task item is an input. Sanitising first therefore
    // removed every box, and the rewriting that ran afterwards looked for
    // 'li.task-list-item input[type="checkbox"]' and found nothing: it was dead
    // code, and the board rendered a task list as three lines of loose text
    // with no box and no way to tell a done item from a pending one.
    //
    // Running first is not a hole in the barrier. What comes out of the
    // rewriting carries no input at all -- the state moves onto a 'span' that
    // the sanitiser is then free to inspect like any other element, and does.
    // Nothing was added to what may survive, which is what RF-17 requires: the
    // barrier may be made stricter, never weaker.
    //
    decorateTaskLists(CONTENT);

    sanitizeTree(CONTENT);

    decorateTables(CONTENT);
    decorateImages(CONTENT);
    decorateLinks(CONTENT);

    return CONTENT.innerHTML;
}

function decorateTables(root: Element): void {
    const TABLES = root.querySelectorAll('table');

    for (let i = 0; i < TABLES.length; i++) {
        TABLES[i].classList.add('vsckb-table');
    }
}

function decorateImages(root: Element): void {
    const IMAGES = root.querySelectorAll('img');

    for (let i = 0; i < IMAGES.length; i++) {
        IMAGES[i].classList.add('vsckb-img-fluid');
    }
}

/**
 * The attribute a task box carries its position in.
 *
 * The position, and not the text: it is what 'toggleTaskAt' counts by, so the
 * box the user clicks and the line that gets rewritten are the same item even
 * when two items read alike -- which in a checklist they very often do.
 */
export const TASK_ATTRIBUTE = 'data-vsckb-task';

/**
 * Gives every item of a task list a box that says what it is and can be
 * operated.
 *
 * It is a 'span' and not an 'input', and that is not a preference. An input is
 * removed by the sanitiser, always, and adding an exception for this one would
 * widen the barrier by exactly one element -- the kind of exception that is
 * argued for once and never argued away again. A span carrying the ARIA role
 * of a checkbox is announced as a checkbox, focused as one and operated as one,
 * and needs no exception at all.
 *
 * Whether it can actually be ticked is decided elsewhere ('ui/Markdown.tsx'):
 * this only states the position and the state, and the interface decides
 * whether anything listens.
 */
function decorateTaskLists(root: Element): void {
    const BOXES = root.querySelectorAll('li.task-list-item input[type="checkbox"]');

    for (let i = 0; i < BOXES.length; i++) {
        const BOX = BOXES[i] as HTMLInputElement;
        const ITEM = BOX.parentElement;

        if (!ITEM) {
            continue;
        }

        const LIST = ITEM.parentElement;

        if (LIST) {
            LIST.setAttribute('class', 'vsckb-task-list');
        }

        const CHECKED = BOX.checked || BOX.hasAttribute('checked');

        // Showdown writes the bullet away with an inline style, and the box
        // takes its place; the list itself is styled by its class
        ITEM.removeAttribute('style');
        ITEM.className = 'vsckb-task';

        BOX.remove();

        const NEW_BOX = document.createElement('span');

        NEW_BOX.className = 'vsckb-task-check';
        NEW_BOX.setAttribute('role', 'checkbox');
        NEW_BOX.setAttribute('aria-checked', CHECKED ? 'true' : 'false');
        NEW_BOX.setAttribute(TASK_ATTRIBUTE, String(i));

        const CAPTION = document.createElement('span');

        CAPTION.className = 'vsckb-task-label';

        // the rest of the item moves across as MARKUP, not as text: an item
        // saying '**Ship** the thing' kept its bold in the source and used to
        // lose it here, because the old rewriting read 'textContent'
        while (ITEM.firstChild) {
            CAPTION.appendChild(ITEM.firstChild);
        }

        ITEM.appendChild(NEW_BOX);
        ITEM.appendChild(CAPTION);
    }
}

/**
 * Disarms every link and records where it wanted to go.
 */
function decorateLinks(root: Element): void {
    const LINKS = root.querySelectorAll('a');

    for (let i = 0; i < LINKS.length; i++) {
        const LINK = LINKS[i];

        const HREF = toStringSafe(LINK.getAttribute('href'));
        const TEXT = toStringSafe(LINK.textContent);

        LINK.setAttribute('href', '#');
        // 'openLinksInNewWindow' adds this one, and a Webview has no window
        // to open
        LINK.removeAttribute('target');

        if (isSafeUrl(HREF) && '#' !== HREF) {
            LINK.setAttribute(HREF_ATTRIBUTE, HREF);
            LINK.setAttribute(TEXT_ATTRIBUTE, '' === TEXT.trim() ? HREF
                                                                 : TEXT);
        }
    }
}

/**
 * Renders text as text, for the case where no converter is on the page.
 */
function escapeText(text: string): string {
    const HOLDER = document.createElement('div');

    HOLDER.className = 'vsckb-markdown';
    HOLDER.textContent = text;

    return HOLDER.innerHTML;
}
