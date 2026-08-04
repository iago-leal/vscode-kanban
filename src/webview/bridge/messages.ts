/**
 * The messages that cross between the Webview and the extension.
 *
 * The fourteen commands that already existed are reproduced here name by name
 * and field by field. They are FROZEN: an event script written against the
 * board of version 1.33.1 keeps working, so nothing here may be renamed,
 * reshaped or dropped (RF-04).
 *
 * Two commands are new, 'saveViewPreferences' and 'setViewPreferences', and
 * both are optional in the strict sense: a board that never sees them opens on
 * the defaults instead of failing.
 */

import {
    Board,
    BoardCard,
    BoardSettings,
    ColumnKey,
    ThemePreference,
    ViewMode,
} from '../domain/types';

export { BoardSettings };

/**
 * The envelope, unchanged in both directions: a name and a payload, with no
 * correlation id and no acknowledgement.
 */
export interface Message<TData = unknown> {
    command: string;
    data?: TData;
}

/**
 * The payload of 'setBoard'.
 */
export interface SetBoardData {
    cards: Board;
    settings?: BoardSettings;
    filter?: string;
}

/**
 * The payload of 'setTitleAndFilePath'.
 */
export interface SetTitleData {
    title?: string;
    filePath?: string;
}

/**
 * The payload of 'setCurrentUser'.
 */
export interface CurrentUser {
    name?: string;
}

/**
 * The payload of 'moveCardTo': a card addressed by its identity of the
 * session, and the column it should end in.
 */
export interface MoveCardData {
    uid?: string;
    column?: string;
}

/**
 * The payload of 'setCardTag'.
 */
export interface SetCardTagData {
    uid?: string;
    tag?: unknown;
}

/**
 * The payload of 'setViewPreferences': always complete, the defaults already
 * filled in by the extension.
 */
export interface ViewPreferences {
    theme: ThemePreference;
    hideDone: boolean;
    collapsedColumns: ColumnKey[];
    viewMode: ViewMode;
}

/**
 * The payload of 'saveViewPreferences': a delta, never a whole state. A field
 * left out keeps the value that was stored.
 */
export type ViewPreferencesDelta = Partial<ViewPreferences>;

/**
 * What an event script receives beside the card itself.
 */
export interface CardEventData {
    card: BoardCard;
    column?: ColumnKey;
    from?: ColumnKey;
    to?: ColumnKey;
    /**
     * Every other card of the board, grouped by the column it is in.
     *
     * A column with no other card is left out entirely, which is what the
     * board has always sent. It is a large payload, and it is sent anyway:
     * scripts already read it (finding E6 of the extraction), so dropping it
     * would break them.
     */
    others?: Partial<Board>;
}

/**
 * What the extension may send.
 */
export type IncomingMessage =
    | Message<SetBoardData> & { command: 'setBoard' }
    | Message<SetTitleData> & { command: 'setTitleAndFilePath' }
    | Message<CurrentUser> & { command: 'setCurrentUser' }
    | Message<MoveCardData> & { command: 'moveCardTo' }
    | Message<SetCardTagData> & { command: 'setCardTag' }
    | Message<undefined> & { command: 'webviewIsVisible' }
    | Message<ViewPreferences> & { command: 'setViewPreferences' };

/**
 * The name of every command the extension may send.
 */
export type IncomingCommand = IncomingMessage['command'];
