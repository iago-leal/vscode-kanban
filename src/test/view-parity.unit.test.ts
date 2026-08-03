/**
 * The two layouts show the same board (RF-20).
 *
 * Columns and list are two arrangements of one answer, not two answers. That
 * is a property of the structure -- both read the single 'VisibleBoard' that
 * 'computeVisibleBoard' returns -- and this file is what keeps it a property
 * instead of a coincidence, with the filter and the hiding of finished cards
 * both switched on, which is where two implementations would first diverge.
 *
 * The parity of ACTIONS is checked by reading the sources: both layouts render
 * the same card component and hand it the same actions, so editing, moving,
 * deleting, opening the details and tracking time are reachable in both by
 * construction. That is the automated half of action T069; clicking through
 * them needs a running editor.
 */

import * as assert from 'assert';

import { Board, BoardCard, DEFAULT_VIEW_STATE, ViewState } from '../webview/domain/types';
import { offenceReport, sourceOf } from './sources';
import { computeVisibleBoard } from '../webview/domain/visibility';
import { createBaseFilterFunctions } from '../webview/domain/filter-functions';
import { createCardPredicate } from '../webview/domain/filtering';
import { normalizeViewState, withHideDone } from '../webview/domain/view-state';
import { withUids } from '../webview/domain/identity';

/**
 * A board with something in every column, and cards a filter can tell apart.
 */
function board(): Board {
    const CARD = (title: string, type: string, prio: number): BoardCard => ({
        title: title,
        type: type,
        prio: prio,
    });

    return withUids({
        todo: [CARD('one', 'bug', 9), CARD('two', 'note', 1)],
        'in-progress': [CARD('three', 'bug', 5)],
        testing: [CARD('four', 'emergency', 7)],
        done: [CARD('five', 'note', 2), CARD('six', 'bug', 3)],
    } as any);
}

/**
 * What both layouts are handed, under a given state and filter.
 */
function visible(state: ViewState, filter: string) {
    const LOG = () => undefined;

    // the filter reads the clock through a port, and nothing here depends on
    // what it says: a fixed instant keeps the two layouts comparable
    const TIME: any = {
        unix: () => false,
        now: () => 0,
        compare: () => false,
        daysSince: () => false,
        prettyTime: () => '',
    };

    return computeVisibleBoard(
        board(),
        state,
        createCardPredicate(
            filter,
            // the filter language of the interface is a vendored global that
            // the unit run has no page to load, so an evaluator that
            // understands the one expression used here stands in for it
            (expression: string) => (card: any) => {
                if ('type == "bug"' !== expression) {
                    return true;
                }

                return 'bug' === card.type;
            },
            createBaseFilterFunctions(TIME, LOG),
            TIME,
            LOG
        )
    );
}

/**
 * The cards a layout of columns would draw, in the order it would draw them.
 */
function fromColumns(result: ReturnType<typeof visible>): string[] {
    const NAMES: string[] = [];

    for (const COLUMN of result.columns) {
        for (const CARD of COLUMN.cards) {
            NAMES.push(`${ COLUMN.key }:${ CARD.title }`);
        }
    }

    return NAMES;
}

/**
 * The cards a layout of one list would draw, in the order it would draw them.
 */
function fromList(result: ReturnType<typeof visible>): string[] {
    return result.cards.map(entry => `${ entry.column }:${ entry.card.title }`);
}

suite('The two layouts of the board', function () {
    const STATES: Array<{ what: string; state: ViewState; filter: string }> = [
        {
            what: 'with nothing filtered and nothing hidden',
            state: normalizeViewState(DEFAULT_VIEW_STATE),
            filter: '',
        },
        {
            what: 'with the finished cards hidden',
            state: withHideDone(normalizeViewState(DEFAULT_VIEW_STATE), true),
            filter: '',
        },
        {
            what: 'with a filter in force',
            state: normalizeViewState(DEFAULT_VIEW_STATE),
            filter: 'type == "bug"',
        },
        {
            what: 'with both at once',
            state: withHideDone(normalizeViewState(DEFAULT_VIEW_STATE), true),
            filter: 'type == "bug"',
        },
    ];

    for (const CASE of STATES) {
        test(`show the same cards ${ CASE.what }`, function () {
            const RESULT = visible(CASE.state, CASE.filter);

            assert.deepStrictEqual(
                fromList(RESULT).slice().sort(),
                fromColumns(RESULT).slice().sort(),
                'One layout is showing a card the other is not, which is the' +
                ' failure RF-20 exists to prevent'
            );
        });
    }

    test('agree on how many cards a collapsed column is keeping back', function () {
        const HIDDEN = visible(
            withHideDone(normalizeViewState(DEFAULT_VIEW_STATE), true), ''
        );

        const DONE = HIDDEN.columns.filter(c => 'done' === c.key)[0];

        assert.ok(DONE, 'The finished column left the board');
        assert.strictEqual(DONE.cards.length, 0, 'A collapsed column draws no card');
        assert.strictEqual(
            DONE.hiddenCount, HIDDEN.hiddenCount,
            'The strip of the column and the notice of the list would state' +
            ' different numbers for the same cards (RN-13)'
        );
    });

    test('offer the same actions, because they render the same card', function () {
        const OFFENCES: string[] = [];

        for (const FILE of ['src/webview/ui/ColumnsView.tsx',
                            'src/webview/ui/ListView.tsx']) {
            const SOURCE = sourceOf(FILE);

            assert.ok(SOURCE, `${ FILE } is missing`);

            // the list renders the card itself, the columns render it through
            // the column; either way the actions are passed straight through
            if (SOURCE!.text.indexOf('actions={ props.actions }') < 0) {
                OFFENCES.push(
                    `${ FILE } does not hand the actions on unchanged, so one` +
                    ' layout may end up offering less than the other'
                );
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0, offenceReport('layouts that alter the actions', OFFENCES)
        );
    });
});
