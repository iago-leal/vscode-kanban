/**
 * A piece of Markdown, rendered.
 *
 * Three things happen in order, and the order matters: the text is converted
 * and sanitised, then the marked code blocks become diagrams, then whatever is
 * still a code block is highlighted. Highlighting first would leave the
 * diagram source coloured and then throw the colouring away.
 *
 * The HTML is inserted directly, which is only defensible because it left the
 * sanitiser: 'html-sanitizer.ts' is the single place that decides what may
 * survive, and this component never widens that decision.
 */

import { useEffect, useMemo, useRef } from 'react';

import { AnchorName, anchored } from './anchors';
import { EffectiveTheme } from '../domain/types';
import { HREF_ATTRIBUTE, TASK_ATTRIBUTE, TEXT_ATTRIBUTE } from '../adapters/markdown';
import { useServices } from './services';
import { useTheme } from '../theme/theme-provider';

/**
 * The stylesheets the extension serves for highlighted code, one per colour
 * mode.
 *
 * The board used to be served the dark one alone, whatever it was showing,
 * which is why a code block on a light board came out dark text on dark
 * ground. Both are served now (action T043), and the one not in force is
 * switched off here (decision D-26).
 */
const HIGHLIGHT_STYLESHEETS: { [mode in EffectiveTheme]: string } = {
    'light': 'vsckb-highlight-light',
    'dark': 'vsckb-highlight-dark',
};

/**
 * Which mode the stylesheets were last put into.
 *
 * Kept at the module level on purpose: a board of a hundred cards has a
 * hundred of these components, and the stylesheets are one pair for the whole
 * document. Without this, every card would write the same thing on every
 * render.
 */
let appliedMode: EffectiveTheme | undefined;

/**
 * Switches the highlighting to the colour mode in force.
 *
 * The adapter is untouched by this, and deliberately: it still receives the
 * theme it needs by parameter and still knows nothing about documents. What
 * changes is which of the two stylesheets the document lets through.
 *
 * @param {EffectiveTheme} mode The mode being painted.
 */
export function applyHighlightTheme(mode: EffectiveTheme): void {
    if (mode === appliedMode || 'undefined' === typeof document) {
        return;
    }

    let applied = false;

    for (const CANDIDATE of Object.keys(HIGHLIGHT_STYLESHEETS) as EffectiveTheme[]) {
        const SHEET = document.getElementById(
            HIGHLIGHT_STYLESHEETS[CANDIDATE]
        ) as HTMLLinkElement | null;

        if (SHEET) {
            SHEET.disabled = CANDIDATE !== mode;

            applied = true;
        }
    }

    // an older document serving one fixed stylesheet has neither of the two,
    // and there is nothing to switch: highlighting keeps whatever it had
    if (applied) {
        appliedMode = mode;
    }
}

/**
 * Renders Markdown, with its diagrams and its highlighted code.
 */
export function Markdown(props: {
    source: unknown;
    anchor?: AnchorName;
    className?: string;
    /**
     * What to do when the user ticks or unticks a task of this text.
     *
     * Without it the boxes are still drawn and still say what they are, and
     * are announced as disabled: a checklist has to be READABLE wherever it
     * appears, and only writable where there is something to write to.
     */
    onToggleTask?: (index: number) => void;
}) {
    const { bridge, diagrams, highlight, markdown } = useServices();
    const THEME = useTheme();

    const HOLDER = useRef<HTMLDivElement>(null);

    const HTML = useMemo(
        () => markdown.toHtml(props.source),
        [markdown, props.source]
    );

    // the handler is reached through a box, because the effect below runs on a
    // change of HTML and must not be re-run merely because the parent passed a
    // new function on a render
    const ON_TOGGLE = useRef(props.onToggleTask);
    ON_TOGGLE.current = props.onToggleTask;

    useEffect(() => {
        const ELEMENT = HOLDER.current;

        if (!ELEMENT) {
            return;
        }

        applyHighlightTheme(THEME.effective);

        diagrams.render(ELEMENT, THEME.effective);
        highlight.apply(ELEMENT);
    }, [HTML, THEME.effective, diagrams, highlight]);

    //
    // Whether a box can be operated is written onto it AFTER the HTML is in
    // place, and not by the adapter that produced the HTML.
    //
    // The adapter converts text and knows nothing about who is rendering it or
    // whether that caller can save. A box that announced itself as operable
    // where nothing listens would be worse than one that says it is disabled:
    // it would be a control that answers to the keyboard and then does nothing,
    // which reads as a broken board rather than as a read-only one.
    //
    useEffect(() => {
        const ELEMENT = HOLDER.current;

        if (!ELEMENT) {
            return;
        }

        const BOXES = ELEMENT.querySelectorAll(`[${ TASK_ATTRIBUTE }]`);
        const WRITABLE = !!props.onToggleTask;

        for (let i = 0; i < BOXES.length; i++) {
            const BOX = BOXES[i];

            if (WRITABLE) {
                BOX.setAttribute('tabindex', '0');
                BOX.removeAttribute('aria-disabled');
            } else {
                BOX.removeAttribute('tabindex');
                BOX.setAttribute('aria-disabled', 'true');
            }
        }
    }, [HTML, props.onToggleTask]);

    /**
     * Ticks the box the event came from, if it came from one.
     *
     * @return {boolean} Whether it did.
     */
    const TOGGLE_TASK = (target: HTMLElement): boolean => {
        const BOX = target.closest(`[${ TASK_ATTRIBUTE }]`);

        if (!BOX || !ON_TOGGLE.current) {
            return false;
        }

        const INDEX = parseInt(BOX.getAttribute(TASK_ATTRIBUTE) || '', 10);

        if (isNaN(INDEX)) {
            return false;
        }

        ON_TOGGLE.current(INDEX);

        return true;
    };

    // a link never navigates the panel: the extension opens it, which is what
    // puts the confirmation of 'openExternalUrl' in front of the user
    const OPEN_LINK = (event: React.MouseEvent<HTMLDivElement>) => {
        if (TOGGLE_TASK(event.target as HTMLElement)) {
            event.preventDefault();
            // a card opens its details on a click of the body; ticking a box is
            // not that click
            event.stopPropagation();

            return;
        }

        const TARGET = (event.target as HTMLElement).closest('a');

        if (!TARGET) {
            return;
        }

        event.preventDefault();

        const HREF = TARGET.getAttribute(HREF_ATTRIBUTE);

        if (!HREF) {
            return;
        }

        bridge.openExternalUrl(
            HREF,
            TARGET.getAttribute(TEXT_ATTRIBUTE) || HREF
        );
    };

    //
    // A checkbox is operated by Space, and a role alone does not make that
    // happen: the browser gives that behaviour to a real 'input', and to
    // nothing else. Enter is accepted beside it, because a control that looks
    // like a button to the person at the keyboard should not be silent about
    // the key they will try first.
    //
    const OPERATE_TASK = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (' ' !== event.key && 'Enter' !== event.key) {
            return;
        }

        if (TOGGLE_TASK(event.target as HTMLElement)) {
            // Space scrolls the panel otherwise, which moves the board under
            // the very list the user is working through
            event.preventDefault();
            event.stopPropagation();
        }
    };

    return (
        <div
            { ...anchored({
                anchor: props.anchor,
                className: `vsckb-markdown-body ${ props.className || '' }`.trim(),
            }) }
            ref={ HOLDER }
            onClick={ OPEN_LINK }
            onKeyDown={ OPERATE_TASK }
            dangerouslySetInnerHTML={ { __html: HTML } }
        />
    );
}
