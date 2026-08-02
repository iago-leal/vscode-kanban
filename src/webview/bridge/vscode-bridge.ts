/**
 * The one way in and out of the Webview.
 *
 * Every message to the extension leaves through here, and every message from
 * it arrives here. No component calls 'postMessage' on its own, which is what
 * keeps the frozen protocol of 'messages.ts' checkable in a single file.
 *
 * Nothing in this file throws at its caller. A board that cannot reach the
 * extension is a board whose buttons stop working, and the user finds out from
 * a log entry with a name — never from a blank panel and a silent 'catch'.
 */

import {
    CardEventData,
    IncomingMessage,
    Message,
    ViewPreferences,
    ViewPreferencesDelta,
} from './messages';
import { Board } from '../domain/types';
import { LogPort } from '../domain/ports';

/**
 * What the host of the Webview offers.
 */
interface VsCodeApi {
    postMessage(message: Message): void;
    getState(): unknown;
    setState(state: unknown): void;
}

/**
 * What the interface talks to the extension through.
 */
export interface Bridge {
    /**
     * Writes to the log of the extension.
     */
    log: LogPort;

    /**
     * Announces that the Webview finished loading and is ready to be filled.
     */
    onLoaded(): void;

    /**
     * Asks for the board to be read from disk again.
     */
    reloadBoard(): void;

    /**
     * Saves the board. The whole board travels, as it always has.
     */
    saveBoard(board: Board): void;

    /**
     * Saves the filter expression the user typed.
     */
    saveFilter(expression: string): void;

    /**
     * Asks for an address to be opened, after the user confirms it.
     */
    openExternalUrl(url: string, text: string): void;

    /**
     * Asks for one of the addresses the extension knows to be opened; those
     * need no confirmation.
     */
    openKnownUrl(id: string): void;

    /**
     * Raises one of the events of the board towards the script of the user.
     */
    raiseEvent(name: string, data: CardEventData | unknown): void;

    /**
     * Records a change of theme, hiding, collapsing or layout.
     *
     * The payload is a delta: what is not named keeps its stored value.
     */
    saveViewPreferences(delta: ViewPreferencesDelta): void;

    /**
     * Listens to the extension.
     *
     * @return {Function} Stops listening.
     */
    onMessage(handler: (message: IncomingMessage) => void): () => void;

    /**
     * Reads the state kept for this panel, used to paint before the extension
     * answers.
     */
    getState(): Partial<ViewPreferences> | undefined;

    /**
     * Keeps a state for this panel.
     */
    setState(state: Partial<ViewPreferences>): void;
}

/**
 * Builds the bridge.
 *
 * @return {Bridge} The bridge.
 */
export function createBridge(): Bridge {
    const API = acquireApi();

    const LOG: LogPort = (message: string) => {
        post(API, { command: 'log', data: { message: message } }, undefined);
    };

    return {
        log: LOG,

        onLoaded: () => post(API, { command: 'onLoaded' }, LOG),

        reloadBoard: () => post(API, { command: 'reloadBoard' }, LOG),

        saveBoard: (board: Board) => post(
            API, { command: 'saveBoard', data: board }, LOG
        ),

        saveFilter: (expression: string) => post(
            API, { command: 'saveFilter', data: expression }, LOG
        ),

        openExternalUrl: (url: string, text: string) => post(
            API, { command: 'openExternalUrl', data: { url: url, text: text } }, LOG
        ),

        openKnownUrl: (id: string) => post(
            API, { command: 'openKnownUrl', data: id }, LOG
        ),

        raiseEvent: (name: string, data: unknown) => post(
            API, { command: 'raiseEvent', data: { name: name, data: data } }, LOG
        ),

        saveViewPreferences: (delta: ViewPreferencesDelta) => post(
            API, { command: 'saveViewPreferences', data: delta }, LOG
        ),

        onMessage: (handler: (message: IncomingMessage) => void): (() => void) => {
            const LISTENER = (event: MessageEvent) => {
                const MESSAGE = event.data as IncomingMessage;

                if (!MESSAGE || 'string' !== typeof MESSAGE.command) {
                    return;
                }

                try {
                    handler(MESSAGE);
                } catch (e) {
                    LOG(`bridge.onMessage().error[${ MESSAGE.command }]: ${ String(e) }`);
                }
            };

            window.addEventListener('message', LISTENER);

            return () => window.removeEventListener('message', LISTENER);
        },

        getState: (): Partial<ViewPreferences> | undefined => {
            if (!API) {
                return undefined;
            }

            try {
                const STATE = API.getState();

                return STATE && 'object' === typeof STATE
                    ? STATE as Partial<ViewPreferences>
                    : undefined;
            } catch (e) {
                LOG(`bridge.getState().error: ${ String(e) }`);

                return undefined;
            }
        },

        setState: (state: Partial<ViewPreferences>): void => {
            if (!API) {
                return;
            }

            try {
                API.setState(state);
            } catch (e) {
                LOG(`bridge.setState().error: ${ String(e) }`);
            }
        },
    };
}

/**
 * Takes hold of the host API.
 *
 * 'acquireVsCodeApi' may be called once per panel, so the document calls it
 * and leaves the result behind; calling it again would throw.
 */
function acquireApi(): VsCodeApi | undefined {
    const SCOPE = globalThis as unknown as {
        vscode?: VsCodeApi;
        acquireVsCodeApi?: () => VsCodeApi;
    };

    if (SCOPE.vscode) {
        return SCOPE.vscode;
    }

    if (!SCOPE.acquireVsCodeApi) {
        return undefined;
    }

    try {
        SCOPE.vscode = SCOPE.acquireVsCodeApi();

        return SCOPE.vscode;
    } catch (e) {
        console.error(`bridge.acquireApi().error: ${ String(e) }`);

        return undefined;
    }
}

/**
 * Sends a message, reporting a failure instead of swallowing it.
 *
 * The log itself passes no logger, because a log entry about a log entry that
 * could not be written has nowhere left to go.
 */
function post(
    api: VsCodeApi | undefined,
    message: Message,
    log: LogPort | undefined,
): void {
    if (!api) {
        if (log) {
            log(`bridge.post(): no host for '${ message.command }'`);
        }

        return;
    }

    try {
        api.postMessage(message);
    } catch (e) {
        if (log) {
            log(`bridge.post().error[${ message.command }]: ${ String(e) }`);
        }
    }
}
