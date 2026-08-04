/**
 * The editor of Markdown, over CodeMirror.
 *
 * The only file that names CodeMirror. It keeps the five options the board has
 * always opened its editors with ('script.js:483'), including the auto-refresh
 * of 500 ms, which exists because a CodeMirror created inside a hidden dialog
 * measures itself as zero high and stays blank until it is measured again.
 *
 * The limit of characters is enforced here too, the same way: the text is cut
 * on change and the cursor is put back at the end. The title of a card is
 * capped at 255 characters, and that cap has to survive the rewrite.
 */

import { LogPort, SILENT_LOG } from '../domain/ports';
import { lookUpVendor } from './vendor';
import { toStringSafe } from '../domain/text';

/**
 * The part of CodeMirror this adapter uses.
 */
interface CodeMirrorEditor {
    getValue(): string;
    setValue(value: string): void;
    setCursor(line: number, ch: number): void;
    lineCount(): number;
    on(event: string, handler: (editor: CodeMirrorEditor) => void): void;
    toTextArea(): void;
    refresh(): void;
}

interface CodeMirrorLib {
    fromTextArea(
        element: HTMLTextAreaElement,
        options: Record<string, unknown>,
    ): CodeMirrorEditor;
}

/**
 * The name of the global.
 */
const VENDOR = 'CodeMirror';

/**
 * The options of every editor of the board.
 */
const OPTIONS: Record<string, unknown> = {
    dragDrop: true,
    lineNumbers: true,
    lineWrapping: true,
    mode: 'text/x-markdown',
    autoRefresh: {
        delay: 500,
    },
};

/**
 * An editor, as the interface holds it.
 */
export interface CodeEditor {
    /**
     * The text being edited.
     */
    getValue(): string;

    /**
     * Measures the editor again, after the dialog around it became visible.
     */
    refresh(): void;

    /**
     * Gives the text area back and drops the editor.
     */
    dispose(): void;
}

/**
 * How an editor is opened.
 */
export interface CodeEditorOptions {
    /**
     * The largest number of characters accepted, if there is a limit.
     */
    maxLength?: number;

    /**
     * Called whenever the text changes.
     */
    onChange?: (value: string) => void;
}

/**
 * Opens an editor over a text area.
 *
 * @param {HTMLTextAreaElement} element The text area.
 * @param {CodeEditorOptions} options How to open it.
 * @param {LogPort} [log] Where a failure is reported.
 *
 * @return {CodeEditor|undefined} The editor; nothing when CodeMirror is
 *                                absent, in which case the text area itself
 *                                stays usable.
 */
export function createCodeMirrorEditor(
    element: HTMLTextAreaElement,
    options: CodeEditorOptions = {},
    log: LogPort = SILENT_LOG,
): CodeEditor | undefined {
    const LIB = lookUpVendor<CodeMirrorLib>(VENDOR);

    if (!LIB) {
        // a plain text area edits Markdown perfectly well, only without the
        // line numbers: the dialog still works
        log('code-editor.create(): CodeMirror is not loaded');

        return undefined;
    }

    let editor: CodeMirrorEditor;

    try {
        editor = LIB.fromTextArea(element, OPTIONS);
    } catch (e) {
        log(`code-editor.create().error: ${ String(e) }`);

        return undefined;
    }

    editor.on('change', (cm) => {
        const VALUE = enforceLimit(cm, options.maxLength);

        if (options.onChange) {
            options.onChange(VALUE);
        }
    });

    return {
        getValue: () => toStringSafe(editor.getValue()),
        refresh: () => editor.refresh(),
        dispose: () => {
            try {
                editor.toTextArea();
            } catch (e) {
                log(`code-editor.dispose().error: ${ String(e) }`);
            }
        },
    };
}

/**
 * Cuts the text back to the limit, when there is one.
 */
function enforceLimit(
    editor: CodeMirrorEditor,
    maxLength: number | undefined,
): string {
    const VALUE = toStringSafe(editor.getValue());

    if (undefined === maxLength ||
        isNaN(maxLength) ||
        maxLength < 0 ||
        VALUE.length <= maxLength) {
        return VALUE;
    }

    const CUT = VALUE.substr(0, maxLength);

    editor.setValue(CUT);
    editor.setCursor(editor.lineCount(), 0);

    return CUT;
}
