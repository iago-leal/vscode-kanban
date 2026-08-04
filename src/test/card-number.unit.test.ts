/**
 * The number a card shows (RF-01, RF-02, RF-09, RF-10).
 *
 * The card has carried an 'id' since the beginning and the interface never
 * showed it, so the agent that operates this board writes "card [35]" and the
 * maintainer opens the JSON to find out which one that is. What the feature
 * adds is display, and the whole of its rule lives in one pure function --
 * which is what makes it testable at all, because this project has no
 * component renderer under test.
 *
 * The two suites below are therefore of two kinds. The first calls the rule.
 * The second reads the source of the card, which is the only way to state that
 * the component ASKS for the rule instead of repeating it, and that the labels
 * of the action buttons kept quoting the bare title (D-01, D-06).
 */

import * as assert from 'assert';

import { cardNumberLabel, cardNumberTitle } from '../webview/domain/card-number';
import { numberedLines, offenceReport, sourceOf, withoutComments } from './sources';

/**
 * The long identifier of the requirements, as 'simpleIDs: false' shapes one:
 * a timestamp, a random number and a UUID, joined by underscores.
 *
 * Its END is what tells two cards apart. The beginning is the second they were
 * created in, and two cards made within the same second share it entirely --
 * which is why the marker keeps the tail and drops the head (RN-05).
 */
const LONG_ID = '20260804123456_412345678_a1b2c3d4e5f6a7b8';

/**
 * The source of the card, read once for the rules about its shape.
 */
const CARD_SOURCE = 'src/webview/ui/Card.tsx';

suite('The number of a card', function () {
    suite('as it is written on the card', function () {
        test('is nothing at all when there is no identifier', function () {
            //
            // A card whose 'id' is missing is a real case, and only visible in
            // the sandbox: the editor fills the field in on load (RD-07), the
            // preview does not. Showing '[undefined]' would be worse than
            // showing nothing, which is what RF-10 says.
            //
            for (const ABSENT of [undefined, '', '   ', '\t\n ']) {
                assert.strictEqual(
                    cardNumberLabel(ABSENT), undefined,
                    `An id of ${ JSON.stringify(ABSENT) } drew a marker, and` +
                    ' RF-10 exists so that it does not'
                );
            }
        });

        test('is the identifier in brackets, as the agent already writes it', function () {
            //
            // The notation is not decoration: it is the one the agent uses in
            // conversation and the one 'identity.ts' uses in its own comments.
            // Coinciding is what lets a quotation be resolved on screen
            // without translating it first (RF-02).
            //
            assert.strictEqual(cardNumberLabel('5'), '[5]');
            assert.strictEqual(cardNumberLabel('42'), '[42]');
        });

        test('is the identifier as text, never as a number', function () {
            //
            // The board tolerates identifiers that are not whole numbers, and
            // the counter of new ones skips them. Reading '007' as seven would
            // show a number that is not in the file, and RN-01 says the
            // interface displays what is written down (RN-01, D-05).
            //
            assert.strictEqual(cardNumberLabel('007'), '[007]');
            assert.strictEqual(cardNumberLabel('a1'), '[a1]');
        });

        test('is shown whole up to eight characters', function () {
            //
            // Eight digits hold any board a person will ever open, so the
            // simple identifier is never shortened in practice. The ceiling is
            // there for the long form alone.
            //
            assert.strictEqual(cardNumberLabel('12345678'), '[12345678]');
        });

        test('keeps the last six characters of a long identifier', function () {
            assert.strictEqual(
                cardNumberLabel(LONG_ID), '[…f6a7b8]',
                'The long identifier has to be cut to the tail that tells two' +
                ' cards apart (RF-09, RN-05)'
            );

            // one character past the ceiling is already the cut: the rule is
            // about the width the title can spare, not about the shape of the
            // identifier that happens to exceed it
            assert.strictEqual(cardNumberLabel('123456789'), '[…456789]');
        });

        test('never grows past the width the title can spare', function () {
            //
            // RF-05 is the reason the ceiling exists at all: the marker opens
            // the line of the title, and a marker that grew without bound
            // would push the title into a line it did not need.
            //
            // the widest the marker may ever be is the whole form at its
            // ceiling; the cut form is narrower still, which is the point of
            // cutting it
            const WIDEST = '[12345678]'.length;

            for (const ID of ['1', '12345678', '123456789', LONG_ID]) {
                const LABEL = cardNumberLabel(ID)!;

                assert.ok(
                    LABEL.length <= WIDEST,
                    `The marker of ${ ID } came out as ${ LABEL }, which is` +
                    ' wider than the widest shape the rule allows'
                );
            }
        });
    });

    suite('as the balloon of the pointer', function () {
        test('shows the whole identifier when the marker was cut', function () {
            assert.strictEqual(
                cardNumberTitle(LONG_ID), LONG_ID,
                'The card is the only place the shortened form appears, so the' +
                ' pointer has to be able to reveal the rest of it (RF-09)'
            );
        });

        test('is silent when the marker already says everything', function () {
            //
            // A balloon that repeats what is written on the screen is noise,
            // and this project already avoids it: 'vsckb-card-progress' uses
            // one only to reveal the percentage the bar does not write (D-07).
            //
            for (const ID of ['5', '42', '12345678']) {
                assert.strictEqual(
                    cardNumberTitle(ID), undefined,
                    `The card of id ${ ID } offered a balloon repeating a` +
                    ' number already on the screen'
                );
            }
        });

        test('is silent when there is no identifier', function () {
            for (const ABSENT of [undefined, '', '   ']) {
                assert.strictEqual(cardNumberTitle(ABSENT), undefined);
            }
        });
    });

    suite('as the card renders it', function () {
        test('is asked of the domain and not worked out again', function () {
            //
            // The rule lives in the domain because that is the only layer this
            // project can measure: 'test:coverage' reads
            // 'out/webview/domain/**' and nothing else. A second copy of the
            // rule inside the component would be a copy no test can reach, and
            // the two would drift the way 'card-id.ts' and 'boards.ts' already
            // did -- card [12] of the board of this project (D-01).
            //
            const SOURCE = sourceOf(CARD_SOURCE);

            assert.ok(SOURCE, `${ CARD_SOURCE } is missing`);

            assert.ok(
                SOURCE!.text.indexOf('domain/card-number') > -1,
                `${ CARD_SOURCE } does not ask the domain for the marker`
            );

            const OFFENCES: string[] = [];
            const CODE = withoutComments(SOURCE!.text);

            // a bracket inside a quoted string is the marker being built by
            // hand; a bracket in the code itself is an array or an index
            const STRINGS = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g;

            for (const LINE of numberedLines(CODE)) {
                for (const TEXT of LINE.text.match(STRINGS) || []) {
                    if (/[[\]…]/.test(TEXT)) {
                        OFFENCES.push(
                            `${ CARD_SOURCE }:${ LINE.line }: the marker written` +
                            ` out by hand -- ${ TEXT }`
                        );
                    }
                }

                if (/\.(slice|substr|substring)\s*\(/.test(LINE.text)) {
                    OFFENCES.push(
                        `${ CARD_SOURCE }:${ LINE.line }: a string being cut --` +
                        ` ${ LINE.text.trim() }`
                    );
                }
            }

            assert.strictEqual(
                OFFENCES.length, 0,
                offenceReport(
                    'The card may ask for the marker; it may not decide what' +
                    ' the marker says',
                    OFFENCES
                )
            );
        });

        test('leaves the labels of the action buttons quoting the title alone', function () {
            //
            // The card is announced once, and that is where the number
            // informs. Carrying it into the buttons would produce
            // "Edit '[5] Corrigir o editor'" four times per card, lengthening
            // every announcement without adding anything to any of them
            // (D-06).
            //
            const SOURCE = sourceOf(CARD_SOURCE);

            assert.ok(SOURCE, `${ CARD_SOURCE } is missing`);

            const CODE = withoutComments(SOURCE!.text);

            const LABELS = [
                'Execute \'${ NAME }\'',
                'Track time of \'${ NAME }\'',
                'Edit \'${ NAME }\'',
                'Move \'${ props.name }\'',
            ];

            const MISSING = LABELS.filter(label => CODE.indexOf(label) < 0);

            assert.strictEqual(
                MISSING.length, 0,
                offenceReport(
                    'A label of an action button stopped quoting the bare' +
                    ' title, which is the one thing D-06 asked to be left as' +
                    ' it was',
                    MISSING
                )
            );
        });
    });
});
