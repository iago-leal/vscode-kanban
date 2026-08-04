/**
 * The barrier between what a card says and what the Webview runs (RF-17).
 *
 * This feature is about appearance, and an appearance feature has exactly one
 * duty towards security: leave it no weaker than it found it. That is easy to
 * promise and easy to break by accident, because a barrier is weakened by
 * DELETION — an element dropped from the forbidden list, a scheme added to the
 * safe one — and a deletion leaves no trace to notice.
 *
 * So the surface is written down here, once, as it stood when the feature
 * began. The test does not say the barrier is good enough; card [6] of the
 * board of this project says it is not, and repairing it is not this feature.
 * It says the barrier did not shrink.
 *
 * The check reads the source rather than exercising the sanitiser, because
 * the sanitiser works on a DOM and the unit suite has none. What it costs is
 * that a rule rewritten in another shape would have to be re-declared here on
 * purpose -- which, for a rule that may only ever grow, is the right cost.
 */

import * as assert from 'assert';

import { offenceReport, sourceOf, withoutComments } from './sources';

/**
 * Where the barrier lives.
 */
const SANITIZER = 'src/webview/adapters/html-sanitizer.ts';

/**
 * The elements that never survive, as of the start of this feature.
 *
 * An element may be ADDED to the source without touching this list; one that
 * disappears from the source fails the test.
 */
const FORBIDDEN_ELEMENTS = [
    'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
    'link', 'meta', 'base', 'style', 'form', 'input', 'button', 'textarea',
    'select', 'option',
];

/**
 * The attributes whose URL has its scheme checked.
 */
const URL_ATTRIBUTES = ['href', 'src', 'xlink:href', 'action', 'formaction'];

/**
 * The schemes a link or an image may use. This one is the other way round: a
 * scheme ADDED here widens the barrier, and that is what fails.
 */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'vscode:', 'file:'];

/**
 * Reads the members of a declared array of strings out of the source.
 *
 * @param {string} source The source.
 * @param {string} name The name of the constant.
 *
 * @return {string[]} The members.
 */
function declaredList(source: string, name: string): string[] {
    const MATCH = new RegExp(
        `const\\s+${ name }\\s*(?::[^=]+)?=\\s*\\[([^\\]]*)\\]`
    ).exec(withoutComments(source));

    if (!MATCH) {
        throw new Error(
            `'${ name }' is no longer declared as a list in ${ SANITIZER }.` +
            ' The barrier may have been rewritten; re-declare its surface here' +
            ' deliberately.'
        );
    }

    const MEMBERS: string[] = [];
    const STRING = /'([^']*)'|"([^"]*)"/g;

    let member = STRING.exec(MATCH[1]);

    while (member) {
        MEMBERS.push(undefined === member[1] ? member[2] : member[1]);

        member = STRING.exec(MATCH[1]);
    }

    return MEMBERS;
}

suite('The barrier around the content of a card', function () {
    const SOURCE = sourceOf(SANITIZER);

    test('is still there', function () {
        assert.ok(SOURCE, `${ SANITIZER } is missing`);
    });

    test('removes every element it removed before', function () {
        const CURRENT = declaredList(SOURCE!.text, 'FORBIDDEN_ELEMENTS');

        const LOST = FORBIDDEN_ELEMENTS.filter(e => CURRENT.indexOf(e) < 0);

        assert.strictEqual(
            LOST.length, 0,
            offenceReport(
                'An element that used to be removed now goes through',
                LOST
            )
        );
    });

    test('checks the scheme of every attribute it checked before', function () {
        const CURRENT = declaredList(SOURCE!.text, 'URL_ATTRIBUTES');

        const LOST = URL_ATTRIBUTES.filter(a => CURRENT.indexOf(a) < 0);

        assert.strictEqual(
            LOST.length, 0,
            offenceReport(
                'An attribute that used to have its URL checked no longer does',
                LOST
            )
        );
    });

    test('accepts no scheme it did not accept before', function () {
        const CURRENT = declaredList(SOURCE!.text, 'SAFE_SCHEMES');

        const GAINED = CURRENT.filter(s => SAFE_SCHEMES.indexOf(s) < 0);

        assert.strictEqual(
            GAINED.length, 0,
            offenceReport(
                'A scheme was let in. Widening the barrier is a decision of its' +
                ' own, not a side effect of a feature about appearance',
                GAINED
            )
        );
    });

test('still drops every attribute that carries code', function () {
        // the rule is written as a prefix rather than a list, and it is the
        // one that answers for 'onclick', 'onerror' and the sixty others
        assert.ok(
            /indexOf\s*\(\s*['"]on['"]\s*\)/.test(withoutComments(SOURCE!.text)),
            'The rule that drops the event handler attributes is gone from' +
            ` ${ SANITIZER }`
        );
    });
});

/**
 * Where the barrier sits in the order of the conversion.
 *
 * A rule about WHAT may survive is only half of a barrier; the other half is
 * WHEN it is applied, and the second half has no list to compare against.
 *
 * This project got that half wrong once, in a way worth pinning. The task
 * lists were rewritten AFTER the sanitising, and the sanitiser removes every
 * 'input' -- so the rewriting looked for the checkbox Showdown emits, found it
 * already gone, and did nothing at all. It was dead code, and the symptom was
 * not an error: a checklist rendered as loose lines of text with no boxes, and
 * with no way to tell a done item from a pending one. Nobody noticed for two
 * features.
 *
 * The fix was to rewrite BEFORE sanitising, which is only safe because what
 * comes out of the rewriting carries no input either -- the state moves onto a
 * span the sanitiser is then free to inspect like anything else. Both halves of
 * that are checked here: the order, and the absence of an exception for the
 * element that made the order matter.
 */
suite('Where the barrier sits in the conversion', function () {
    const CONVERTER = 'src/webview/adapters/markdown.ts';

    const TEXT = withoutComments(sourceOf(CONVERTER)!.text);

    test('rewrites the task lists before sanitising', function () {
        const DECORATE = TEXT.indexOf('decorateTaskLists(CONTENT)');
        const SANITIZE = TEXT.indexOf('sanitizeTree(CONTENT)');

        assert.ok(DECORATE > -1, `decorateTaskLists is not called in ${ CONVERTER }`);
        assert.ok(SANITIZE > -1, `sanitizeTree is not called in ${ CONVERTER }`);

        assert.ok(
            DECORATE < SANITIZE,
            'The task lists are rewritten after the sanitising again. The' +
            ' checkboxes are removed before the rewriting can read them, so it' +
            ' matches nothing and the board renders a checklist as plain lines' +
            ' -- silently, and with no error anywhere'
        );
    });

    test('puts no input into what it produces', function () {
        //
        // The box of a task is a span carrying the ARIA role of a checkbox,
        // and not an input, precisely so that the order above stays safe and
        // the forbidden list above stays untouched. An input here would mean
        // one of the two had to give.
        //
        assert.ok(
            /createElement\(\s*['"]span['"]\s*\)/.test(TEXT),
            `The task box is no longer built as a span in ${ CONVERTER }`
        );

        assert.ok(
            TEXT.indexOf("createElement('input')") < 0 &&
            TEXT.indexOf('createElement("input")') < 0,
            'An input is being built for the rendered Markdown. The sanitiser' +
            ' removes it, so either it is dead code or the forbidden list was' +
            ' widened to let it through -- and RF-17 forbids the second'
        );
    });
});
