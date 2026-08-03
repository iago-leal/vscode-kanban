/**
 * The bridge between the Webview and the extension keeps its shape (RF-03).
 *
 * The board of version 1.33.1 spoke fourteen commands, feature 001 added two,
 * and this feature was to add none. The script of the user does not see the
 * interface at all -- it sees this protocol -- so a command renamed or dropped
 * while the board was being repainted would be a break with nothing on the
 * screen to show for it.
 *
 * The names are transcribed here from
 * '001-interface-react-tema-e-done/interfaces/webview-bridge.md', which is the
 * contract, and checked against the code that sends and receives them. Both
 * directions matter: a command the contract names and the code never sends is
 * a promise nobody keeps, and a command the code sends without the contract
 * naming it is a promise nobody made.
 *
 * This is the automated half of action T064. The other half -- watching the
 * messages go by with a board open -- needs a running editor.
 */

import * as assert from 'assert';

import { offenceReport, sourceOf } from './sources';

/**
 * What the Webview sends to the extension.
 */
const OUTGOING = [
    'log',
    'onLoaded',
    'openExternalUrl',
    'openKnownUrl',
    'raiseEvent',
    'reloadBoard',
    'saveBoard',
    'saveFilter',
    'saveViewPreferences',
];

/**
 * What the extension sends to the Webview.
 */
const INCOMING = [
    'setBoard',
    'setTitleAndFilePath',
    'setCurrentUser',
    'moveCardTo',
    'setCardTag',
    'webviewIsVisible',
    'setViewPreferences',
];

/**
 * Where each direction is written down.
 */
const SENDER = 'src/webview/bridge/vscode-bridge.ts';
const RECEIVER = 'src/webview/bridge/messages.ts';

/**
 * Every command named in a file, as the code writes them.
 */
function commandsIn(path: string): Set<string> {
    const SOURCE = sourceOf(path);

    assert.ok(SOURCE, `${ path } is missing`);

    const FOUND = new Set<string>();

    const NAMED = /command:\s*'([a-zA-Z]+)'/g;

    let match = NAMED.exec(SOURCE!.text);

    while (match) {
        FOUND.add(match[1]);

        match = NAMED.exec(SOURCE!.text);
    }

    return FOUND;
}

suite('The protocol of the bridge', function () {
    test('counts sixteen commands, as it did before this feature', function () {
        assert.strictEqual(
            OUTGOING.length + INCOMING.length, 16,
            'This feature adds no command and removes none. A change here is a' +
            ' change to what the script of the user may rely on (RF-03)'
        );
    });

    test('sends every command the contract names, and no other', function () {
        const SENT = commandsIn(SENDER);

        const MISSING = OUTGOING.filter(name => !SENT.has(name));
        const UNEXPECTED = Array.from(SENT).filter(name => OUTGOING.indexOf(name) < 0);

        assert.strictEqual(
            MISSING.length + UNEXPECTED.length, 0,
            offenceReport(
                `commands of ${ SENDER } out of step with the contract`,
                MISSING.map(n => `'${ n }' is promised and never sent`).concat(
                    UNEXPECTED.map(n => `'${ n }' is sent and never promised`)
                )
            )
        );
    });

    test('receives every command the contract names, and no other', function () {
        const RECEIVED = commandsIn(RECEIVER);

        const MISSING = INCOMING.filter(name => !RECEIVED.has(name));
        const UNEXPECTED = Array.from(RECEIVED).filter(name => INCOMING.indexOf(name) < 0);

        assert.strictEqual(
            MISSING.length + UNEXPECTED.length, 0,
            offenceReport(
                `commands of ${ RECEIVER } out of step with the contract`,
                MISSING.map(n => `'${ n }' is promised and never handled`).concat(
                    UNEXPECTED.map(n => `'${ n }' is handled and never promised`)
                )
            )
        );
    });

    test('is spoken from one place on each side', function () {
        // a component that reaches for 'postMessage' of its own is a second
        // place the protocol has to be kept in step, and the reason the
        // protocol survived feature 001 intact is that there was never one
        const OFFENCES: string[] = [];

        for (const FILE of ['src/webview/ui', 'src/webview/domain']) {
            const SOURCE = sourceOf(`${ FILE }/App.tsx`) || sourceOf(`${ FILE }/types.ts`);

            if (SOURCE && SOURCE.text.indexOf('postMessage') > -1) {
                OFFENCES.push(`${ SOURCE.path } speaks to the extension directly`);
            }
        }

        assert.strictEqual(
            OFFENCES.length, 0, offenceReport('places bypassing the bridge', OFFENCES)
        );
    });
});
