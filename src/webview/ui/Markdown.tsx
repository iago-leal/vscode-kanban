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
import { HREF_ATTRIBUTE, TEXT_ATTRIBUTE } from '../adapters/markdown';
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
}) {
    const { bridge, diagrams, highlight, markdown } = useServices();
    const THEME = useTheme();

    const HOLDER = useRef<HTMLDivElement>(null);

    const HTML = useMemo(
        () => markdown.toHtml(props.source),
        [markdown, props.source]
    );

    useEffect(() => {
        const ELEMENT = HOLDER.current;

        if (!ELEMENT) {
            return;
        }

        applyHighlightTheme(THEME.effective);

        diagrams.render(ELEMENT, THEME.effective);
        highlight.apply(ELEMENT);
    }, [HTML, THEME.effective, diagrams, highlight]);

    // a link never navigates the panel: the extension opens it, which is what
    // puts the confirmation of 'openExternalUrl' in front of the user
    const OPEN_LINK = (event: React.MouseEvent<HTMLDivElement>) => {
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

    return (
        <div
            { ...anchored({
                anchor: props.anchor,
                className: `vsckb-markdown-body ${ props.className || '' }`.trim(),
            }) }
            ref={ HOLDER }
            onClick={ OPEN_LINK }
            dangerouslySetInnerHTML={ { __html: HTML } }
        />
    );
}
