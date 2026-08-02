/**
 * The bar above the board.
 *
 * It carries the three controls this feature adds — the theme, the hiding of
 * finished cards and the layout — beside the filter and the title that were
 * already there.
 *
 * All three are buttons, reachable by tab and pressable by Enter or Space
 * (RF-06, RF-12). Two of them are two-state and say so through 'aria-pressed';
 * the theme has three states, which 'aria-pressed' cannot express, so it
 * announces the current state in its own name instead of pretending to be a
 * toggle.
 */

import { Icon, IconName } from './icons';
import { ThemePreference, ViewMode } from '../domain/types';

/**
 * How each preference of theme is announced and drawn.
 */
const THEME_LABELS: { [preference in ThemePreference]: { text: string; icon: IconName } } = {
    'follow-editor': { text: 'follows the editor', icon: 'theme-auto' },
    'light': { text: 'light', icon: 'theme-light' },
    'dark': { text: 'dark', icon: 'theme-dark' },
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

    return (
        <header className="vsckb-topbar">
            <h1 className="vsckb-topbar-title">{ props.title }</h1>

            <input
                type="search"
                className="vsckb-topbar-filter"
                value={ props.filter }
                placeholder="Filter, e.g. type == &quot;bug&quot; and prio &gt; 5"
                aria-label="Filter of the cards"
                onChange={ e => props.onFilterChange(e.target.value) }
            />

            <div className="vsckb-topbar-controls">
                <button
                    type="button"
                    className="vsckb-control"
                    title={ `Theme: ${ THEME.text }` }
                    aria-label={ `Theme: ${ THEME.text }. Press to change` }
                    onClick={ props.onCycleTheme }
                >
                    <Icon name={ THEME.icon } />
                    <span className="vsckb-control-text">{ THEME.text }</span>
                </button>

                <button
                    type="button"
                    className="vsckb-control"
                    aria-pressed={ props.hideDone }
                    title={ props.hideDone ? 'Finished cards are hidden'
                                           : 'Finished cards are shown' }
                    aria-label={ hideDoneLabel(props.hideDone, props.hiddenCount) }
                    onClick={ props.onToggleHideDone }
                >
                    <Icon name={ props.hideDone ? 'hide' : 'show' } />
                    <span className="vsckb-control-text">
                        { props.hideDone ? `Finished hidden (${ props.hiddenCount })`
                                         : 'Finished shown' }
                    </span>
                </button>

                <button
                    type="button"
                    className="vsckb-control"
                    aria-pressed={ 'list' === props.viewMode }
                    title={ 'list' === props.viewMode ? 'Showing a single list'
                                                      : 'Showing four columns' }
                    aria-label={ 'list' === props.viewMode
                        ? 'Layout: single list. Press to show columns'
                        : 'Layout: four columns. Press to show a single list' }
                    onClick={ props.onToggleViewMode }
                >
                    <Icon name={ 'list' === props.viewMode ? 'list' : 'columns' } />
                    <span className="vsckb-control-text">
                        { 'list' === props.viewMode ? 'List' : 'Columns' }
                    </span>
                </button>

                <button
                    type="button"
                    className="vsckb-control"
                    title="Read the board from disk again"
                    aria-label="Read the board from disk again"
                    onClick={ props.onReload }
                >
                    <Icon name="reload" />
                </button>
            </div>
        </header>
    );
}

/**
 * Names the control of the finished cards, counting what it is hiding.
 *
 * Announcing the count is what keeps the control honest for someone who cannot
 * see the strip of the collapsed column.
 */
function hideDoneLabel(hidden: boolean, count: number): string {
    return hidden
        ? `Finished cards are hidden, ${ count } of them. Press to show them`
        : 'Finished cards are shown. Press to hide them';
}
