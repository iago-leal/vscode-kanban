/**
 * The display state, while the board is open.
 *
 * The first paint uses whatever the panel remembered ('vscode.getState()'),
 * because waiting for the extension to answer 'onLoaded' would show either an
 * empty panel or a board in the wrong theme for a moment, and then a flash
 * (D-06). What the extension eventually sends wins over that guess.
 *
 * Every change is recorded twice: with the panel, so the next paint is right,
 * and with the extension, so the next SESSION is right. Neither write touches
 * the board file (RF-15), and neither raises an event towards the script of
 * the user (RF-25).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { Bridge } from '../bridge/vscode-bridge';
import { ColumnKey, ViewState } from '../domain/types';
import {
    nextThemePreference,
    normalizeViewState,
    otherViewMode,
    viewPreferencesDelta,
    withCollapsedColumn,
    withHideDone,
} from '../domain/view-state';
import { ViewPreferences } from '../bridge/messages';

/**
 * What the board does with its display state.
 */
export interface ViewStateControls {
    viewState: ViewState;
    cycleTheme(): void;
    toggleHideDone(): void;
    toggleViewMode(): void;
    setCollapsed(column: ColumnKey, collapsed: boolean): void;
    /**
     * Takes what the extension stored, which wins over the optimistic guess.
     */
    accept(preferences: Partial<ViewPreferences>): void;
}

/**
 * Holds and records the display state.
 *
 * @param {Bridge} bridge The bridge to the extension.
 *
 * @return {ViewStateControls} The state and what changes it.
 */
export function useViewState(bridge: Bridge): ViewStateControls {
    const [viewState, setViewState] = useState<ViewState>(
        () => normalizeViewState(bridge.getState())
    );

    // the panel is told about every change, so that a hidden and re-shown
    // board paints right the first time
    useEffect(() => {
        bridge.setState(viewState);
    }, [bridge, viewState]);

    const RECORD = useCallback((next: ViewState, previous: ViewState) => {
        const DELTA = viewPreferencesDelta(next, previous);

        if (DELTA) {
            bridge.saveViewPreferences(DELTA);
        }

        return next;
    }, [bridge]);

    const APPLY = useCallback((change: (state: ViewState) => ViewState) => {
        setViewState(previous => RECORD(change(previous), previous));
    }, [RECORD]);

    return useMemo<ViewStateControls>(() => ({
        viewState: viewState,

        cycleTheme: () => APPLY(state => ({
            ...state,
            theme: nextThemePreference(state.theme),
        })),

        toggleHideDone: () => APPLY(state => withHideDone(state, !state.hideDone)),

        toggleViewMode: () => APPLY(state => ({
            ...state,
            viewMode: otherViewMode(state.viewMode),
        })),

        setCollapsed: (column: ColumnKey, collapsed: boolean) => APPLY(
            state => withCollapsedColumn(state, column, collapsed)
        ),

        // what the extension stored is not recorded back to it: doing so would
        // answer every load with a write
        accept: (preferences: Partial<ViewPreferences>) => setViewState(
            () => normalizeViewState(preferences)
        ),
    }), [viewState, APPLY]);
}

