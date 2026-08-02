/**
 * The board, while it is open.
 *
 * Every message from the extension is handled here, and every change to the
 * board leaves here. The order of a change is the one the extraction recorded
 * ('architecture.md#52-alteração-de-cartão') and it is NOT negotiable: the
 * file is written first, the event of the user script is raised afterwards. A
 * script that reads the file during its own event has to find the change
 * already there.
 *
 * The four messages that answer 'onLoaded' may arrive in any order, so nothing
 * here waits for one before handling another (§4 of the bridge contract).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Board, BoardSettings, ColumnKey } from '../domain/types';
import { Bridge } from '../bridge/vscode-bridge';
import {
    CurrentUser,
    IncomingMessage,
    SetBoardData,
    ViewPreferences,
} from '../bridge/messages';
import { findCard, moveCard, updateCard } from '../domain/board-operations';
import { isColumnKey } from '../domain/types';
import { normalizeString, toStringSafe } from '../domain/text';
import { otherCards, withUids } from '../domain/identity';
import { toSavePayload } from '../bridge/save-board';

/**
 * An empty board: what is shown until the extension sends one.
 */
const EMPTY_BOARD: Board = {
    'todo': [],
    'in-progress': [],
    'testing': [],
    'done': [],
};

/**
 * The board and everything that changes it.
 */
export interface BoardControls {
    board: Board;
    settings?: BoardSettings;
    filter: string;
    title: string;
    currentUser?: CurrentUser;
    /**
     * Rises by one whenever the panel becomes visible again, so that a piece
     * of the interface that has to measure itself can do so.
     */
    visibilityTick: number;

    /**
     * Changes the board, saves it, and only then raises the event.
     *
     * @param {Function} change What the board becomes.
     * @param {Function} [event] The event to raise afterwards, if any.
     */
    mutate(
        change: (board: Board) => Board,
        event?: (next: Board, previous: Board) => { name: string; data: unknown } | undefined,
    ): void;

    /**
     * Records the filter expression the user typed.
     */
    setFilter(expression: string): void;

    /**
     * Every card of the board except one, as an event carries it.
     */
    others(uid?: string): Partial<Board>;
}

/**
 * Holds the board and keeps it in step with the extension.
 *
 * @param {Bridge} bridge The bridge to the extension.
 * @param {Function} onPreferences What to do with the stored display state.
 *
 * @return {BoardControls} The board and what changes it.
 */
export function useBoard(
    bridge: Bridge,
    onPreferences: (preferences: Partial<ViewPreferences>) => void,
): BoardControls {
    const [board, setBoard] = useState<Board>(EMPTY_BOARD);
    const [settings, setSettings] = useState<BoardSettings | undefined>(undefined);
    const [filter, setFilterValue] = useState('');
    const [title, setTitle] = useState('');
    const [currentUser, setCurrentUser] = useState<CurrentUser | undefined>(undefined);
    const [visibilityTick, setVisibilityTick] = useState(0);

    // the handler of a message must always see the board as it is now, and a
    // listener registered once would close over the board of its first render
    const BOARD_REF = useRef(board);
    BOARD_REF.current = board;

    const SAVE = useCallback((next: Board) => {
        bridge.saveBoard(toSavePayload(next));
    }, [bridge]);

    const MUTATE = useCallback<BoardControls['mutate']>((change, event) => {
        const PREVIOUS = BOARD_REF.current;
        const NEXT = change(PREVIOUS);

        BOARD_REF.current = NEXT;
        setBoard(NEXT);

        SAVE(NEXT);

        if (event) {
            const RAISED = event(NEXT, PREVIOUS);

            if (RAISED) {
                bridge.raiseEvent(RAISED.name, RAISED.data);
            }
        }
    }, [bridge, SAVE]);

    const HANDLE = useCallback((message: IncomingMessage) => {
        switch (message.command) {
            case 'setBoard':
                {
                    const DATA = message.data as SetBoardData | undefined;

                    if (!DATA) {
                        return;
                    }

                    const NEXT = withUids(DATA.cards || EMPTY_BOARD);

                    BOARD_REF.current = NEXT;
                    setBoard(NEXT);
                    setSettings(DATA.settings);
                    setFilterValue(toStringSafe(DATA.filter));
                }
                break;

            case 'setTitleAndFilePath':
                setTitle(toStringSafe(message.data?.title));
                break;

            case 'setCurrentUser':
                setCurrentUser(message.data || undefined);
                break;

            case 'webviewIsVisible':
                setVisibilityTick(tick => tick + 1);
                break;

            case 'setViewPreferences':
                if (message.data) {
                    onPreferences(message.data);
                }
                break;

            case 'moveCardTo':
                {
                    const UID = toStringSafe(message.data?.uid).trim();
                    const TO = normalizeString(message.data?.column);

                    if ('' === UID || !isColumnKey(TO)) {
                        return;
                    }

                    moveByCommand(UID, TO as ColumnKey, MUTATE, BOARD_REF);
                }
                break;

            case 'setCardTag':
                {
                    const UID = toStringSafe(message.data?.uid).trim();

                    if ('' === UID || !findCard(BOARD_REF.current, UID)) {
                        return;
                    }

                    const TAG = message.data?.tag;

                    MUTATE(current => updateCard(
                        current, UID, card => ({ ...card, tag: TAG })
                    ));
                }
                break;
        }
    }, [MUTATE, onPreferences]);

    useEffect(() => {
        return bridge.onMessage(HANDLE);
    }, [bridge, HANDLE]);

    // Nothing arrives until the extension is told the panel is ready, and it
    // is told ONCE: the extension answers every announcement by reading the
    // board file from disk, so an announcement tied to the handler above --
    // which is rebuilt whenever the display state changes -- turned a change
    // of theme into a re-read, and the answer to it into the next
    // announcement.
    useEffect(() => {
        bridge.onLoaded();
    }, [bridge]);

    const SET_FILTER = useCallback((expression: string) => {
        setFilterValue(expression);

        bridge.saveFilter(expression);
    }, [bridge]);

    return useMemo<BoardControls>(() => ({
        board: board,
        settings: settings,
        filter: filter,
        title: title,
        currentUser: currentUser,
        visibilityTick: visibilityTick,
        mutate: MUTATE,
        setFilter: SET_FILTER,
        others: (uid?: string) => otherCards(
            board,
            uid ? findCard(board, uid) : undefined
        ),
    }), [
        board, settings, filter, title, currentUser, visibilityTick,
        MUTATE, SET_FILTER,
    ]);
}

/**
 * Moves a card because a script asked for it.
 *
 * A move to the column the card is already in does nothing at all — no save,
 * no event — which is what 'board.js:1944' did by returning early.
 */
function moveByCommand(
    uid: string,
    to: ColumnKey,
    mutate: BoardControls['mutate'],
    boardRef: { current: Board },
): void {
    const BEFORE = boardRef.current;
    const CARD = findCard(BEFORE, uid);

    if (!CARD) {
        return;
    }

    const FROM = (Object.keys(BEFORE) as ColumnKey[])
        .find(column => (BEFORE[column] || []).indexOf(CARD) > -1);

    if (!FROM || FROM === to) {
        return;
    }

    mutate(
        current => moveCard(current, uid, to),
        (next) => ({
            name: 'card_moved',
            data: {
                card: CARD,
                from: FROM,
                others: otherCards(next, CARD),
                to: to,
            },
        })
    );
}
