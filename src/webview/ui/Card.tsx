/**
 * A card of the board.
 *
 * The three colour groups of the type survive untouched — 'emergency', 'bug'
 * and everything else — and only their tones are now decided by the theme
 * (RN-11). The grouping itself is a rule of the domain, and the card asks for
 * it rather than deciding it.
 *
 * Every action of the card is a real button: the old card put its handlers on
 * anchors and on the body of the card itself, which made the board unreachable
 * by keyboard. The set of actions has not changed.
 */

import { BoardCard, BoardSettings, ColumnKey } from '../domain/types';
import { Icon, IconName } from './icons';
import { Markdown } from './Markdown';
import { columnName, movesFrom } from '../domain/columns';
import { colorGroupOf } from '../domain/card-taxonomy';
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
}

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
            className="vsckb-card"
            data-vsckb-group={ GROUP }
            aria-label={ NAME }
        >
            <div className="vsckb-card-stripe">
                <span className="vsckb-card-type">{ TYPE }</span>

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

            <div className="vsckb-card-info">
                <h3 className="vsckb-card-title">{ TITLE }</h3>

                { props.showColumn ? (
                    <p className="vsckb-card-column">
                        { columnName(props.column, SETTINGS) }
                    </p>
                ) : null }

                { '' === CATEGORY ? null : (
                    <p className="vsckb-card-category">{ CATEGORY }</p>
                ) }

                { PROGRESS ? (
                    <div
                        className="vsckb-card-progress"
                        role="progressbar"
                        aria-valuemin={ 0 }
                        aria-valuemax={ PROGRESS.total }
                        aria-valuenow={ PROGRESS.checked }
                        aria-label={ `${ PROGRESS.checked } of ${ PROGRESS.total } tasks done` }
                        title={ `${ PROGRESS.percentage.toFixed(1) } %` }
                    >
                        <div
                            className="vsckb-card-progress-bar"
                            data-vsckb-level={ progressLevel(PROGRESS.percentage) }
                            style={ { width: `${ Math.floor(PROGRESS.percentage) }%` } }
                        />
                    </div>
                ) : null }

                { '' === DESCRIPTION ? null : (
                    <Markdown source={ DESCRIPTION } className="vsckb-card-body" />
                ) }
            </div>

            <footer className="vsckb-card-footer">
                { '' === CREATED_TEXT ? <span /> : (
                    <time className="vsckb-card-time" dateTime={ CREATED }>
                        { CREATED_TEXT }
                    </time>
                ) }

                <div className="vsckb-card-actions">
                    { movesFrom(props.column).map(move => (
                        <IconButton
                            key={ move.to }
                            icon={ MOVE_ICONS[move.icon] }
                            label={ `Move '${ NAME }' to '${ columnName(move.to, SETTINGS) }'` }
                            onClick={ () => props.actions.onMove(CARD, props.column, move.to) }
                        />
                    )) }

                    <IconButton
                        icon="details"
                        label={ `Details of '${ NAME }'` }
                        onClick={ () => props.actions.onDetails(CARD, props.column) }
                    />

                    <IconButton
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
 * A button that shows an icon and is named for whoever cannot see it.
 */
export function IconButton(props: {
    icon: IconName;
    label: string;
    onClick(): void;
    pressed?: boolean;
    className?: string;
}) {
    return (
        <button
            type="button"
            className={ `vsckb-icon-button ${ props.className || '' }`.trim() }
            title={ props.label }
            aria-label={ props.label }
            aria-pressed={ undefined === props.pressed ? undefined : props.pressed }
            onClick={ props.onClick }
        >
            <Icon name={ props.icon } />
        </button>
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
