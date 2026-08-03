/**
 * The bar above the board.
 *
 * It carries the three controls that decide what the board shows -- the theme,
 * the hiding of finished cards and the layout -- beside the filter and the
 * title that were already there.
 *
 * The controls are the ones of the design system now, which is what pays for
 * the focus ring, the pressed state and the hit area being right without a
 * rule of ours (RF-01).
 *
 * What each control SAYS is ours, and it says where it goes, not where it is.
 * A control reading 'light' while the board is light states the obvious and
 * leaves the useful part -- what pressing it does -- to be guessed; reading
 * 'Dark' on a light board, it answers the only question anyone asks of a
 * button. The visible name is therefore the destination throughout: the next
 * theme of the cycle, the layout not in force, the fate of the finished cards.
 *
 * Sight is what that trades on, though, and a name that changes under the
 * pointer is no use to someone who cannot see the board it describes. So the
 * accessible name carries BOTH, state first and action second -- 'Theme:
 * light. Press for dark' -- which is what keeps RF-14 satisfied while the
 * visible label stays short. And 'aria-pressed' is gone from all three: a
 * button labelled with its action has no pressed state to report, and
 * announcing 'List, pressed' while the board shows columns would be a
 * contradiction read aloud.
 */

import { Button, IconButton as SystemIconButton, TextInput } from '@primer/react';

import { Icon, IconName } from './icons';
import { ThemePreference, ViewMode } from '../domain/types';
import { anchored } from './anchors';
import { nextThemePreference } from '../domain/view-state';

/**
 * How each preference of theme is drawn, named as a state and named as an act.
 *
 * The two names differ by more than capitals: 'follows the editor' describes a
 * board, 'Follow the editor' asks for one.
 */
const THEME_LABELS: {
    [preference in ThemePreference]: { state: string; action: string; icon: IconName }
} = {
    'follow-editor': { state: 'follows the editor', action: 'Follow the editor', icon: 'theme-auto' },
    'light': { state: 'light', action: 'Light', icon: 'theme-light' },
    'dark': { state: 'dark', action: 'Dark', icon: 'theme-dark' },
    'high-contrast': { state: 'high contrast', action: 'High contrast', icon: 'theme-contrast' },
};

/**
 * Renders the bar.
 */
export function TopBar(props: {
    title: string;
    filter: string;
    theme: ThemePreference;
    hideDone: boolean;
    viewMode: ViewMode;
    hiddenCount: number;
    onFilterChange(expression: string): void;
    onCycleTheme(): void;
    onToggleHideDone(): void;
    onToggleViewMode(): void;
    onReload(): void;
}) {
    const THEME = THEME_LABELS[props.theme] || THEME_LABELS['follow-editor'];
    const NEXT_THEME = THEME_LABELS[nextThemePreference(props.theme)];

    const IS_LIST = 'list' === props.viewMode;

    return (
        <header { ...anchored({ anchor: 'board-header', className: 'vsckb-topbar' }) }>
            <h1 className="vsckb-topbar-title">{ props.title }</h1>

            <TextInput
                { ...anchored({ anchor: 'action-filter' }) }
                type="search"
                className="vsckb-topbar-filter"
                value={ props.filter }
                placeholder="Filter, e.g. type == &quot;bug&quot; and prio &gt; 5"
                aria-label="Filter of the cards"
                onChange={ e => props.onFilterChange(e.target.value) }
            />

            <div className="vsckb-topbar-controls">
                <Button
                    leadingVisual={ () => <Icon name={ NEXT_THEME.icon } /> }
                    title={ `Theme: ${ THEME.state }. Press for ${ NEXT_THEME.state }` }
                    aria-label={ `Theme: ${ THEME.state }. Press for ${ NEXT_THEME.state }` }
                    onClick={ props.onCycleTheme }
                >
                    { NEXT_THEME.action }
                </Button>

                <Button
                    leadingVisual={ () => <Icon name={ props.hideDone ? 'show' : 'hide' } /> }
                    title={ props.hideDone ? 'Finished cards are hidden'
                                           : 'Finished cards are shown' }
                    aria-label={ hideDoneLabel(props.hideDone, props.hiddenCount) }
                    onClick={ props.onToggleHideDone }
                >
                    { props.hideDone ? `Show finished (${ props.hiddenCount })`
                                     : 'Hide finished' }
                </Button>

                <Button
                    leadingVisual={ () => <Icon name={ IS_LIST ? 'columns' : 'list' } /> }
                    title={ IS_LIST ? 'Showing a single list. Press for four columns'
                                    : 'Showing four columns. Press for a single list' }
                    aria-label={ IS_LIST
                        ? 'Layout: single list. Press to show four columns'
                        : 'Layout: four columns. Press to show a single list' }
                    onClick={ props.onToggleViewMode }
                >
                    { IS_LIST ? 'Columns' : 'List' }
                </Button>

                <SystemIconButton
                    { ...anchored({ anchor: 'action-reload' }) }
                    icon={ () => <Icon name="reload" /> }
                    aria-label="Read the board from disk again"
                    onClick={ props.onReload }
                />
            </div>
        </header>
    );
}

/**
 * Names the control of the finished cards, counting what it is hiding.
 *
 * Announcing the count is what keeps the control honest for someone who cannot
 * see the strip of the collapsed column: the visible label shows the same
 * number, but only the accessible name says what it counts.
 */
function hideDoneLabel(hidden: boolean, count: number): string {
    return hidden
        ? `Finished cards are hidden, ${ count } of them. Press to show them`
        : 'Finished cards are shown. Press to hide them';
}
