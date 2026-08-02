/**
 * Which of the two colour sets is in force.
 *
 * The editor announces its own theme by putting a class on the body of the
 * Webview — 'vscode-light', 'vscode-dark' or 'vscode-high-contrast' — and it
 * updates that class the moment the user changes the theme. Watching the class
 * is therefore enough to follow the editor live, without a new command on the
 * bridge and without reloading the panel (RF-08).
 *
 * Following is only the default. An explicit choice wins over the editor and
 * keeps winning while the editor changes underneath (RF-09); the rule itself
 * lives in the domain, and this file only feeds it what the editor is doing.
 */

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EffectiveTheme, ThemePreference } from '../domain/types';
import { resolveTheme } from '../domain/view-state';

import './tokens.css';

/**
 * What the editor is showing, as the board reads it.
 */
export interface EditorTheme {
    scheme: EffectiveTheme;
    highContrast: boolean;
}

/**
 * What a component may ask about the theme.
 */
export interface ThemeContextValue {
    /**
     * What the user chose.
     */
    preference: ThemePreference;

    /**
     * What is actually painted.
     */
    effective: EffectiveTheme;

    /**
     * Whether the editor is in a high contrast theme.
     */
    highContrast: boolean;
}

const THEME_CONTEXT = createContext<ThemeContextValue>({
    preference: 'follow-editor',
    effective: 'light',
    highContrast: false,
});

/**
 * Reads the theme of the editor off the body of the document.
 *
 * A class nobody recognises is read as light, which is what the board has
 * always shown by default.
 *
 * @return {EditorTheme} The theme of the editor.
 */
export function readEditorTheme(): EditorTheme {
    if ('undefined' === typeof document || !document.body) {
        return { scheme: 'light', highContrast: false };
    }

    const CLASSES = document.body.classList;

    const HIGH_CONTRAST = CLASSES.contains('vscode-high-contrast') ||
                          CLASSES.contains('vscode-high-contrast-light');

    // a high contrast theme of the editor is a dark one, unless it says light
    if (HIGH_CONTRAST) {
        return {
            scheme: CLASSES.contains('vscode-high-contrast-light') ? 'light' : 'dark',
            highContrast: true,
        };
    }

    return {
        scheme: CLASSES.contains('vscode-dark') ? 'dark' : 'light',
        highContrast: false,
    };
}

/**
 * Follows the theme of the editor for as long as the component lives.
 *
 * @return {EditorTheme} The theme of the editor, kept current.
 */
export function useEditorTheme(): EditorTheme {
    const [theme, setTheme] = useState<EditorTheme>(readEditorTheme);

    useEffect(() => {
        if ('undefined' === typeof MutationObserver || !document.body) {
            return;
        }

        const OBSERVER = new MutationObserver(() => {
            const CURRENT = readEditorTheme();

            // React would re-render on every mutation of the body otherwise,
            // and the class changes for reasons that are not the theme
            setTheme(previous => {
                return previous.scheme === CURRENT.scheme &&
                       previous.highContrast === CURRENT.highContrast
                    ? previous
                    : CURRENT;
            });
        });

        OBSERVER.observe(document.body, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => OBSERVER.disconnect();
    }, []);

    return theme;
}

/**
 * Puts the colour set in force over its children.
 */
export function ThemeProvider(props: {
    preference: ThemePreference;
    children: ReactNode;
}) {
    const EDITOR = useEditorTheme();

    const VALUE = useMemo<ThemeContextValue>(() => {
        return {
            preference: props.preference,
            effective: resolveTheme(props.preference, EDITOR.scheme),
            highContrast: EDITOR.highContrast,
        };
    }, [props.preference, EDITOR.scheme, EDITOR.highContrast]);

    return (
        <THEME_CONTEXT.Provider value={ VALUE }>
            { props.children }
        </THEME_CONTEXT.Provider>
    );
}

/**
 * The theme in force, for a component that needs to know it.
 *
 * Only the components that render something outside CSS need this — a diagram
 * has to be told which palette to draw with. Everything else names a token and
 * never asks.
 *
 * @return {ThemeContextValue} The theme.
 */
export function useTheme(): ThemeContextValue {
    return useContext(THEME_CONTEXT);
}
