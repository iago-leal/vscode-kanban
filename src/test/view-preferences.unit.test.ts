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
// LOOKING AT THE BOARD IS NOT CHANGING IT.
//
// This suite exercises thirty changes of display -- ten of theme, ten of
// hiding, ten of layout -- and asserts the two things that must hold after all
// of them: the board was never written, and no event ever reached the script
// of the user (RF-25). It also asserts that the preference survived, since a
// preference that is not kept is as bad as one that writes too much.
//
// The file is named '*.unit.test.ts' rather than '*.test.ts' as the plan had
// it, because nothing here needs a running editor: the storage of the
// extension is faked, and the suite belongs in the fast run.
//

import * as assert from 'assert';

import {
    DEFAULT_VIEW_PREFERENCES,
    ViewPreferenceStore,
    normalize,
} from '../view-preferences';
import { DEFAULT_VIEW_STATE, ViewState } from '../webview/domain/types';
import {
    nextThemePreference,
    normalizeViewState,
    otherViewMode,
    viewPreferencesDelta,
    withHideDone,
} from '../webview/domain/view-state';

/**
 * A memento that only remembers.
 */
function createMemento() {
    const VALUES: { [key: string]: any } = {};

    let writes = 0;

    return {
        writes: () => writes,
        keys: () => Object.keys(VALUES),
        memento: {
            get: (key: string) => VALUES[key],
            update: async (key: string, value: any) => {
                ++writes;
                VALUES[key] = value;
            },
        },
    };
}

/**
 * A stand-in for the storage of the extension.
 */
function createExtension() {
    const GLOBAL = createMemento();
    const WORKSPACE = createMemento();

    return {
        global: GLOBAL,
        workspace: WORKSPACE,
        context: {
            globalState: GLOBAL.memento,
            workspaceState: WORKSPACE.memento,
        } as any,
    };
}

/**
 * Every command a change of display produced.
 */
function recordCommands(changes: Array<(state: ViewState) => ViewState>) {
    const COMMANDS: Array<{ command: string; data: any }> = [];

    let state: ViewState = normalizeViewState(DEFAULT_VIEW_STATE);

    for (const CHANGE of changes) {
        const NEXT = CHANGE(state);

        const DELTA = viewPreferencesDelta(NEXT, state);

        // this IS the whole of what the Webview sends when the display
        // changes: there is no other branch in 'useViewState'
        if (DELTA) {
            COMMANDS.push({ command: 'saveViewPreferences', data: DELTA });
        }

        state = NEXT;
    }

    return { commands: COMMANDS, state: state };
}

suite('Preferences of display', function () {
    suite('thirty changes of display', function () {
        const CHANGES: Array<(state: ViewState) => ViewState> = [];

        for (let i = 0; i < 10; i++) {
            CHANGES.push(s => ({ ...s, theme: nextThemePreference(s.theme) }));
        }

        for (let i = 0; i < 10; i++) {
            CHANGES.push(s => withHideDone(s, !s.hideDone));
        }

        for (let i = 0; i < 10; i++) {
            CHANGES.push(s => ({ ...s, viewMode: otherViewMode(s.viewMode) }));
        }

        test('never write the board', function () {
            const RESULT = recordCommands(CHANGES);

            const BOARD_WRITES = RESULT.commands.filter(c => 'saveBoard' === c.command);

            assert.strictEqual(BOARD_WRITES.length, 0);
        });

        test('never reach the script of the user', function () {
            const RESULT = recordCommands(CHANGES);

            const EVENTS = RESULT.commands.filter(c => 'raiseEvent' === c.command);

            assert.strictEqual(EVENTS.length, 0);
        });

        test('produce nothing but the recording of the preference', function () {
            const RESULT = recordCommands(CHANGES);

            assert.strictEqual(RESULT.commands.length, 30);

            for (const COMMAND of RESULT.commands) {
                assert.strictEqual(COMMAND.command, 'saveViewPreferences');
            }
        });

        test('send a delta, never a whole state', function () {
            const RESULT = recordCommands(CHANGES);

            for (const COMMAND of RESULT.commands) {
                // one control was pressed, so exactly one thing moved --
                // except for the hiding, which carries the collapsed column
                // it IS
                const FIELDS = Object.keys(COMMAND.data);

                assert.ok(
                    FIELDS.length <= 2,
                    `A single press sent ${ FIELDS.length } fields: ${ FIELDS.join(', ') }`
                );
            }
        });

        test('leave the board back where it started', function () {
            // ten presses of a three-state control land one step along; ten of
            // a two-state control land where they began
            const RESULT = recordCommands(CHANGES);

            assert.strictEqual(RESULT.state.hideDone, false);
            assert.strictEqual(RESULT.state.viewMode, 'columns');
            assert.deepStrictEqual(RESULT.state.collapsedColumns, []);
        });
    });

    suite('the storage of the extension', function () {
        test('keeps the theme apart from the folder', async function () {
            const EXTENSION = createExtension();

            const STORE = new ViewPreferenceStore(EXTENSION.context, '/a/folder');

            await STORE.save({ theme: 'dark' });

            assert.deepStrictEqual(
                EXTENSION.global.keys(), ['vsckb.viewPreferences.theme']
            );
            assert.deepStrictEqual(
                EXTENSION.workspace.keys(), ['vsckb.viewPreferences.folder:/a/folder']
            );
        });

        test('does not let one folder see the hiding of another', async function () {
            const EXTENSION = createExtension();

            const FIRST = new ViewPreferenceStore(EXTENSION.context, '/first');
            const SECOND = new ViewPreferenceStore(EXTENSION.context, '/second');

            await FIRST.save({ hideDone: true });

            assert.strictEqual(FIRST.load().hideDone, true);
            assert.strictEqual(SECOND.load().hideDone, false);
        });

        test('shares the theme between folders', async function () {
            const EXTENSION = createExtension();

            const FIRST = new ViewPreferenceStore(EXTENSION.context, '/first');
            const SECOND = new ViewPreferenceStore(EXTENSION.context, '/second');

            await FIRST.save({ theme: 'light' });

            assert.strictEqual(SECOND.load().theme, 'light');
        });

        test('treats what it was not told as unchanged', async function () {
            const EXTENSION = createExtension();

            const STORE = new ViewPreferenceStore(EXTENSION.context, '/a/folder');

            await STORE.save({ hideDone: true, viewMode: 'list' });
            await STORE.save({ theme: 'dark' });

            const STATE = STORE.load();

            assert.strictEqual(STATE.theme, 'dark');
            assert.strictEqual(STATE.hideDone, true);
            assert.strictEqual(STATE.viewMode, 'list');
        });

        test('opens on the defaults, when nothing was ever stored', function () {
            const EXTENSION = createExtension();

            const STORE = new ViewPreferenceStore(EXTENSION.context, '/a/folder');

            assert.deepStrictEqual(STORE.load(), DEFAULT_VIEW_PREFERENCES);
        });
    });

    suite('a value that came back unusable', function () {
        test('falls back instead of bringing the board down', function () {
            const STATE = normalize({
                theme: 'sepia',
                viewMode: 'carousel',
                collapsedColumns: ['todo', 'nowhere'],
                hideDone: 'yes',
            });

            assert.strictEqual(STATE.theme, 'follow-editor');
            assert.strictEqual(STATE.viewMode, 'columns');
            assert.deepStrictEqual(STATE.collapsedColumns, ['todo']);
            // only a real 'true' hides them
            assert.strictEqual(STATE.hideDone, false);
        });

        test('keeps hiding and collapsing in agreement', function () {
            const FROM_HIDING = normalize({ hideDone: true });

            assert.deepStrictEqual(FROM_HIDING.collapsedColumns, ['done']);

            const FROM_COLLAPSING = normalize({ collapsedColumns: ['done'] });

            assert.strictEqual(FROM_COLLAPSING.hideDone, true);
        });
    });
});
