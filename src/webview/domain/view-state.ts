/**
 * The display state of the board: theme, hidden cards and layout.
 *
 * None of it touches the board file. Every function here is total: given a
 * state that came back corrupted from storage, it returns a usable one rather
 * than throwing, because a board that refuses to open over a bad preference
 * would be worse than a board that opens with the defaults.
 */

import {
    COLUMN_KEYS,
    ColumnKey,
    DEFAULT_VIEW_STATE,
    EffectiveTheme,
    ThemePreference,
    ViewMode,
    ViewState,
    isColumnKey,
} from './types';

/**
 * The order the theme control cycles through.
 *
 * Three presses return to where it started.
 */
export const THEME_CYCLE: ThemePreference[] = ['follow-editor', 'light', 'dark'];

/**
 * The column the 'hide done' control collapses.
 */
export const DONE_COLUMN: ColumnKey = 'done';

/**
 * Returns the state that follows the current one when the theme control is
 * pressed.
 *
 * @param {ThemePreference} current The current preference.
 *
 * @return {ThemePreference} The next one.
 */
export function nextThemePreference(current: ThemePreference): ThemePreference {
    const INDEX = THEME_CYCLE.indexOf(current);

    // an unknown value starts the cycle over, instead of getting stuck
    if (INDEX < 0) {
        return THEME_CYCLE[0];
    }

    return THEME_CYCLE[(INDEX + 1) % THEME_CYCLE.length];
}

/**
 * Resolves a preference into the colour scheme actually painted.
 *
 * An explicit choice wins over the editor; 'follow-editor' takes whatever the
 * editor currently shows.
 *
 * @param {ThemePreference} preference What the user chose.
 * @param {EffectiveTheme} editorTheme What the editor is showing.
 *
 * @return {EffectiveTheme} The scheme to paint with.
 */
export function resolveTheme(
    preference: ThemePreference,
    editorTheme: EffectiveTheme,
): EffectiveTheme {
    if ('light' === preference || 'dark' === preference) {
        return preference;
    }

    return 'dark' === editorTheme ? 'dark' : 'light';
}

/**
 * Applies the invariant that ties 'hideDone' and the collapsed columns.
 *
 * Hiding the finished cards IS collapsing 'done'. Keeping the two as
 * independent values would allow them to contradict each other, so one is
 * always derived from the other.
 *
 * @param {ViewState} state The state to normalise.
 *
 * @return {ViewState} A coherent state.
 */
export function normalizeViewState(state: Partial<ViewState> | undefined): ViewState {
    const SOURCE = state || {};

    const COLLAPSED = Array.isArray(SOURCE.collapsedColumns)
        ? SOURCE.collapsedColumns.filter(isColumnKey)
        : [];

    const HIDE_DONE = true === SOURCE.hideDone ||
                      COLLAPSED.indexOf(DONE_COLUMN) > -1;

    const COLUMNS = HIDE_DONE && COLLAPSED.indexOf(DONE_COLUMN) < 0
        ? COLLAPSED.concat(DONE_COLUMN)
        : COLLAPSED;

    return {
        theme: isThemePreference(SOURCE.theme) ? SOURCE.theme
                                               : DEFAULT_VIEW_STATE.theme,
        hideDone: HIDE_DONE,
        // duplicates would make the collapsed count wrong
        collapsedColumns: COLUMN_KEYS.filter(c => COLUMNS.indexOf(c) > -1),
        viewMode: isViewMode(SOURCE.viewMode) ? SOURCE.viewMode
                                              : DEFAULT_VIEW_STATE.viewMode,
    };
}

/**
 * Turns the hiding of finished cards on or off.
 *
 * @param {ViewState} state The current state.
 * @param {boolean} hide Whether to hide them.
 *
 * @return {ViewState} The new state.
 */
export function withHideDone(state: ViewState, hide: boolean): ViewState {
    return normalizeViewState({
        ...state,
        hideDone: hide,
        collapsedColumns: hide
            ? state.collapsedColumns.concat(DONE_COLUMN)
            : state.collapsedColumns.filter(c => DONE_COLUMN !== c),
    });
}

/**
 * Collapses or restores a single column.
 *
 * Collapsing 'done' is the same act as hiding the finished cards, and the
 * normalisation keeps both readings in agreement.
 *
 * @param {ViewState} state The current state.
 * @param {ColumnKey} column The column.
 * @param {boolean} collapsed Whether it is collapsed.
 *
 * @return {ViewState} The new state.
 */
export function withCollapsedColumn(
    state: ViewState,
    column: ColumnKey,
    collapsed: boolean,
): ViewState {
    const COLUMNS = collapsed
        ? state.collapsedColumns.concat(column)
        : state.collapsedColumns.filter(c => column !== c);

    return normalizeViewState({
        ...state,
        hideDone: DONE_COLUMN === column ? collapsed
                                         : state.hideDone,
        collapsedColumns: COLUMNS,
    });
}

/**
 * Tells whether a column is collapsed.
 */
export function isCollapsed(state: ViewState, column: ColumnKey): boolean {
    return state.collapsedColumns.indexOf(column) > -1;
}

/**
 * Works out what actually changed between two display states.
 *
 * The payload of 'saveViewPreferences' is a delta by contract, and sending
 * only what moved keeps a change of theme from rewriting the collapsed columns
 * of a workspace.
 *
 * This is also the whole of what a change of display may produce. A board
 * whose theme is toggled writes nothing else: no board, no event towards the
 * script of the user (RF-25).
 *
 * @param {ViewState} next The state after the change.
 * @param {ViewState} previous The state before it.
 *
 * @return {Partial<ViewState>|undefined} The delta; nothing when the two
 *                                        states are the same.
 */
export function viewPreferencesDelta(
    next: ViewState,
    previous: ViewState,
): Partial<ViewState> | undefined {
    const DELTA: Partial<ViewState> = {};

    let changed = false;

    if (next.theme !== previous.theme) {
        DELTA.theme = next.theme;
        changed = true;
    }

    if (next.hideDone !== previous.hideDone) {
        DELTA.hideDone = next.hideDone;
        changed = true;
    }

    if (next.viewMode !== previous.viewMode) {
        DELTA.viewMode = next.viewMode;
        changed = true;
    }

    if (next.collapsedColumns.join(',') !== previous.collapsedColumns.join(',')) {
        DELTA.collapsedColumns = next.collapsedColumns;
        changed = true;
    }

    return changed ? DELTA : undefined;
}

/**
 * Turns the layout into the other one.
 *
 * @param {ViewMode} mode The current layout.
 *
 * @return {ViewMode} The other one.
 */
export function otherViewMode(mode: ViewMode): ViewMode {
    return 'columns' === mode ? 'list' : 'columns';
}

function isThemePreference(value: unknown): value is ThemePreference {
    return 'light' === value ||
           'dark' === value ||
           'follow-editor' === value;
}

function isViewMode(value: unknown): value is ViewMode {
    return 'columns' === value ||
           'list' === value;
}
