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

import * as _ from 'lodash';
import * as FSExtra from 'fs-extra';
import * as HtmlEntities from 'html-entities';
import * as OS from 'os';
import * as Path from 'path';
import * as URL from 'url';
import * as vsckb from './extension';
import * as vsckb_html from './html';
import * as vscode from 'vscode';
import * as vscode_helpers from 'vscode-helpers';

/**
 * A board.
 */
export interface Board {
    /**
     * The cards of 'Todo' section.
     */
    'todo': BoardCard[];
    /**
     * The cards of 'In Progress' section.
     */
    'in-progress': BoardCard[];
    /**
     * The cards of 'Testing' section.
     */
    'testing': BoardCard[];
    /**
     * The cards of 'Done' section.
     */
    'done': BoardCard[];
}

/**
 * A board card.
 */
export interface BoardCard {
    /**
     * The user, the card is assigned to.
     */
    assignedTo?: {
        /**
         * The name of the user.
         */
        name?: string;
    };
    /**
     * The user's category.
     */
    category?: string;
    /**
     * The time, the card has been created.
     */
    creation_time?: string;
    /**
     * The (optional) description (data).
     */
    description?: BoardCardContentValue;
    /**
     * The (optional) detail (data).
     */
    details?: BoardCardContentValue;
    /**
     * The ID of the card.
     */
    id?: string;
    /**
     * The priority.
     */
    prio?: number;
    /**
     * A list of one or more card IDs that card references to.
     */
    references?: string[];
    /**
     * User defined data from scripts, e.g.
     */
    tag?: any;
    /**
     * The title.
     */
    title: string;
    /**
     * The type.
     */
    type?: string;
}

/**
 * Data of a "board card content".
 */
export interface BoardCardContent {
    /**
     * The content.
     */
    content?: string;
    /**
     * The MIME type.
     */
    mime?: string;
}

/**
 * Possible values for a "board card content".
 */
export type BoardCardContentValue = string | BoardCardContent;

/**
 * Board settings.
 */
export interface BoardSettings {
    /**
     * Indicates to show an 'execute' button on each card or not.
     */
    canExecute?: boolean;
    /**
     * Enable time tracking or not.
     */
    canTrackTime?: boolean;
    /**
     * Settings for columns.
     */
    columns?: {
        /**
         * Settings for 'Done' column.
         */
        done?: ColumnSettings;
        /**
         * Settings for 'In Progress' column.
         */
        'in-progress'?: ColumnSettings;
        /**
         * Settings for 'Testing' column.
         */
        testing?: ColumnSettings;
        /**
         * Settings for 'Todo' column.
         */
        todo?: ColumnSettings;
    };
    /**
     * Do not show 'track time' button, if a card is stored in 'Todo' or 'Done'.
     */
    hideTimeTrackingIfIdle?: boolean;
    /**
     * Use integer values as IDs for cards instead.
     */
    simpleIDs?: boolean;
}

/**
 * Data of a 'card created' event.
 */
export interface CardCreatedEventData extends EventDataWithUniqueId {
    /**
     * The new card.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been created.
     */
    column: string;
}

/**
 * Data of a 'card deleted' event.
 */
export interface CardDeletedEventData extends EventDataWithUniqueId {
    /**
     * The new card.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been deleted.
     */
    column: string;
}

/**
 * Data of a 'card moved' event.
 */
export interface CardMovedEventData extends EventDataWithUniqueId {
    /**
     * The moved card.
     */
    card: BoardCard;
    /**
     * The name of the area from where the card has been moved.
     */
    from: string;
    /**
     * The name of the area where the card has been moved to.
     */
    to: string;
}

/**
 * Data of a 'card updated' event.
 */
export interface CardUpdatedEventData extends EventDataWithUniqueId {
    /**
     * The card with the current data.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been updated.
     */
    column: string;
    /**
     * The card with the old data.
     */
    oldCard: BoardCard;
}

/**
 * Data of a 'column cleared' event.
 */
export interface ColumnClearedEventData {
    /**
     * The cards that have been removed.
     */
    cards: BoardCard[];
    /**
     * The name of the column that has been cleared.
     */
    column: string;
}

/**
 * Settings for a column.
 */
export interface ColumnSettings {
    /**
     * The display name for the column.
     */
    name?: string;
}

/**
 * Event data with an unique ID.
 */
export interface EventDataWithUniqueId {
    /**
     * The unique ID.
     */
    readonly uid: string;
}

/**
 * An event listener.
 */
export type EventListener = (context: EventListenerContext) => any;

/**
 * A context for an event listener.
 */
export interface EventListenerContext {
    /**
     * The underlying event data.
     */
    data: any;
    /**
     * The name of the event.
     */
    name: string;
    /**
     * Post a message / command (to the underlying webview).
     *
     * @param {string} command The name of the command.
     * @param {any} [data] The data for the command.
     *
     * @return {PromiseLike<boolean>} The promise that indicates if operation was successful or not.
     */
    postMessage(command: string, data?: any): PromiseLike<boolean>;
}

/**
 * Options for opening a board.
 */
export interface OpenBoardOptions {
    /**
     * Additional, allowed resource directories for the web view(s).
     */
    additionalResourceRoots?: vscode.Uri | vscode.Uri[];
    /**
     * The function that returns the underlying file to use.
     */
    fileResolver?: () => vscode.Uri;
    /**
     * The Git client.
     */
    git?: any;
    /**
     * Loads a filter.
     */
    loadFilter?: () => string | PromiseLike<string>;
    /**
     * Do not detect username via source control manager.
     */
    noScmUser?: boolean;
    /**
     * Do not detect username of operating system.
     */
    noSystemUser?: boolean;
    /**
     * A listener for a 'save board' event.
     */
    saveBoard?: SaveBoardEventListener;
    /**
     * A listener for a 'save board filter' event.
     */
    saveFilter?: SaveBoardFilterEventListener;
    /**
     * Loads how the board should be displayed.
     *
     * It is optional: without it the board opens on its defaults, which is
     * what keeps the two new commands of the bridge from being required for
     * the board to work.
     */
    loadViewPreferences?: () => any | PromiseLike<any>;
    /**
     * Records a change of theme, hiding, collapsing or layout.
     *
     * The payload is a delta: what it does not mention keeps its stored value.
     */
    saveViewPreferences?: (preferences: any) => any | PromiseLike<any>;
    /**
     * The settings for the board.
     */
    settings?: BoardSettings;
    /**
     * Display options for the tab of the underlying view.
     */
    showOptions?: vscode.ViewColumn;
    /**
     * A listener for an event.
     */
    raiseEvent?: EventListener;
    /**
     * The title for the view.
     */
    title?: string;
}

interface RaiseEvent {
    data?: any;
    name: string;
}

/**
 * An listener for a 'save board' event.
 *
 * @param {Board} board The board to save.
 */
export type SaveBoardEventListener = (board: Board) => any;

/**
 * An listener for a 'save board filter' event.
 *
 * @param {string} filter The filter to save.
 * @param {Board} board The underling board.
 */
export type SaveBoardFilterEventListener = (filter: string) => any;

/**
 * Data of a 'track time' event.
 */
export interface TrackTimeEventData extends EventDataWithUniqueId {
    /**
     * The card with the current data.
     */
    card: BoardCard;
    /**
     * The name of the column where the card has been updated.
     */
    column: string;
}

interface WebViewMessage extends vsckb.WebViewMessage {
}

/**
 * List of board card columns.
 */
export const BOARD_COLMNS: ReadonlyArray<string> = [
    'todo',
    'in-progress',
    'testing',
    'done',
];
const KNOWN_URLS = {
    'filter-help': 'https://github.com/mkloubert/vscode-kanban#filter-',
    'github': 'https://github.com/mkloubert/vscode-kanban',
    'mermaid-help': 'https://mermaidjs.github.io',
    'markdown-help': 'https://github.com/showdownjs/showdown/wiki/Showdown\'s-Markdown-syntax',
    'paypal': 'https://paypal.me/MarcelKloubert',
    'twitter': 'https://twitter.com/mjkloubert',
};

/**
 * A kanban board.
 */
export class KanbanBoard extends vscode_helpers.DisposableBase {
    private _openOptions: OpenBoardOptions;
    private _panel: vscode.WebviewPanel;
    private _saveBoardEventListeners: SaveBoardEventListener[];
    private _saveBoardFilterEventListeners: SaveBoardFilterEventListener[];

    /**
     * Gets the board file to use.
     */
    public get file(): vscode.Uri {
        const RESOLVER = this.openOptions.fileResolver;
        if (RESOLVER) {
            return RESOLVER();
        }
    }

    private generateHTML() {
        const GET_RES_URI = (p: string) => {
            return this.getResourceUri(p);
        };

        //
        // The document is now a shell: a mount point and the bundle.
        //
        // What used to stand here were about 470 lines of literal markup --
        // the four columns, the three modals and the header buttons -- built
        // by string concatenation and wired by jQuery. All of it is React now,
        // under 'src/webview/', where it can be read, typed and tested.
        //
        // The one thing the workspace may still contribute is its own
        // stylesheet, '.vscode/vscode-kanban.css'.
        //
        return vsckb_html.generateHtmlDocument({
            getFooter: () => {
                const CUSTOM_STYLE_FILE = GET_RES_URI('vscode-kanban.css');

                return CUSTOM_STYLE_FILE
                    ? `<link rel="stylesheet" href="${ CUSTOM_STYLE_FILE }">`
                    : '';
            },
            getResourceUri: GET_RES_URI,
            name: 'board',
            // the bundled interface, built by 'scripts/build-webview.js'
            bundleFile: 'webview/main.js',
        });
    }

    private getWebViewResourceUris(): vscode.Uri[] {
        const HOME_DIR = vscode.Uri.file(
            Path.resolve(
                OS.homedir()
            )
        );

        return vscode_helpers.asArray( this.openOptions.additionalResourceRoots )
                             .concat( HOME_DIR )
                             .concat( vsckb.getWebViewResourceUris() );
    }

    /**
     * Returns an URI from the 'resources' directory.
     *
     * @param {string} p The (relative) path.
     *
     * @return {vscode.Uri} The URI.
     */
    public getResourceUri(p: string): vscode.Uri {
        p = vscode_helpers.toStringSafe(p);

        let u: vscode.Uri;

        for (const R of this.getWebViewResourceUris()) {
            const PATH_TO_CHECK = Path.resolve(
                Path.join(R.fsPath, p)
            );

            u = vscode.Uri.file( PATH_TO_CHECK ).with({
                scheme: 'vscode-resource'
            });

            try {
                if (vscode_helpers.isFileSync(PATH_TO_CHECK, false)) {
                    break;
                }
            } catch { }
        }

        return u;
    }

    /**
     * Initializes the board.
     */
    public async initialize() {
        this._saveBoardEventListeners = [];
        this._saveBoardFilterEventListeners = [];
    }

    /**
     * Is invoked after the underlying panel has been disposed.
     */
    protected onDispose() {
        this._saveBoardEventListeners = [];
        this._saveBoardFilterEventListeners = [];

        vscode_helpers.tryDispose(this._panel);
    }

    private async onLoaded() {
        const FILE = this.file;
        if (!FILE) {
            return;
        }

        // this one is sent without waiting for the board: the Webview may
        // receive the four answers in any order, and paints on its own cached
        // state until they arrive
        const LOAD_PREFERENCES = this.openOptions.loadViewPreferences;
        if (LOAD_PREFERENCES) {
            try {
                const PREFERENCES = await Promise.resolve(
                    LOAD_PREFERENCES()
                );

                if (PREFERENCES) {
                    await this.postMessage('setViewPreferences', PREFERENCES);
                }
            } catch (e) {
                vsckb.showError(e);
            }
        }

        await this.reloadBoard();

        await this.postMessage('setTitleAndFilePath', {
            file: Path.resolve(this.file.fsPath),
            title: this.openOptions.title,
        });

        let userName: string;

        if (this.openOptions.git) {
            try {
                const GIT_FOLDER = Path.resolve(
                    Path.join(this.openOptions.git.cwd, '.git')
                );

                if (await vscode_helpers.isDirectory(GIT_FOLDER, false)) {
                    // only, if git repo exists

                    // try get username from Git?
                    if (!vscode_helpers.toBooleanSafe(this.openOptions.noScmUser)) {
                        try {
                            userName = vscode_helpers.toStringSafe(
                                this.openOptions.git.execSync([ 'config', 'user.name' ])
                            ).trim();
                        } catch { }
                    }
                }
            } catch { }
        }

        if (!vscode_helpers.toBooleanSafe(this.openOptions.noSystemUser)) {
            if (vscode_helpers.isEmptyString(userName)) {
                // now try get username from operating system

                try {
                    userName = OS.userInfo().username;
                } catch { }
            }
        }

        if (!vscode_helpers.isEmptyString(userName)) {
            await this.postMessage('setCurrentUser', {
                name: vscode_helpers.toStringSafe(userName).trim(),
            });
        }
    }

    /**
     * Adds a listener for a 'save board' event.
     *
     * @param {SaveBoardEventListener} listener The listener to add.
     *
     * @return {this}
     */
    public onSaveBoard(listener: SaveBoardEventListener) {
        if (listener) {
            this._saveBoardEventListeners.push(
                listener
            );
        }

        return this;
    }

    /**
     * Adds a listener for a 'save board' event.
     *
     * @param {SaveBoardEventListener} listener The listener to add.
     *
     * @return {this}
     */
    public onSaveBoardFilter(listener: SaveBoardFilterEventListener) {
        if (listener) {
            this._saveBoardFilterEventListeners.push(
                listener
            );
        }

        return this;
    }

    /**
     * Opens the board.
     *
     * @param {OpenBoardOptions} [opts] The options.
     *
     * @return {Promise<boolean>} The promise that indicates if operation was successful or not.
     */
    public async open(opts?: OpenBoardOptions) {
        if (this._panel) {
            return false;
        }

        if (_.isNil(opts)) {
            opts = <any>{};
        }

        let webViewTitle = 'Kanban Board';

        const TITLE = vscode_helpers.toStringSafe(opts.title).trim();
        if ('' !== TITLE) {
            webViewTitle = `${ webViewTitle } (${ TITLE })`;
        }

        let showOptions = opts.showOptions;
        if (_.isNil(showOptions)) {
            showOptions = vscode.ViewColumn.One;
        }

        let newPanel: vscode.WebviewPanel;
        try {
            this._openOptions = opts;

            newPanel = vscode.window.createWebviewPanel(
                'vscodeKanbanBoard',
                webViewTitle,
                showOptions,
                {
                    enableCommandUris: true,
                    enableFindWidget: true,
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: this.getWebViewResourceUris(),
                }
            );

            newPanel.webview.onDidReceiveMessage((msg: WebViewMessage) => {
                try {
                    let action: Function;

                    switch (msg.command) {
                        case 'log':
                            action = () => {
                                if (!_.isNil(msg.data) && !_.isNil(msg.data.message)) {
                                    try {
                                        console.log(
                                            JSON.parse(
                                                vscode_helpers.toStringSafe(msg.data.message)
                                            )
                                        );
                                    } catch (e) { }

                                    try {
                                        vsckb.getLogger().debug(
                                            JSON.parse(
                                                vscode_helpers.toStringSafe(msg.data.message)
                                            ),
                                            'WebView'
                                        );
                                    } catch (e) { }
                                }
                            };
                            break;

                        case 'onLoaded':
                            action = async () => {
                                await this.onLoaded();
                            };
                            break;

                        case 'openExternalUrl':
                            {
                                const URL_TO_OPEN = vscode_helpers.toStringSafe(msg.data.url);
                                const URL_TEXT = vscode_helpers.toStringSafe(msg.data.text).trim();

                                if (!vscode_helpers.isEmptyString(URL_TO_OPEN)) {
                                    action = async() => {
                                        // check if "parsable"
                                        URL.parse( URL_TO_OPEN );

                                        let urlPromptText: string;
                                        if ('' === URL_TEXT) {
                                            urlPromptText = `'${ URL_TO_OPEN }'`;
                                        } else {
                                            urlPromptText = `'${ URL_TEXT }' (${ URL_TO_OPEN })`;
                                        }

                                        const SELECTED_ITEM = await vscode.window.showWarningMessage<vsckb.ActionMessageItem>(
                                            `Do you really want to open the URL ${ urlPromptText }?`,
                                            {
                                                title: 'Yes',
                                                action: async () => {
                                                    await vsckb.open(URL_TO_OPEN);
                                                }
                                            },
                                            {
                                                title: 'No',
                                                isCloseAffordance: true
                                            }
                                        );

                                        if (SELECTED_ITEM) {
                                            if (SELECTED_ITEM.action) {
                                                await SELECTED_ITEM.action();
                                            }
                                        }
                                    };
                                }
                            }
                            break;

                        case 'openKnownUrl':
                            const KU = KNOWN_URLS[ vscode_helpers.normalizeString(msg.data) ];
                            if (!_.isNil(KU)) {
                                action = async () => {
                                    await vsckb.open( KU );
                                };
                            }
                            break;

                        case 'raiseEvent':
                            const EVENT_DATA: RaiseEvent = msg.data;
                            if (EVENT_DATA) {
                                action = async () => {
                                    await this.raiseEvent(
                                        vscode_helpers.normalizeString(EVENT_DATA.name),
                                        EVENT_DATA.data,
                                    );
                                };
                            }
                            break;

                        case 'reloadBoard':
                            action = async () => {
                                await this.reloadBoard();
                            };
                            break;

                        case 'saveBoard':
                            action = async () => {
                                const BOARD_TO_SAVE: Board = msg.data;
                                if (BOARD_TO_SAVE) {
                                    const LISTENERS = vscode_helpers.asArray(this._saveBoardEventListeners);
                                    for (const L of LISTENERS) {
                                        try {
                                            await Promise.resolve(
                                                L(BOARD_TO_SAVE)
                                            );
                                        } catch (e) {
                                            vsckb.showError(e);
                                        }
                                    }
                                }
                            };
                            break;

                        case 'saveViewPreferences':
                            action = async () => {
                                // how the board is displayed never touches the
                                // board file and never raises an event towards
                                // the script of the user
                                const SAVE = this.openOptions.saveViewPreferences;
                                if (SAVE && msg.data) {
                                    try {
                                        await Promise.resolve(
                                            SAVE(msg.data)
                                        );
                                    } catch (e) {
                                        vsckb.showError(e);
                                    }
                                }
                            };
                            break;

                        case 'saveFilter':
                            action = async () => {
                                const FILTER = vscode_helpers.toStringSafe( msg.data );

                                const LISTENERS = vscode_helpers.asArray(this._saveBoardFilterEventListeners);
                                for (const L of LISTENERS) {
                                    try {
                                        await Promise.resolve(
                                            L(FILTER)
                                        );
                                    } catch (e) {
                                        vsckb.showError(e);
                                    }
                                }
                            };
                            break;
                    }

                    if (action) {
                        Promise.resolve( action() ).then(() => {
                        }, (err) => {
                            vsckb.showError(err);
                        });
                    }
                } catch (e) {
                    vsckb.showError(e);
                }
            });

            newPanel.onDidChangeViewState((e) => {
                try {
                    if (e.webviewPanel.visible) {
                        (async () => {
                            await this.postMessage('webviewIsVisible');
                        })().then(() => {
                        }, () => {
                        });
                    }
                } catch { }
            });

            newPanel.webview.html = this.generateHTML();

            this._panel = newPanel;

            return true;
        } catch (e) {
            vscode_helpers.tryDispose(newPanel);
            this._openOptions = null;

            throw e;
        }
    }

    /**
     * Gets the options for opening the board.
     */
    public get openOptions(): OpenBoardOptions {
        return this._openOptions;
    }

    /**
     * Gets the underlying panel.
     */
    public get panel(): vscode.WebviewPanel {
        return this._panel;
    }

    /**
     * @inheritdoc
     */
    public async postMessage(command: string, data?: any) {
        const MSG: WebViewMessage = {
            command: command,
            data: data,
        };

        return await this.view.postMessage(MSG);
    }

    private async raiseEvent(name: string, data: any) {
        const LISTENER = this.openOptions.raiseEvent;
        if (!LISTENER) {
            return;
        }

        const CTX: EventListenerContext = {
            data: data,
            name: vscode_helpers.normalizeString(name),
            postMessage: async (cmd, d?) => {
                return this.postMessage(
                    vscode_helpers.toStringSafe(cmd), d
                );
            }
        };

        await Promise.resolve(
            LISTENER( CTX )
        );
    }

    private async reloadBoard() {
        const FILE = this.file;
        if (!FILE) {
            return;
        }

        let loadedBoard: Board = JSON.parse(
            await FSExtra.readFile(
                FILE.fsPath, 'utf8'
            )
        );

        if (_.isNil(loadedBoard)) {
            loadedBoard = newBoard();
        }

        loadedBoard = vscode_helpers.cloneObject( loadedBoard );
        {
            for (const BC of BOARD_COLMNS) {
                const CARDS: BoardCard[] = loadedBoard[ BC ]
                                         = vscode_helpers.asArray( loadedBoard[ BC ] );

                for (const C of CARDS) {
                    if (vscode_helpers.isEmptyString(C.id)) {
                        let prefix = '';
                        try {
                            if (!vscode_helpers.isEmptyString(C.creation_time)) {
                                const CREATION_TIME = vscode_helpers.asUTC(
                                    C.creation_time
                                );
                                if (CREATION_TIME.isValid()) {
                                    prefix += CREATION_TIME.format('YYYYMMDDHHmmss') + '_';
                                }
                            }
                        } catch { }

                        prefix += Math.floor(Math.random() * 597923979) + '_';

                        let simpleIDs: boolean;
                        if (this.openOptions.settings) {
                            simpleIDs = this.openOptions.settings.simpleIDs;
                        }

                        if (vscode_helpers.toBooleanSafe(simpleIDs, true)) {
                            C.id = '' + findNextSimpleCardId(loadedBoard);
                        } else {
                            C.id = `${ prefix }${ vscode_helpers.uuid().split('-').join('') }`;
                        }
                    }

                    normalizeCardContent(C, 'description');
                    normalizeCardContent(C, 'details');
                }
            }
        }

        let filter: string;
        try {
            const LOAD_FILTER = this.openOptions.loadFilter;
            if (LOAD_FILTER) {
                filter = await Promise.resolve(
                    LOAD_FILTER()
                );
            }
        } catch (e) {
            vsckb.showError(e);
        }

        await this.postMessage('setBoard', {
            cards: loadedBoard,
            filter: vscode_helpers.toStringSafe(filter),
            settings: this.openOptions.settings,
        });
    }

    /**
     * Gets the underlying web view.
     */
    public get view(): vscode.Webview {
        return this.panel.webview;
    }
}

/**
 * Returns the identifier, that the next card of a board should get, when
 * simple (numeric) identifiers are in use.
 *
 * It is the highest number, that is already used as an identifier, plus one:
 * an identifier, that is not a number, does not take part.
 *
 * @param {Board} board The board to look at.
 *
 * @return {number} The identifier for the next card.
 */
export function findNextSimpleCardId(board: Board): number {
    let lastID = 0;
    for (const BC of BOARD_COLMNS) {
        const CARDS: BoardCard[] = vscode_helpers.asArray( board[ BC ] );

        for (const C of CARDS) {
            if (!vscode_helpers.isEmptyString(C.id)) {
                const CARD_ID_NUM = parseInt(vscode_helpers.toStringSafe(C.id).trim());
                if (!isNaN(CARD_ID_NUM)) {
                    lastID = Math.max(lastID, CARD_ID_NUM);
                }
            }
        }
    }

    return lastID + 1;
}

/**
 * Brings a text property of a card ('description' or 'details') into the
 * shape the board works with: an object with content and MIME type.
 *
 * A plain text becomes such an object, an empty content is dropped and any
 * MIME type other than Markdown becomes plain text.
 *
 * @param {BoardCard} card The card to update.
 * @param {PropertyKey} property The property to bring into shape.
 */
export function normalizeCardContent(card: BoardCard, property: PropertyKey) {
    let cardContentValue: BoardCardContentValue = card[ property ];

    let cardContent: BoardCardContent;
    if (!_.isNil(cardContentValue)) {
        if (_.isObject(cardContentValue)) {
            cardContent = <BoardCardContent>cardContentValue;
        } else {
            cardContent = {
                content: vscode_helpers.toStringSafe(cardContentValue),
                mime: 'text/plain',
            };
        }

        if (vscode_helpers.isEmptyString(cardContent.content)) {
            cardContent = undefined;
        }
    }

    if (!_.isNil(cardContent)) {
        const MIME = vscode_helpers.normalizeString(cardContent.mime);
        switch (MIME) {
            case 'text/markdown':
                cardContent.mime = MIME;
                break;

            default:
                cardContent.mime = 'text/plain';
                break;
        }
    }

    card[ property ] = cardContent;
}

/**
 * Creates a new board object.
 *
 * @return {Board} The new object.
 */
export function newBoard(): Board {
    return {
        'todo': [],
        'in-progress': [],
        'testing': [],
        'done': [],
    };
}

/**
 * Opens a kanban board.
 *
 * @param {OpenBoardOptions} [opts] The options.
 *
 * @return {Promise<KanbanBoard>} The promise with the new board.
 */
export async function openBoard(opts?: OpenBoardOptions) {
    const NEW_BOARD = new KanbanBoard();

    await NEW_BOARD.initialize();

    if (opts.saveBoard) {
        NEW_BOARD.onSaveBoard(opts.saveBoard);
    }

    if (opts.saveFilter) {
        NEW_BOARD.onSaveBoardFilter(opts.saveFilter);
    }

    await NEW_BOARD.open(opts);

    return NEW_BOARD;
}
