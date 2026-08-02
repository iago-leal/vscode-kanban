/**
 * The board, assembled.
 *
 * This is where the pieces meet and nothing else happens: the display state,
 * the board, the filter and the theme are each held by something of their own,
 * and this component only decides what is rendered from them.
 *
 * The single set of visible cards comes from 'computeVisibleBoard' and is
 * handed to whichever layout is in force. Neither layout filters anything of
 * its own, which is what makes "columns and list show the same cards" a
 * property of the structure rather than a coincidence to be tested for (D-14).
 */

import { ReactNode, useCallback, useMemo, useState } from 'react';

import { AddCardDialog } from './dialogs/AddCardDialog';
import { BoardCard, ColumnKey } from '../domain/types';
import { CardActions } from './Card';
import { CardDetailsDialog } from './dialogs/CardDetailsDialog';
import { ColumnsView } from './ColumnsView';
import { ConfirmDialog } from './dialogs/ConfirmDialog';
import { EditCardDialog } from './dialogs/EditCardDialog';
import { ListView } from './ListView';
import { Services, ServicesProvider } from './services';
import { ThemeProvider, useTheme } from '../theme/theme-provider';
import { TopBar } from './TopBar';
import { addCard, removeCard, updateCard } from '../domain/board-operations';
import { columnName } from '../domain/columns';
import { computeVisibleBoard } from '../domain/visibility';
import { createBaseFilterFunctions } from '../domain/filter-functions';
import { createCardPredicate } from '../domain/filtering';
import { createFiltrexEvaluator } from '../adapters/filter-language';
import { moveCard } from '../domain/board-operations';
import { otherCards } from '../domain/identity';
import { toStringSafe } from '../domain/text';
import { useBoard } from './use-board';
import { useViewState } from './use-view-state';

import '../theme/board.css';

/**
 * The dialog that is open, if any.
 */
type OpenDialog =
    | { kind: 'add'; column: ColumnKey }
    | { kind: 'edit'; card: BoardCard; column: ColumnKey }
    | { kind: 'details'; card: BoardCard; column: ColumnKey }
    | { kind: 'delete'; card: BoardCard; column: ColumnKey };

/**
 * Renders the whole board.
 */
export function App(props: { services: Services }) {
    const SERVICES = props.services;
    const BRIDGE = SERVICES.bridge;

    const VIEW = useViewState(BRIDGE);
    const BOARD = useBoard(BRIDGE, VIEW.accept);

    const [dialog, setDialog] = useState<OpenDialog | undefined>(undefined);

    const CLOSE = useCallback(() => setDialog(undefined), []);

    // the language is built once; the predicate is rebuilt whenever the
    // expression changes, exactly as the board has always recompiled it
    const EVALUATOR = useMemo(() => createFiltrexEvaluator(), []);
    const BASE_FUNCS = useMemo(
        () => createBaseFilterFunctions(SERVICES.time, BRIDGE.log),
        [SERVICES.time, BRIDGE.log]
    );

    const VISIBLE = useMemo(() => {
        return computeVisibleBoard(
            BOARD.board,
            VIEW.viewState,
            createCardPredicate(
                BOARD.filter, EVALUATOR, BASE_FUNCS, SERVICES.time, BRIDGE.log
            )
        );
    }, [
        BOARD.board, BOARD.filter, VIEW.viewState,
        EVALUATOR, BASE_FUNCS, SERVICES.time, BRIDGE.log,
    ]);

    const RAISE_ON_CARD = useCallback((name: string, card: BoardCard, column: ColumnKey) => {
        BRIDGE.raiseEvent(name, {
            card: card,
            column: column,
            others: BOARD.others(card.__uid),
        });
    }, [BRIDGE, BOARD]);

    const ACTIONS = useMemo<CardActions>(() => ({
        onEdit: (card, column) => setDialog({ kind: 'edit', card: card, column: column }),

        onDetails: (card, column) => setDialog({ kind: 'details', card: card, column: column }),

        onDelete: (card, column) => setDialog({ kind: 'delete', card: card, column: column }),

        onMove: (card, from, to) => BOARD.mutate(
            current => moveCard(current, toStringSafe(card.__uid), to),
            next => ({
                name: 'card_moved',
                data: {
                    card: card,
                    from: from,
                    others: otherCards(next, card),
                    to: to,
                },
            })
        ),

        // neither of these changes the board, so neither saves it
        onExecute: (card, column) => RAISE_ON_CARD('execute_card', card, column),
        onTrackTime: (card, column) => RAISE_ON_CARD('track_time', card, column),
    }), [BOARD, RAISE_ON_CARD]);

    const ADD_CARD = useCallback((column: ColumnKey, card: BoardCard) => {
        BOARD.mutate(
            current => addCard(current, column, card),
            next => ({
                name: 'card_created',
                data: {
                    card: card,
                    column: column,
                    others: otherCards(next, card),
                },
            })
        );

        CLOSE();
    }, [BOARD, CLOSE]);

    const SAVE_CARD = useCallback((
        column: ColumnKey,
        previous: BoardCard,
        card: BoardCard,
    ) => {
        BOARD.mutate(
            current => updateCard(current, toStringSafe(previous.__uid), () => card),
            next => ({
                name: 'card_updated',
                data: {
                    card: card,
                    column: column,
                    oldCard: previous,
                    others: otherCards(next, card),
                },
            })
        );

        CLOSE();
    }, [BOARD, CLOSE]);

    const DELETE_CARD = useCallback((column: ColumnKey, card: BoardCard) => {
        BOARD.mutate(
            current => removeCard(current, toStringSafe(card.__uid)),
            next => ({
                name: 'card_deleted',
                data: {
                    card: card,
                    column: column,
                    others: otherCards(next, card),
                },
            })
        );

        CLOSE();
    }, [BOARD, CLOSE]);

    return (
        <ServicesProvider services={ SERVICES }>
            <ThemeProvider preference={ VIEW.viewState.theme }>
                <BoardShell
                    board={ BOARD }
                    view={ VIEW }
                    visible={ VISIBLE }
                    actions={ ACTIONS }
                    onAddCard={ column => setDialog({ kind: 'add', column: column }) }
                    onReload={ BRIDGE.reloadBoard }
                />

                { 'add' === dialog?.kind ? (
                    <AddCardDialog
                        column={ dialog.column }
                        columnLabel={ columnName(dialog.column, BOARD.settings) }
                        board={ BOARD.board }
                        settings={ BOARD.settings }
                        currentUser={ BOARD.currentUser }
                        onSave={ card => ADD_CARD(dialog.column, card) }
                        onClose={ CLOSE }
                    />
                ) : null }

                { 'edit' === dialog?.kind ? (
                    <EditCardDialog
                        card={ dialog.card }
                        columnLabel={ columnName(dialog.column, BOARD.settings) }
                        onSave={ card => SAVE_CARD(dialog.column, dialog.card, card) }
                        onClose={ CLOSE }
                    />
                ) : null }

                { 'details' === dialog?.kind ? (
                    <CardDetailsDialog
                        card={ dialog.card }
                        columnLabel={ columnName(dialog.column, BOARD.settings) }
                        onClose={ CLOSE }
                    />
                ) : null }

                { 'delete' === dialog?.kind ? (
                    <ConfirmDialog
                        title="Delete this card?"
                        message={ `'${ toStringSafe(dialog.card.title) }' is removed from the board. This cannot be undone.` }
                        confirmLabel="Delete"
                        onConfirm={ () => DELETE_CARD(dialog.column, dialog.card) }
                        onClose={ CLOSE }
                    />
                ) : null }
            </ThemeProvider>
        </ServicesProvider>
    );
}

/**
 * The board itself: the bar, and whichever layout is in force.
 *
 * It is split out so that it sits INSIDE the theme provider and can therefore
 * carry the attribute that selects the colour set.
 */
function BoardShell(props: {
    board: ReturnType<typeof useBoard>;
    view: ReturnType<typeof useViewState>;
    visible: ReturnType<typeof computeVisibleBoard>;
    actions: CardActions;
    onAddCard(column: ColumnKey): void;
    onReload(): void;
}) {
    const { board, view, visible } = props;

    return (
        <ThemedShell viewMode={ view.viewState.viewMode }>
            <TopBar
                title={ board.title }
                filter={ board.filter }
                theme={ view.viewState.theme }
                hideDone={ view.viewState.hideDone }
                viewMode={ view.viewState.viewMode }
                hiddenCount={ visible.hiddenCount }
                onFilterChange={ board.setFilter }
                onCycleTheme={ view.cycleTheme }
                onToggleHideDone={ view.toggleHideDone }
                onToggleViewMode={ view.toggleViewMode }
                onReload={ props.onReload }
            />

            { 'list' === view.viewState.viewMode ? (
                <ListView
                    board={ visible }
                    settings={ board.settings }
                    actions={ props.actions }
                    onAddCard={ props.onAddCard }
                />
            ) : (
                <ColumnsView
                    board={ visible }
                    settings={ board.settings }
                    actions={ props.actions }
                    onToggleCollapsed={ view.setCollapsed }
                    onAddCard={ props.onAddCard }
                />
            ) }
        </ThemedShell>
    );
}

/**
 * The element that carries the colour set in force.
 */
function ThemedShell(props: {
    viewMode: string;
    children: ReactNode;
}) {
    const THEME = useTheme();

    return (
        <div
            className="vsckb-board"
            data-vsckb-theme={ THEME.effective }
            data-vsckb-contrast={ THEME.highContrast ? 'high' : undefined }
            data-vsckb-mode={ props.viewMode }
        >
            { props.children }
        </div>
    );
}

