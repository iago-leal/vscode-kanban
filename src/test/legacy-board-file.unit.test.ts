/**
 * A board file written by version 1.33.1 survives a session untouched (RF-06).
 *
 * The fields that matter here are the ones nothing in the interface renders or
 * edits: the identifier of a card, its tag, its links to other cards and the
 * whole of its time tracking. A field the interface does not know about is
 * exactly the kind a rewrite drops, and dropping one would be silent -- the
 * board would look right and the file would have lost something.
 *
 * So a card is built with every one of them, taken through the two steps a
 * session actually performs -- identities are given on load, and the payload
 * is built on save -- and compared with what came in, byte for byte.
 *
 * This is the automated half of action T058. Opening a real board of 1.33.1 in
 * a running panel and closing it is the other half; what it would add is
 * confidence that the extension reads and writes the file the way this test
 * assumes, which the loading suite covers separately.
 */

import * as assert from 'assert';

import { Board, BoardCard } from '../webview/domain/types';
import { toSavePayload } from '../webview/bridge/save-board';
import { withUids } from '../webview/domain/identity';

/**
 * A card as version 1.33.1 wrote them, with every field that version knew.
 */
function legacyCard(title: string, id: string): BoardCard {
    return {
        assignedTo: { name: 'someone' },
        category: 'a category',
        creation_time: '2019-04-01T09:15:00.000Z',
        description: { content: 'the description', mime: 'text/markdown' },
        details: { content: 'the details', mime: 'text/markdown' },
        id: id,
        prio: 5,
        references: ['1', '2'],
        tag: { toggl: { id: 12345, project: 'a project' } },
        title: title,
        type: 'bug',
    } as BoardCard;
}

/**
 * A board of that version, with something in every column.
 */
function legacyBoard(): Board {
    return {
        todo: [legacyCard('one', '1')],
        'in-progress': [legacyCard('two', '2')],
        testing: [legacyCard('three', '3')],
        done: [legacyCard('four', '4')],
    } as Board;
}

suite('A board file written by version 1.33.1', function () {
    test('comes back out of a session with every field it went in with', function () {
        const BEFORE = legacyBoard();

        const AFTER = toSavePayload(withUids(JSON.parse(JSON.stringify(BEFORE))));

        assert.deepStrictEqual(
            AFTER, BEFORE,
            'A field the interface never renders was lost, added or changed on' +
            ' the way through (RF-06)'
        );
    });

    test('is written back in the same order of fields', function () {
        // a comparison of objects forgives a reordering and a diff does not,
        // and it is the diff the user reads
        const BEFORE = legacyBoard();

        const AFTER = toSavePayload(withUids(JSON.parse(JSON.stringify(BEFORE))));

        assert.strictEqual(
            JSON.stringify(AFTER, null, 4),
            JSON.stringify(BEFORE, null, 4),
            'The file would come back with its fields shuffled'
        );
    });

    test('never carries the identity of the session into the file', function () {
        const WITH_IDS = withUids(legacyBoard());

        assert.ok(
            WITH_IDS.todo[0].__uid,
            'Loading is what gives a card the identity the interface tells it by'
        );

        const PAYLOAD = toSavePayload(WITH_IDS);

        for (const COLUMN of Object.keys(PAYLOAD)) {
            for (const CARD of (PAYLOAD as any)[COLUMN]) {
                assert.strictEqual(
                    CARD.__uid, undefined,
                    'The identity of the session reached the file, which would' +
                    ' add a field to every card of every board'
                );
            }
        }
    });

    test('keeps the links between cards exactly as they were', function () {
        // what a link MEANS was never decided (card [13] of the board of the
        // project), and nothing renders them. Undecided is not the same as
        // discardable: the field goes back untouched
        const PAYLOAD = toSavePayload(withUids(legacyBoard()));

        assert.deepStrictEqual((PAYLOAD as any).todo[0].references, ['1', '2']);
    });

    test('keeps the time tracking of a card, which no control edits', function () {
        const PAYLOAD = toSavePayload(withUids(legacyBoard()));

        assert.deepStrictEqual(
            (PAYLOAD as any).todo[0].tag,
            { toggl: { id: 12345, project: 'a project' } }
        );
    });
});
