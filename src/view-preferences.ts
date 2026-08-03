/**
 * This file is part of the vscode-kanban distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 *
 * vscode-kanban is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * vscode-kanban is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

//
// How the board is displayed is remembered here, and NOWHERE in the workspace.
//
// The two halves are stored in different places on purpose:
//
//   - the theme goes into 'globalState', which belongs to the installation.
//     Someone who prefers a light board wants a light board everywhere, and
//     the preference must not travel in a repository;
//   - the hiding, the collapsed columns and the layout go into
//     'workspaceState', keyed by the path of the folder. 'workspaceState'
//     belongs to the WINDOW, not to the folder, so a window with several
//     folders open would otherwise leak the preference of one into another.
//
// Nothing here writes a file. A file in '.vscode/' would be committed, and the
// preference of whoever committed it would be imposed on everyone who clones.
//

import * as vscode from 'vscode';

/**
 * Where an unusable stored value is reported.
 *
 * It is handed in rather than imported: this module must stay loadable
 * outside a running editor, and reaching for the logger of the extension
 * would drag the whole 'vscode' API in with it.
 */
export type LogFunction = (message: string) => void;

/**
 * The key of a column of the board.
 */
export type ColumnKey = 'todo' | 'in-progress' | 'testing' | 'done';

/**
 * What the user asked the board to look like.
 *
 * This is the same set of values as 'ThemePreference' in
 * 'src/webview/domain/types.ts', declared a second time because the two sides
 * are separate compilation units and neither may import the other. The two
 * declarations have to be changed together: a value the Webview sends and this
 * side does not recognise is dropped on the way to storage, and the preference
 * silently fails to stick. It is the same class of debt as card [12] of the
 * board of this project, on a different pair of files.
 */
export type ThemePreference = 'light' | 'dark' | 'high-contrast' | 'follow-editor';

/**
 * How the cards are laid out.
 */
export type ViewMode = 'columns' | 'list';

/**
 * The display state of a board.
 */
export interface ViewPreferences {
    /**
     * Which colour scheme the board paints itself in.
     */
    theme: ThemePreference;
    /**
     * Whether the cards of the column 'Done' are hidden.
     */
    hideDone: boolean;
    /**
     * Which columns are collapsed.
     */
    collapsedColumns: ColumnKey[];
    /**
     * Whether the cards are laid out in columns or in a single list.
     */
    viewMode: ViewMode;
}

/**
 * The state of a board nobody has expressed a preference about.
 */
export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
    theme: 'follow-editor',
    hideDone: false,
    collapsedColumns: [],
    viewMode: 'columns',
};

/**
 * The key the theme is stored under, for the whole installation.
 */
const THEME_KEY = 'vsckb.viewPreferences.theme';

/**
 * The prefix of the key the rest is stored under, one per folder.
 */
const FOLDER_KEY_PREFIX = 'vsckb.viewPreferences.folder:';

const COLUMN_KEYS: ColumnKey[] = ['todo', 'in-progress', 'testing', 'done'];
const THEMES: ThemePreference[] = [
    'light', 'dark', 'high-contrast', 'follow-editor',
];
const VIEW_MODES: ViewMode[] = ['columns', 'list'];

/**
 * Remembers how one board is displayed.
 */
export class ViewPreferenceStore {
    /**
     * Initializes a new instance of that class.
     *
     * @param {vscode.ExtensionContext} extension The context that owns the storage.
     * @param {string} folderPath The path of the folder the board belongs to.
     */
    public constructor(
        public readonly extension: vscode.ExtensionContext,
        public readonly folderPath: string,
        public readonly log?: LogFunction,
    ) {
    }

    /**
     * Reads the stored state, filling in the defaults.
     *
     * A value that is not recognised is dropped and written to the log: a
     * board must open on a corrupted preference, not refuse to.
     *
     * @return {ViewPreferences} The state, always complete and coherent.
     */
    public load(): ViewPreferences {
        const THEME = this.extension.globalState.get<any>(THEME_KEY);
        const FOLDER = this.extension.workspaceState.get<any>(this.folderKey) || {};

        return normalize({
            theme: THEME,
            hideDone: FOLDER.hideDone,
            collapsedColumns: FOLDER.collapsedColumns,
            viewMode: FOLDER.viewMode,
        }, this.log);
    }

    /**
     * Records a change.
     *
     * The payload is a DELTA: what it does not mention keeps the value it had.
     * That is what lets a change of theme leave the collapsed columns of a
     * folder alone.
     *
     * @param {Partial<ViewPreferences>} delta What changed.
     *
     * @return {Promise<ViewPreferences>} The state after the change.
     */
    public async save(delta: Partial<ViewPreferences>): Promise<ViewPreferences> {
        const CURRENT = this.load();
        const SOURCE = delta || {};

        const NEXT = normalize({
            theme: undefined === SOURCE.theme ? CURRENT.theme : SOURCE.theme,
            hideDone: undefined === SOURCE.hideDone ? CURRENT.hideDone : SOURCE.hideDone,
            collapsedColumns: undefined === SOURCE.collapsedColumns
                ? CURRENT.collapsedColumns
                : SOURCE.collapsedColumns,
            viewMode: undefined === SOURCE.viewMode ? CURRENT.viewMode : SOURCE.viewMode,
        }, this.log);

        if (NEXT.theme !== CURRENT.theme) {
            await this.extension.globalState.update(THEME_KEY, NEXT.theme);
        }

        await this.extension.workspaceState.update(this.folderKey, {
            hideDone: NEXT.hideDone,
            collapsedColumns: NEXT.collapsedColumns,
            viewMode: NEXT.viewMode,
        });

        return NEXT;
    }

    private get folderKey(): string {
        return FOLDER_KEY_PREFIX + this.folderPath;
    }
}

/**
 * Turns whatever came out of storage into a usable state.
 *
 * Hiding the finished cards IS collapsing 'done', so the two are always made
 * to agree instead of being allowed to contradict each other. The Webview
 * applies the same rule, and this side applies it too, so that what is sent
 * over the bridge is already coherent.
 *
 * @param {any} source The stored values.
 * @param {LogFunction} [log] Where an unusable value is reported.
 *
 * @return {ViewPreferences} The state.
 */
export function normalize(source: any, log?: LogFunction): ViewPreferences {
    const VALUES = source || {};

    const COLLAPSED: ColumnKey[] = Array.isArray(VALUES.collapsedColumns)
        ? VALUES.collapsedColumns.filter((c: any) => COLUMN_KEYS.indexOf(c) > -1)
        : [];

    const HIDE_DONE = true === VALUES.hideDone ||
                      COLLAPSED.indexOf('done') > -1;

    if (HIDE_DONE && COLLAPSED.indexOf('done') < 0) {
        COLLAPSED.push('done');
    }

    return {
        theme: pick(VALUES.theme, THEMES, DEFAULT_VIEW_PREFERENCES.theme, 'theme', log),
        hideDone: HIDE_DONE,
        // in board order, and without duplicates, so that the count of a
        // collapsed column cannot be wrong
        collapsedColumns: COLUMN_KEYS.filter(c => COLLAPSED.indexOf(c) > -1),
        viewMode: pick(VALUES.viewMode, VIEW_MODES, DEFAULT_VIEW_PREFERENCES.viewMode, 'viewMode', log),
    };
}

/**
 * Takes a value only if it is one of the known ones, and says so when it is not.
 */
function pick<T>(value: any, known: T[], fallback: T, name: string, log?: LogFunction): T {
    if (undefined === value || null === value) {
        return fallback;
    }

    if (known.indexOf(value) > -1) {
        return value;
    }

    if (log) {
        try {
            log(
                `viewPreferences.normalize(): unknown value for '${ name }': ` +
                `${ JSON.stringify(value) }. Using '${ fallback }'.`
            );
        } catch { }
    }

    return fallback;
}
