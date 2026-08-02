/**
 * The barrier between what a card says and what the Webview runs.
 *
 * The board has always removed '<script>' from converted Markdown
 * ('script.js:234') and nothing else: an 'onerror' attribute or an '<iframe>'
 * went straight through, into a Webview that runs scripts and declares no
 * Content Security Policy. That is card [6] of the board of this project, and
 * repairing it in full is not this feature.
 *
 * What this feature may not do is make the barrier weaker, so the same removal
 * is kept and widened to the neighbours of the same family: the elements that
 * fetch or execute, the attributes that carry code, and the URL schemes that
 * are code in disguise. Anything unrecognised is dropped rather than kept,
 * because a barrier that guesses in favour of the content is not a barrier.
 */

/**
 * Elements that never survive: they execute, they fetch, or they replace the
 * page.
 */
const FORBIDDEN_ELEMENTS = [
    'script', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
    'link', 'meta', 'base', 'style', 'form', 'input', 'button', 'textarea',
    'select', 'option',
];

/**
 * Attributes that carry a URL and therefore need their scheme checked.
 */
const URL_ATTRIBUTES = ['href', 'src', 'xlink:href', 'action', 'formaction'];

/**
 * Schemes a link or an image may use.
 */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'vscode:', 'file:'];

/**
 * Strips from a tree everything, that could run or fetch.
 *
 * The element is changed in place, which is what lets the caller keep working
 * on the same tree afterwards.
 *
 * @param {Element} root The tree to clean.
 */
export function sanitizeTree(root: Element): void {
    for (const NAME of FORBIDDEN_ELEMENTS) {
        const FOUND = root.querySelectorAll(NAME);

        for (let i = 0; i < FOUND.length; i++) {
            FOUND[i].remove();
        }
    }

    sanitizeAttributes(root);

    const ALL = root.querySelectorAll('*');

    for (let i = 0; i < ALL.length; i++) {
        sanitizeAttributes(ALL[i]);
    }
}

/**
 * Tells whether a URL may be followed.
 *
 * A URL without a scheme is relative and stays; anything else has to be on the
 * list. 'javascript:' and 'data:' are therefore rejected by not being on it,
 * rather than by being named, so a scheme nobody thought of is rejected too.
 *
 * @param {string} url The URL to check.
 *
 * @return {boolean} May be followed or not.
 */
export function isSafeUrl(url: string): boolean {
    const TEXT = url.trim();

    if ('' === TEXT) {
        return false;
    }

    // '#anchor', '/path' and 'page.html' carry no scheme at all
    const SCHEME = /^([a-z][a-z0-9+.-]*):/i.exec(TEXT);

    if (!SCHEME) {
        return true;
    }

    return SAFE_SCHEMES.indexOf(SCHEME[1].toLowerCase() + ':') > -1;
}

/**
 * Removes from a single element the attributes, that could run code.
 */
function sanitizeAttributes(element: Element): void {
    const NAMES: string[] = [];

    for (let i = 0; i < element.attributes.length; i++) {
        NAMES.push(element.attributes[i].name);
    }

    for (const NAME of NAMES) {
        const LOWER = NAME.toLowerCase();

        // 'onclick', 'onerror' and the other sixty of them
        if (0 === LOWER.indexOf('on')) {
            element.removeAttribute(NAME);

            continue;
        }

        if (URL_ATTRIBUTES.indexOf(LOWER) > -1 &&
            !isSafeUrl(element.getAttribute(NAME) || '')) {
            element.removeAttribute(NAME);
        }
    }
}
