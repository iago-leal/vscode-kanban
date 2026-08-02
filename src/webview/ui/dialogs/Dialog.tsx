/**
 * The dialog every other one is built on.
 *
 * The old dialogs were Bootstrap modals declared as literal HTML inside
 * 'boards.ts' and wired by jQuery. They could not be closed with Escape, they
 * did not hold the focus, and they announced nothing. This one is a real
 * dialog: it says what it is, it keeps the focus inside itself while it is
 * open, and it gives the focus back to whatever opened it.
 */

import { ReactNode, useEffect, useRef } from 'react';

import { Icon } from '../icons';

/**
 * What can be focused inside a dialog.
 */
const FOCUSABLE = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Renders a dialog over the board.
 */
export function Dialog(props: {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    onClose(): void;
}) {
    const PANEL = useRef<HTMLDivElement>(null);
    const OPENER = useRef<Element | null>(null);

    useEffect(() => {
        OPENER.current = document.activeElement;

        focusFirst(PANEL.current);

        return () => {
            // whoever opened the dialog gets the focus back, so that the
            // keyboard does not land at the top of the board every time
            const BACK = OPENER.current as HTMLElement | null;

            if (BACK && BACK.focus) {
                BACK.focus();
            }
        };
    }, []);

    const ON_KEY_DOWN = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if ('Escape' === event.key) {
            event.stopPropagation();

            props.onClose();

            return;
        }

        if ('Tab' === event.key) {
            keepFocusInside(event, PANEL.current);
        }
    };

    return (
        <div className="vsckb-dialog-backdrop" onMouseDown={ props.onClose }>
            <div
                ref={ PANEL }
                className="vsckb-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={ props.title }
                onKeyDown={ ON_KEY_DOWN }
                onMouseDown={ e => e.stopPropagation() }
            >
                <header className="vsckb-dialog-header">
                    <h2 className="vsckb-dialog-title">{ props.title }</h2>

                    <button
                        type="button"
                        className="vsckb-icon-button"
                        aria-label="Close this dialog"
                        title="Close"
                        onClick={ props.onClose }
                    >
                        <Icon name="close" />
                    </button>
                </header>

                <div className="vsckb-dialog-body">
                    { props.children }
                </div>

                { props.footer ? (
                    <footer className="vsckb-dialog-footer">{ props.footer }</footer>
                ) : null }
            </div>
        </div>
    );
}

/**
 * Puts the focus on the first thing the user can act on.
 */
function focusFirst(panel: HTMLElement | null): void {
    if (!panel) {
        return;
    }

    const FIRST = panel.querySelector<HTMLElement>(FOCUSABLE);

    if (FIRST) {
        FIRST.focus();
    }
}

/**
 * Wraps the focus around, so that tabbing never leaves the dialog for the
 * board behind it.
 */
function keepFocusInside(
    event: React.KeyboardEvent<HTMLDivElement>,
    panel: HTMLElement | null,
): void {
    if (!panel) {
        return;
    }

    const ALL = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));

    if (ALL.length < 1) {
        return;
    }

    const FIRST = ALL[0];
    const LAST = ALL[ALL.length - 1];

    if (event.shiftKey && document.activeElement === FIRST) {
        event.preventDefault();
        LAST.focus();

        return;
    }

    if (!event.shiftKey && document.activeElement === LAST) {
        event.preventDefault();
        FIRST.focus();
    }
}
