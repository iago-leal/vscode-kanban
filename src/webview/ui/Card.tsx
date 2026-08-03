/**
 * A card of the board.
 *
 * The card stays a composition of this project: the design system supplies the
 * controls inside it -- buttons, label, progress bar, action menu -- and none
 * of the arrangement (RF-01, RF-24). What holds the pieces together is
 * geometry, declared in 'board.css', and no colour of ours.
 *
 * Three things about it are rules rather than taste. The colour group of the
 * type survives untouched, and is asked of the domain rather than decided here
 * (RN-11). The type is also written out in words, so that two cards remain
 * distinguishable with the colour gone (D-24, RN-03, RF-10). And every action
 * is a real control, reachable by keyboard: the card of version 1.33.1 put its
 * handlers on anchors and on the body of the card itself.
 */

import { ActionList, ActionMenu, IconButton as SystemIconButton, Label, ProgressBar } from '@primer/react';
import type { LabelColorOptions } from '@primer/react';

import { BoardCard, BoardSettings, ColumnKey } from '../domain/types';
import type { CardColorGroup } from '../domain/card-taxonomy';
import type { CardTextField } from '../domain/board-operations';
import { colorGroupOf } from '../domain/card-taxonomy';
import { Icon, IconName } from './icons';
import { IconButton } from './IconButton';
import { Markdown } from './Markdown';
import { anchored } from './anchors';
import { columnName, movesFrom } from '../domain/columns';
import { contentOf } from '../domain/types';
import { taskProgressOf } from '../domain/task-progress';
import { toStringSafe } from '../domain/text';
import { useServices } from './services';

/**
 * What a card lets the user do.
 */
export interface CardActions {
    onEdit(card: BoardCard, column: ColumnKey): void;
    onDelete(card: BoardCard, column: ColumnKey): void;
    onDetails(card: BoardCard, column: ColumnKey): void;
    onMove(card: BoardCard, from: ColumnKey, to: ColumnKey): void;
    onExecute(card: BoardCard, column: ColumnKey): void;
    onTrackTime(card: BoardCard, column: ColumnKey): void;
    /**
     * Ticks or unticks one task of one of the two texts of a card.
     *
     * It saves the board like any other change, which is the point: a
     * checklist nobody can tick is a checklist that has to be edited through a
     * dialog to say that one thing got done.
     */
    onToggleTask(
        card: BoardCard,
        column: ColumnKey,
        field: CardTextField,
        index: number,
    ): void;
}

/**
 * The colour the design system gives each group of types.
 *
 * The GROUPING is the domain's ('colorGroupOf'); which of the ten colours of
 * the design system answers for a group is a question of appearance, and is
 * answered here and in 'appearance.css' -- the label and the stripe of the same
 * card have to agree, and they agree because both read the same group.
 *
 * 'danger' and 'attention' are not decoration: they are the two the design
 * system reserves for "something is wrong" and "something needs looking at",
 * which is what an emergency and a bug are. Everything else is secondary,
 * because a note that shouted would leave nothing for the two that should.
 */
const GROUP_LABELS: { [group in CardColorGroup]: LabelColorOptions } = {
    'emergency': 'danger',
    'bug': 'attention',
    'default': 'secondary',
};

/**
 * The icon of each move, in the words of the board.
 */
const MOVE_ICONS: { [icon: string]: IconName } = {
    'start': 'start',
    'stop': 'stop',
    'test': 'test',
    'finish': 'finish',
    'reject': 'reject',
    'redo': 'redo',
};

/**
 * Renders one card.
 */
export function Card(props: {
    card: BoardCard;
    column: ColumnKey;
    settings?: BoardSettings;
    actions: CardActions;
    /**
     * Whether the column the card sits in is named on the card itself. The
     * list layout needs it, because there is no column header above the card
     * to say where it belongs (RF-22).
     */
    showColumn?: boolean;
}) {
    const { time } = useServices();

    const CARD = props.card;
    const SETTINGS = props.settings;

    const GROUP = colorGroupOf(CARD);
    const TYPE = toStringSafe(CARD.type).trim();
    const CATEGORY = toStringSafe(CARD.category).trim();

    const DESCRIPTION = contentOf(CARD.description);
    const PROGRESS = taskProgressOf(DESCRIPTION, contentOf(CARD.details));

    const CREATED = toStringSafe(CARD.creation_time).trim();
    const CREATED_TEXT = '' === CREATED ? '' : time.prettyTime(CREATED);

    const CAN_EXECUTE = !!(SETTINGS && SETTINGS.canExecute);
    const CAN_TRACK_TIME = !!(SETTINGS && SETTINGS.canTrackTime) &&
                           !isTrackingHidden(props.column, SETTINGS);

    const TITLE = toStringSafe(CARD.title).trim();
    const NAME = '' === TITLE ? 'card without a title' : TITLE;

    return (
        <article
            { ...anchored({
                anchor: 'card',
                cardType: '' === TYPE ? undefined : TYPE.toLowerCase(),
                className: 'vsckb-card',
            }) }
            data-vsckb-group={ GROUP }
            aria-label={ NAME }
        >
            { /*
               * The row of the type and the two optional buttons. A card that
               * has none of the three used to render it anyway, as an empty
               * strip twenty-eight pixels tall at the top of every note on the
               * board -- room the column was paying for and nothing occupied.
               */ }
            { '' === TYPE && !CAN_EXECUTE && !CAN_TRACK_TIME ? null : (
            <div className="vsckb-card-stripe">
                { '' === TYPE ? <span /> : (
                    <Label
                        className="vsckb-card-type"
                        variant={ GROUP_LABELS[GROUP] }
                    >
                        { TYPE }
                    </Label>
                ) }

                { CAN_EXECUTE ? (
                    <IconButton
                        icon="execute"
                        label={ `Execute '${ NAME }'` }
                        onClick={ () => props.actions.onExecute(CARD, props.column) }
                    />
                ) : null }

                { CAN_TRACK_TIME ? (
                    <IconButton
                        icon="track-time"
                        label={ `Track time of '${ NAME }'` }
                        onClick={ () => props.actions.onTrackTime(CARD, props.column) }
                    />
                ) : null }
            </div>
            ) }

            <div { ...anchored({ anchor: 'card-footer', className: 'vsckb-card-info' }) }>
                <h3 { ...anchored({ anchor: 'card-title', className: 'vsckb-card-title' }) }>
                    { TITLE }
                </h3>

                { props.showColumn ? (
                    <p className="vsckb-card-column">
                        { columnName(props.column, SETTINGS) }
                    </p>
                ) : null }

                { '' === CATEGORY ? null : (
                    <p { ...anchored({ anchor: 'card-category', className: 'vsckb-card-category' }) }>
                        { CATEGORY }
                    </p>
                ) }

                { PROGRESS ? (
                    <div
                        { ...anchored({ anchor: 'card-progress', className: 'vsckb-card-progress' }) }
                        title={ `${ PROGRESS.percentage.toFixed(1) } %` }
                    >
                        <ProgressBar
                            { ...anchored({
                                anchor: 'card-progress-bar',
                                className: 'vsckb-card-progress-bar',
                            }) }
                            progress={ PROGRESS.percentage }
                            aria-valuemin={ 0 }
                            aria-valuemax={ PROGRESS.total }
                            aria-valuenow={ PROGRESS.checked }
                            aria-label={ `${ PROGRESS.checked } of ${ PROGRESS.total } tasks done` }
                            data-vsckb-level={ progressLevel(PROGRESS.percentage) }
                        />
                    </div>
                ) : null }

                { '' === DESCRIPTION ? null : (
                    <Markdown
                        source={ DESCRIPTION }
                        anchor="card-body"
                        className="vsckb-card-body"
                        onToggleTask={ index => props.actions.onToggleTask(
                            CARD, props.column, 'description', index
                        ) }
                    />
                ) }
            </div>

            <footer className="vsckb-card-footer">
                { '' === CREATED_TEXT ? <span /> : (
                    <time className="vsckb-card-time" dateTime={ CREATED }>
                        { CREATED_TEXT }
                    </time>
                ) }

                <div { ...anchored({ anchor: 'card-actions', className: 'vsckb-card-actions' }) }>
                    <MoveMenu
                        card={ CARD }
                        column={ props.column }
                        name={ NAME }
                        settings={ SETTINGS }
                        onMove={ props.actions.onMove }
                    />

                    <IconButton
                        icon="details"
                        label={ `Details of '${ NAME }'` }
                        onClick={ () => props.actions.onDetails(CARD, props.column) }
                    />

                    <IconButton
                        anchor="action-edit"
                        icon="edit"
                        label={ `Edit '${ NAME }'` }
                        onClick={ () => props.actions.onEdit(CARD, props.column) }
                    />

                    <IconButton
                        icon="delete"
                        label={ `Delete '${ NAME }'` }
                        onClick={ () => props.actions.onDelete(CARD, props.column) }
                    />
                </div>
            </footer>
        </article>
    );
}

/**
 * The destinations the card can be moved to, as a menu.
 *
 * This replaces the row of one icon per move that feature 001 drew. The moves
 * offered are the SAME ones -- 'movesFrom' decides them, here as there -- and
 * so is what gets written to the file. What changes is that each destination
 * is now named in words instead of guessed from a glyph, and that the footer
 * gives back the room the type label of D-24 needed (RF-15).
 */
function MoveMenu(props: {
    card: BoardCard;
    column: ColumnKey;
    name: string;
    settings?: BoardSettings;
    onMove(card: BoardCard, from: ColumnKey, to: ColumnKey): void;
}) {
    const MOVES = movesFrom(props.column);

    if (!MOVES.length) {
        return null;
    }

    return (
        <ActionMenu>
            <ActionMenu.Anchor>
                <SystemIconButton
                    icon={ () => <Icon name="expand" /> }
                    aria-label={ `Move '${ props.name }' to another column` }
                    variant="invisible"
                    size="small"
                />
            </ActionMenu.Anchor>

            <ActionMenu.Overlay>
                <ActionList>
                    { MOVES.map(move => (
                        <ActionList.Item
                            key={ move.to }
                            onSelect={ () => props.onMove(props.card, props.column, move.to) }
                        >
                            <ActionList.LeadingVisual>
                                <Icon name={ MOVE_ICONS[move.icon] } />
                            </ActionList.LeadingVisual>

                            { `Move to '${ columnName(move.to, props.settings) }'` }
                        </ActionList.Item>
                    )) }
                </ActionList>
            </ActionMenu.Overlay>
        </ActionMenu>
    );
}

/**
 * Tells whether the button to track time is kept off this column.
 *
 * A card that is not being worked on has nothing to track, which is what the
 * setting 'noTimeTrackingIfIdle' says.
 */
function isTrackingHidden(column: ColumnKey, settings: BoardSettings): boolean {
    return !!settings.hideTimeTrackingIfIdle &&
           ['todo', 'done'].indexOf(column) > -1;
}

/**
 * How far along the bar is, in the three steps the board has always drawn.
 */
function progressLevel(percentage: number): 'low' | 'middle' | 'full' {
    if (percentage < 50.0) {
        return 'low';
    }

    return percentage < 100.0 ? 'middle' : 'full';
}
