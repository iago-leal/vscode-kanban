/**
 * The icons of the board, drawn inline.
 *
 * They replace Font Awesome 4, whose stylesheet alone weighed 1,5 MB and
 * shipped four thousand glyphs for the eighteen used here. Each icon is a
 * handful of path data and inherits the colour of its text, so it follows the
 * theme without a rule of its own.
 *
 * Every icon is decorative: it sits inside a control that carries the
 * accessible name, and is therefore hidden from assistive technology. An icon
 * that ever stands alone must be given a name by its caller.
 */

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
    | 'hide'
    | 'show'
    | 'columns'
    | 'list'
    | 'collapse'
    | 'expand'
    | 'close'
    | 'reload';

/**
 * The path data of each icon, on a 24 by 24 grid.
 */
const PATHS: { [name in IconName]: string } = {
    'execute': 'M13 2 4 14h6l-1 8 9-12h-6z',
    'track-time': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v5l3.5 2',
    'edit': 'M4 20h4l10-10-4-4L4 16zM14 6l4 4M15 5l2-2 4 4-2 2',
    'delete': 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
    'details': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v.5M12 11v6',
    'add': 'M12 5v14M5 12h14',
    'start': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM10 8l6 4-6 4z',
    'stop': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h6v6H9z',
    'test': 'M3 12h4l2-5 3 10 2-5h7',
    'finish': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12l3 3 5-6',
    'reject': 'M10 3h6l3 8h-4l1 5-3 5-3-5V11H8zM4 3h4v8H4z',
    'redo': 'M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5',
    'theme-auto': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 3v18',
    'theme-light': 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5 3.6 3.6M20.4 20.4 19 19M19 5l1.4-1.4M3.6 20.4 5 19',
    'theme-dark': 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
    'hide': 'M4 4l16 16M10.6 10.7a2 2 0 0 0 2.8 2.8M6.7 6.8C4.6 8.1 3 10 2 12c2 3.7 5.6 6 10 6 1.6 0 3.1-.3 4.4-.9M9.9 6.2A9.9 9.9 0 0 1 12 6c4.4 0 8 2.3 10 6a15 15 0 0 1-3 3.8',
    'show': 'M2 12c2-3.7 5.6-6 10-6s8 2.3 10 6c-2 3.7-5.6 6-10 6s-8-2.3-10-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    'columns': 'M4 4h4v16H4zM10 4h4v16h-4zM16 4h4v16h-4z',
    'list': 'M4 6h16M4 12h16M4 18h16',
    'collapse': 'M15 6l-6 6 6 6',
    'expand': 'M9 6l6 6-6 6',
    'close': 'M6 6l12 12M18 6 6 18',
    'reload': 'M4 12a8 8 0 1 0 2.3-5.6M4 4v5h5',
};

/**
 * Draws an icon.
 */
export function Icon(props: { name: IconName; className?: string }) {
    return (
        <svg
            className={ `vsckb-icon ${ props.className || '' }`.trim() }
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d={ PATHS[props.name] } />
        </svg>
    );
}
