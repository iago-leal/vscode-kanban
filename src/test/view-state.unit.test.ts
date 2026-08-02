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
// The display state of the board: theme, hidden cards and layout.
//
// Unlike the characterization tests, these describe behaviour that is NEW.
// They are the specification of the feature, not a record of the past.
//

import * as assert from 'assert';
import { DEFAULT_VIEW_STATE, ViewState } from '../webview/domain/types';
import {
    isCollapsed,
    nextThemePreference,
    normalizeViewState,
    resolveTheme,
    withCollapsedColumn,
    withHideDone,
} from '../webview/domain/view-state';

suite('Display state of the board', function () {
    const stateOf = (partial: Partial<ViewState>) => normalizeViewState(partial);

    suite('the defaults', function () {
        test("follow the editor, when nothing was ever chosen", function () {
            assert.strictEqual(DEFAULT_VIEW_STATE.theme, 'follow-editor');
        });

        test('show every column, in the columns layout', function () {
            const STATE = normalizeViewState(undefined);

            assert.strictEqual(STATE.hideDone, false);
            assert.deepStrictEqual(STATE.collapsedColumns, []);
            assert.strictEqual(STATE.viewMode, 'columns');
        });

        test('replace a preference that came back corrupted', function () {
            const STATE = normalizeViewState({
                theme: 'sepia' as any,
                viewMode: 'kanban' as any,
                collapsedColumns: ['todo', 'nowhere' as any],
            });

            assert.strictEqual(STATE.theme, 'follow-editor');
            assert.strictEqual(STATE.viewMode, 'columns');
            assert.deepStrictEqual(STATE.collapsedColumns, ['todo']);
        });
    });

    suite('the theme control', function () {
        test('returns to where it started after three presses', function () {
            const FIRST = nextThemePreference('follow-editor');
            const SECOND = nextThemePreference(FIRST);
            const THIRD = nextThemePreference(SECOND);

            assert.strictEqual(THIRD, 'follow-editor');
        });

        test('passes through light and dark', function () {
            const VISITED = [
                nextThemePreference('follow-editor'),
                nextThemePreference(nextThemePreference('follow-editor')),
            ];

            assert.deepStrictEqual(VISITED.slice().sort(), ['dark', 'light']);
        });

        test('starts the cycle over from an unknown value', function () {
            assert.strictEqual(
                nextThemePreference('sepia' as any), 'follow-editor'
            );
        });
    });

    suite('the theme actually painted', function () {
        test('follows the editor, when that is what was chosen', function () {
            assert.strictEqual(resolveTheme('follow-editor', 'dark'), 'dark');
            assert.strictEqual(resolveTheme('follow-editor', 'light'), 'light');
        });

        test('ignores the editor, when the choice was explicit', function () {
            assert.strictEqual(resolveTheme('light', 'dark'), 'light');
            assert.strictEqual(resolveTheme('dark', 'light'), 'dark');
        });
    });

    suite('hiding the finished cards', function () {
        test('collapses the column of the finished cards', function () {
            const STATE = withHideDone(stateOf({}), true);

            assert.strictEqual(STATE.hideDone, true);
            assert.strictEqual(isCollapsed(STATE, 'done'), true);
        });

        test('restores it again', function () {
            const HIDDEN = withHideDone(stateOf({}), true);
            const SHOWN = withHideDone(HIDDEN, false);

            assert.strictEqual(SHOWN.hideDone, false);
            assert.strictEqual(isCollapsed(SHOWN, 'done'), false);
        });

        test('leaves the other columns alone', function () {
            const STATE = withHideDone(
                stateOf({ collapsedColumns: ['testing'] }), true
            );

            assert.deepStrictEqual(STATE.collapsedColumns, ['testing', 'done']);
        });

        test('is the same act as collapsing that column by hand', function () {
            const STATE = withCollapsedColumn(stateOf({}), 'done', true);

            assert.strictEqual(STATE.hideDone, true);
        });

        test('cannot contradict the collapsed columns', function () {
            // a state that says one thing and lists another is corrected,
            // never carried forward
            const STATE = stateOf({
                hideDone: false,
                collapsedColumns: ['done'],
            });

            assert.strictEqual(STATE.hideDone, true);
        });

        test('does not collapse a column twice', function () {
            const ONCE = withCollapsedColumn(stateOf({}), 'todo', true);
            const TWICE = withCollapsedColumn(ONCE, 'todo', true);

            assert.deepStrictEqual(TWICE.collapsedColumns, ['todo']);
        });
    });

    suite('collapsing any column', function () {
        test('works for a column that is not the finished one', function () {
            const STATE = withCollapsedColumn(stateOf({}), 'in-progress', true);

            assert.strictEqual(isCollapsed(STATE, 'in-progress'), true);
            assert.strictEqual(STATE.hideDone, false);
        });

        test('restores it without touching the rest', function () {
            const COLLAPSED = withCollapsedColumn(
                stateOf({ collapsedColumns: ['todo'] }), 'in-progress', true
            );
            const RESTORED = withCollapsedColumn(COLLAPSED, 'in-progress', false);

            assert.deepStrictEqual(RESTORED.collapsedColumns, ['todo']);
        });

        test('keeps the columns in the order of the board', function () {
            const STATE = stateOf({
                collapsedColumns: ['done', 'todo', 'testing'],
            });

            assert.deepStrictEqual(
                STATE.collapsedColumns, ['todo', 'testing', 'done']
            );
        });
    });
});
