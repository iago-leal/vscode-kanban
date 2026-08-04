/**
 * The dialog every other one is built on.
 *
 * The dialogs of version 1.33.1 were Bootstrap modals declared as literal HTML
 * inside 'boards.ts' and wired by jQuery: they could not be closed with
 * Escape, they did not hold the focus, and they announced nothing. Feature 001
 * replaced them with a hand-written dialog that fixed all three, at the cost of
 * some sixty lines of focus arithmetic living here.
 *
 * That arithmetic is now the design system's (RF-13, RF-14). Closing on
 * Escape, keeping the focus inside while open, giving it back to whatever
 * opened it and announcing itself as a dialog are all behaviour of the
 * component, maintained by the people who maintain the component. Nothing of
 * the sort is reimplemented here.
 *
 * What this file keeps is the shape the rest of the board expects -- a title,
 * a body and an optional footer -- and the style anchors, so that a stylesheet
 * written against a dialog of 1.33.1 still finds it (RF-28).
 */

import { Dialog as SystemDialog } from '@primer/react';
import { ReactNode } from 'react';

import { anchored } from '../anchors';

/**
 * Which of the five dialogs this is.
 *
 * Five dialogs and four components: the confirmation of a deletion and the
 * confirmation of a clearing are the same component, told apart by this value
 * (contract 'style-anchors.md' §5.2).
 */
export type DialogKind =
    | 'add-card'
    | 'edit-card'
    | 'card-details'
    | 'delete-card'
    | 'clear-done';

/**
 * Renders a dialog over the board.
 */
export function Dialog(props: {
    title: string;
    kind: DialogKind;
    children: ReactNode;
    footer?: ReactNode;
    onClose(): void;
}) {
    return (
        <SystemDialog
            { ...anchored({
                anchor: 'dialog',
                dialog: props.kind,
                className: 'vsckb-dialog',
            }) }
            title={ props.title }
            width="large"
            onClose={ props.onClose }
            renderFooter={ props.footer
                ? () => (
                    <SystemDialog.Footer className="vsckb-dialog-footer">
                        { props.footer }
                    </SystemDialog.Footer>
                )
                : undefined }
        >
            <div className="vsckb-dialog-body">
                { props.children }
            </div>
        </SystemDialog>
    );
}
