/**
 * The icons of the board.
 *
 * They used to be path data written by hand, which had itself replaced Font
 * Awesome 4 and its 1,5 MB stylesheet. Now they come from the icon set of the
 * design system, so that shape, optical weight and grid are maintained by
 * whoever maintains the rest of the vocabulary (decision D-25).
 *
 * Each icon is named ONE BY ONE below. The package declares itself free of
 * side effects and ships one module per icon, so naming an icon is what puts
 * it in the bundle and nothing else comes with it: the set has seven hundred
 * and sixty-eight of them, and the board draws twenty-four.
 *
 * The names on the left are the board's, not the design system's. That
 * indirection is the whole reason this file survives: a component asks for
 * 'finish' and never learns what the set happens to call it this year.
 *
 * Every icon is decorative: it sits inside a control that carries the
 * accessible name, and is therefore hidden from assistive technology. An icon
 * that ever stands alone must be given a name by its caller.
 */

import {
    ArrowLeftIcon,
    BeakerIcon,
    CheckCircleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ColumnsIcon,
    DeviceDesktopIcon,
    EyeClosedIcon,
    EyeIcon,
    InfoIcon,
    ListUnorderedIcon,
    MoonIcon,
    PencilIcon,
    PlayIcon,
    PlusIcon,
    SquareIcon,
    StopwatchIcon,
    SunIcon,
    SyncIcon,
    TrashIcon,
    XIcon,
    ZapIcon,
    type Icon as DrawnIcon,
} from '@primer/octicons-react';

/**
 * The name of every icon the board draws.
 */
export type IconName =
    | 'execute'
    | 'track-time'
    | 'edit'
    | 'delete'
    | 'details'
    | 'add'
    | 'start'
    | 'stop'
    | 'test'
    | 'finish'
    | 'reject'
    | 'redo'
    | 'theme-auto'
    | 'theme-light'
    | 'theme-dark'
    | 'theme-contrast'
    | 'hide'
    | 'show'
    | 'columns'
    | 'list'
    | 'collapse'
    | 'expand'
    | 'close'
    | 'reload';

/**
 * The icon of the high contrast state.
 *
 * The set has nothing that says "high contrast", and the nearest thing it has
 * -- a circle half filled -- it does not ship at all. So this one is drawn: a
 * disc split down the middle, on the sixteen unit grid of the set so that it
 * sits at the same optical weight as its neighbours.
 *
 * It is the ONLY icon of the board still drawn here, and it is drawn because
 * the set has no answer, not because nobody looked.
 */
const HighContrastIcon: DrawnIcon = props => (
    <svg
        className={ props.className }
        viewBox="0 0 16 16"
        width={ props.size || 16 }
        height={ props.size || 16 }
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Zm0 1.5v13a6.5 6.5 0 0 1 0-13Z" />
    </svg>
);

/**
 * What the design system draws for each name.
 */
const ICONS: { [name in IconName]: DrawnIcon } = {
    'execute': ZapIcon,
    'track-time': StopwatchIcon,
    'edit': PencilIcon,
    'delete': TrashIcon,
    'details': InfoIcon,
    'add': PlusIcon,
    'start': PlayIcon,
    'stop': SquareIcon,
    'test': BeakerIcon,
    'finish': CheckCircleIcon,
    'reject': ArrowLeftIcon,
    'redo': SyncIcon,
    // following the editor is following the machine, which is what the icon of
    // a desktop says; the two themes chosen outright say sun and moon
    'theme-auto': DeviceDesktopIcon,
    'theme-light': SunIcon,
    'theme-dark': MoonIcon,
    'theme-contrast': HighContrastIcon,
    'hide': EyeClosedIcon,
    'show': EyeIcon,
    'columns': ColumnsIcon,
    'list': ListUnorderedIcon,
    'collapse': ChevronLeftIcon,
    'expand': ChevronRightIcon,
    'close': XIcon,
    'reload': SyncIcon,
};

/**
 * Draws an icon.
 */
export function Icon(props: { name: IconName; className?: string }) {
    const DRAW = ICONS[props.name] || ICONS['details'];

    return (
        <DRAW
            className={ `vsckb-icon ${ props.className || '' }`.trim() }
            size={ 16 }
        />
    );
}
