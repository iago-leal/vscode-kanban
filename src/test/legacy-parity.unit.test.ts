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
// PARITY WITH VERSION 1.33.1
//
// The other suites describe the behaviour in words. This one compares it, item
// by item, with what the old interface actually produced: 'domain-snapshot.json'
// was captured by running 'script.js' and 'board.js' themselves, and is the
// definition of "how the board behaved before".
//
// Nothing here is written by hand. When an expectation changes, it is because
// the snapshot was recaptured, and recapturing is a deliberate act.
//
// What this suite does NOT cover is the rendering of Markdown: converting it
// needs a document, and there is none on Node. The snapshot records the
// conversion anyway, so that the manual step of 'onboarding.md' §8 has
// something to compare against.
//

import * as FS from 'fs';
import * as Path from 'path';
import * as assert from 'assert';

import { Board, ColumnKey } from '../webview/domain/types';
import { createBaseFilterFunctions } from '../webview/domain/filter-functions';
import { createFiltrexEvaluator } from '../webview/adapters/filter-language';
import { createMomentTime } from '../webview/adapters/datetime';
import { doesMatch } from '../webview/domain/filtering';
import { loadWebview } from './webview';
import { prioritySortValue, typeSortValue } from '../webview/domain/card-taxonomy';
import { sortBoardForPersistence, sortCards } from '../webview/domain/sorting';

/**
 * Where the capture of version 1.33.1 lives.
 */
const SNAPSHOT_FILE = Path.resolve(
    __dirname, '..', '..',
    '_reversa_forward', '001-interface-react-tema-e-done',
    'reference', 'domain-snapshot.json'
);

interface Snapshot {
    fixture: Board;
    sorting: {
        [column: string]: { displayed: any[]; persisted: string };
    };
    sortValues: {
        priority: Array<{ input: any; value: number }>;
        type: Array<{ input: any; value: number }>;
    };
    filter: Array<{ expression: string; result: any; type: string; threw: boolean }>;
}

/**
 * The environment the capture evaluated its expressions against.
 *
 * These are the NAMES of the filter language, not the fields of a card, and
 * they are copied from 'captureFilter()' of 'scripts/capture-reference.js'.
 */
const FILTER_VALUES: any = {
    id: 42,
    title: 'Corrigir o quadro',
    type: 'bug',
    prio: 7,
    priority: 7,
    cat: 'frontend',
    category: 'frontend',
    assigned_to: 'iago',
    description: 'A exportação escapa entidades.',
    details: '',
    is_bug: true,
    is_emerg: false,
    is_emergency: false,
    is_issue: false,
    is_note: false,
    is_task: false,
};

suite('Parity with version 1.33.1', function () {
    let snapshot: Snapshot;

    suiteSetup(() => {
        assert.ok(
            FS.existsSync(SNAPSHOT_FILE),
            `The reference of version 1.33.1 is missing: ${ SNAPSHOT_FILE }. ` +
            'Capture it again with "node scripts/capture-reference.js <file>".'
        );

        snapshot = JSON.parse(
            FS.readFileSync(SNAPSHOT_FILE, 'utf8')
        );

        // the vendored libraries are published as globals by the facade
        loadWebview();
    });

    suite('the order of the cards', function () {
        test('is the same one the old board displayed', function () {
            for (const COLUMN in snapshot.sorting) {
                const EXPECTED = snapshot.sorting[COLUMN].displayed;

                const ACTUAL = sortCards(
                    snapshot.fixture[COLUMN as ColumnKey] || []
                ).map(c => c.id);

                assert.deepStrictEqual(
                    ACTUAL, EXPECTED,
                    `Column '${ COLUMN }' is displayed in a different order`
                );
            }
        });

        test('is the same one the old board wrote to the file', function () {
            // the old board wrote what it displayed, because it sorted in
            // place; the new one applies the same order on purpose (D-07)
            const PERSISTED = sortBoardForPersistence(snapshot.fixture);

            for (const COLUMN in snapshot.sorting) {
                const EXPECTED = snapshot.sorting[COLUMN].persisted;

                const ACTUAL = JSON.stringify(
                    (PERSISTED[COLUMN as ColumnKey] || []).map(c => c.id)
                );

                assert.strictEqual(
                    ACTUAL, EXPECTED,
                    `Column '${ COLUMN }' would be written in a different order`
                );
            }
        });
    });

    suite('the values a card is sorted by', function () {
        test('are the same for the priority', function () {
            for (const CASE of snapshot.sortValues.priority) {
                const CARD = null === CASE.input ? {} : { prio: CASE.input };

                assert.strictEqual(
                    prioritySortValue(CARD as any), CASE.value,
                    `Priority ${ JSON.stringify(CASE.input) } is weighed differently`
                );
            }
        });

        test('are the same for the type', function () {
            for (const CASE of snapshot.sortValues.type) {
                const CARD = null === CASE.input ? {} : { type: CASE.input };

                assert.strictEqual(
                    typeSortValue(CARD as any), CASE.value,
                    `Type ${ JSON.stringify(CASE.input) } is weighed differently`
                );
            }
        });
    });

    suite('the filter', function () {
        test('answers exactly what it answered before, raw type included', function () {
            const TIME = createMomentTime();
            const EVALUATE = createFiltrexEvaluator();
            const BASE_FUNCS = createBaseFilterFunctions(TIME);

            for (const CASE of snapshot.filter) {
                const RESULT = doesMatch(
                    CASE.expression,
                    { values: FILTER_VALUES },
                    EVALUATE,
                    BASE_FUNCS
                );

                assert.strictEqual(
                    RESULT, CASE.result,
                    `'${ CASE.expression }' answers something else now`
                );

                // a comparison answers 1 or 0 and a function answers a
                // boolean: callers see the difference, so it is compared too
                assert.strictEqual(
                    typeof RESULT, CASE.type,
                    `'${ CASE.expression }' answers a different type now`
                );
            }
        });
    });
});
