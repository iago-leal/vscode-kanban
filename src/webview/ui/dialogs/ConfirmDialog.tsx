/**
 * A question with two answers.
 *
 * It replaces the 'delete card' and 'clear column' modals, which were two
 * nearly identical blocks of literal HTML. The focus starts on the cancelling
 * answer, so that pressing Enter out of habit never destroys anything.
 */

import { Button, Text } from '@primer/react';

import { Dialog, DialogKind } from './Dialog';
import { anchored } from '../anchors';

/**
 * Renders the dialog.
 */
export function ConfirmDialog(props: {
    title: string;
    message: string;
    confirmLabel: string;
    kind?: DialogKind;
    onConfirm(): void;
    onClose(): void;
}) {
    return (
        <Dialog
            title={ props.title }
            kind={ props.kind || 'delete-card' }
            onClose={ props.onClose }
            footer={
                <>
                    <Button
                        { ...anchored({ anchor: 'dialog-cancel' }) }
                        autoFocus
                        onClick={ props.onClose }
                    >
                        Cancel
                    </Button>

                    <Button
                        { ...anchored({ anchor: 'dialog-confirm' }) }
                        variant="danger"
                        onClick={ props.onConfirm }
                    >
                        { props.confirmLabel }
                    </Button>
                </>
            }
        >
            <Text className="vsckb-confirm-message">{ props.message }</Text>
        </Dialog>
    );
}
