/**
 * The model the Webview works on.
 *
 * The board itself mirrors what the extension persists, field by field: it is
 * NOT redesigned here, and nothing in this file may change the shape of
 * '.vscode/vscode-kanban.json'. What is new is the display state, which lives
 * beside the board and never reaches the file.
 */

/**
 * The four columns of a board.
 *
 * They are fixed: no column is ever created, removed or reordered. Only the
 * displayed name of a column can be configured.
 */
export const COLUMN_KEYS = ['todo', 'in-progress', 'testing', 'done'] as const;

/**
 * The key of a column.
 */
export type ColumnKey = typeof COLUMN_KEYS[number];

/**
 * The content of a field of a card, in its normalised form.
 */
export interface CardContent {
    content?: string;
    mime?: string;
}

/**
 * A field of a card, as it may appear in the file: the extension normalises a
 * plain string into a 'CardContent' when the board is loaded.
 */
export type CardContentValue = string | CardContent;

/**
 * A card of the board.
 */
export interface BoardCard {
    assignedTo?: {
        name?: string;
    };
    category?: string;
    creation_time?: string;
    description?: CardContentValue;
    details?: CardContentValue;
    id?: string;
    prio?: number;
    /**
     * The IDs of other cards this one refers to. What the link means is not
     * defined by the system, and this feature does not define it either.
     */
    references?: string[];
    /**
     * Free data, written by the scripts of the user as well.
     */
    tag?: unknown;
    title: string;
    type?: string;
    /**
     * The identity of the card within the session.
     *
     * It is generated again on every load and never persisted; 'setCardTag',
     * 'moveCardTo' and the event scripts address a card by it.
     */
    __uid?: string;
}

/**
 * A board: four columns of cards.
 */
export type Board = {
    [column in ColumnKey]: BoardCard[];
};

/**
 * What the workspace configured about the board.
 *
 * It reaches the Webview with 'setBoard' and decides which buttons a card
 * offers and what a column is called.
 */
export interface BoardSettings {
    canExecute?: boolean;
    canTrackTime?: boolean;
    hideTimeTrackingIfIdle?: boolean;
    /**
     * Whether a new card is numbered rather than given a long identifier. It
     * is on unless the workspace turns it off.
     */
    simpleIDs?: boolean;
    /**
     * The display name of a column. The value is an object with a 'name', not
     * a plain string: that is the shape 'boards.ts' reads, and it is not
     * changed here.
     */
    columns?: {
        [column in ColumnKey]?: { name?: string };
    };
}

/**
 * What the user asked the board to look like.
 *
 * 'follow-editor' is not a colour scheme of its own: it resolves to light or
 * dark according to the theme of the editor, and keeps following it.
 */
export type ThemePreference = 'light' | 'dark' | 'follow-editor';

/**
 * The colour scheme a preference resolves to.
 */
export type EffectiveTheme = 'light' | 'dark';

/**
 * How the cards are laid out.
 */
export type ViewMode = 'columns' | 'list';

/**
 * The display state of the board.
 *
 * None of it is persisted in the board file: the theme belongs to the
 * installation, the rest to the workspace folder.
 */
export interface ViewState {
    theme: ThemePreference;
    /**
     * Whether the cards of 'done' are hidden.
     *
     * It is the particular case of a collapsed column: when it is true,
     * 'done' is among the collapsed columns.
     */
    hideDone: boolean;
    collapsedColumns: ColumnKey[];
    viewMode: ViewMode;
}

/**
 * The display state of a board that has no preference recorded yet.
 */
export const DEFAULT_VIEW_STATE: Readonly<ViewState> = Object.freeze({
    theme: 'follow-editor' as ThemePreference,
    hideDone: false,
    collapsedColumns: [] as ColumnKey[],
    viewMode: 'columns' as ViewMode,
});

/**
 * Tells whether a value is a key of a column.
 *
 * @param {unknown} value The value to check.
 *
 * @return {boolean} Is a column key or not.
 */
export function isColumnKey(value: unknown): value is ColumnKey {
    return COLUMN_KEYS.indexOf(value as ColumnKey) > -1;
}

/**
 * Returns the text of a field of a card, whichever form it has in the file.
 *
 * @param {CardContentValue|undefined} value The value of the field.
 *
 * @return {string} The text, empty when there is none.
 */
export function contentOf(value: CardContentValue | undefined): string {
    if ('string' === typeof value) {
        return value;
    }

    if (value && 'string' === typeof value.content) {
        return value.content;
    }

    return '';
}
