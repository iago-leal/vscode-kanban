/**
 * A question with two answers.
 *
 * It replaces the 'delete card' and 'clear column' modals, which were two
 * nearly identical blocks of literal HTML. The focus starts on the cancelling
 * answer, so that pressing Enter out of habit never destroys anything.
 */

import { Dialog } from './Dialog';

/**
 * Renders the dialog.
 */
export function ConfirmDialog(props: {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm(): void;
    onClose(): void;
}) {
    return (
        <Dialog
            title={ props.title }
            onClose={ props.onClose }
            footer={
                <>
                    <button type="button" className="vsckb-button" onClick={ props.onClose }>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="vsckb-button vsckb-button-danger"
                        onClick={ props.onConfirm }
                    >
                        { props.confirmLabel }
                    </button>
                </>
            }
        >
            <p className="vsckb-confirm-message">{ props.message }</p>
        </Dialog>
    );
}
