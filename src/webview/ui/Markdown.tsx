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

import { HREF_ATTRIBUTE, TEXT_ATTRIBUTE } from '../adapters/markdown';
import { useServices } from './services';
import { useTheme } from '../theme/theme-provider';

/**
 * Renders Markdown, with its diagrams and its highlighted code.
 */
export function Markdown(props: { source: unknown; className?: string }) {
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
            ref={ HOLDER }
            className={ `vsckb-markdown-body ${ props.className || '' }`.trim() }
            onClick={ OPEN_LINK }
            dangerouslySetInnerHTML={ { __html: HTML } }
        />
    );
}
