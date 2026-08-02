/**
 * A field that edits Markdown.
 *
 * It is a plain text area with CodeMirror opened over it. If CodeMirror is not
 * on the page the text area stays as it is and remains perfectly usable, which
 * is why the value is held here and not inside the editor.
 */

import { useEffect, useRef, useState } from 'react';

import { CodeEditor, createCodeMirrorEditor } from '../../adapters/code-editor';
import { useServices } from '../services';

/**
 * Renders the field.
 */
export function MarkdownField(props: {
    id: string;
    label: string;
    value: string;
    rows: number;
    /**
     * The largest number of characters accepted, when the field has a limit.
     */
    maxLength?: number;
    onChange(value: string): void;
}) {
    const { bridge } = useServices();

    const AREA = useRef<HTMLTextAreaElement>(null);
    const [editor, setEditor] = useState<CodeEditor | undefined>(undefined);

    // the handler must always see the current 'onChange', and the editor is
    // opened only once, so the callback is reached through a box
    const ON_CHANGE = useRef(props.onChange);
    ON_CHANGE.current = props.onChange;

    useEffect(() => {
        if (!AREA.current) {
            return;
        }

        const OPENED = createCodeMirrorEditor(
            AREA.current,
            {
                maxLength: props.maxLength,
                onChange: value => ON_CHANGE.current(value),
            },
            bridge.log
        );

        setEditor(OPENED);

        return () => {
            if (OPENED) {
                OPENED.dispose();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // a dialog measures as zero high while it is still being shown, and an
    // editor created inside one stays blank until it is measured again
    useEffect(() => {
        if (editor) {
            editor.refresh();
        }
    }, [editor]);

    return (
        <div className="vsckb-field">
            <label className="vsckb-field-label" htmlFor={ props.id }>
                { props.label }
            </label>

            <textarea
                ref={ AREA }
                id={ props.id }
                className="vsckb-field-input vsckb-markdown-editor"
                rows={ props.rows }
                maxLength={ props.maxLength }
                defaultValue={ props.value }
                onChange={ e => props.onChange(e.target.value) }
            />
        </div>
    );
}
