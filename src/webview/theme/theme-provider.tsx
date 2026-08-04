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

import { ThemeProvider as DesignSystemProvider } from '@primer/react';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { EffectiveTheme, ThemePreference } from '../domain/types';
import { isHighContrast, resolveTheme } from '../domain/view-state';
import { primerThemeAttributes } from './primer-themes';

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
     * Whether the high contrast sets are in force.
     *
     * This follows the CHOICE, never the editor. A high contrast theme of the
     * editor makes the board dark or light like any other, and nothing more
     * (RF-09).
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
 * Writes on the root of the document what the design system reads.
 *
 * The root of the DOCUMENT, and not the root of the board, because a dialog is
 * a sibling of the board rather than a descendant: an attribute written on the
 * board would leave every dialog outside the colour set and painted in
 * nothing. Writing it once, above both, is what makes that impossible instead
 * of merely unlikely.
 *
 * Which names to write is not decided here. It comes from the mapping in
 * 'primer-themes.ts', which stays the only place that knows what the design
 * system calls its colour sets.
 *
 * @param {EffectiveTheme} effective The scheme being painted.
 * @param {boolean} highContrast Whether the high contrast sets are in force.
 */
function useThemeAttributes(effective: EffectiveTheme, highContrast: boolean): void {
    useEffect(() => {
        if ('undefined' === typeof document || !document.documentElement) {
            return;
        }

        const ROOT = document.documentElement;
        const ATTRIBUTES = primerThemeAttributes(effective, highContrast);

        for (const NAME of Object.keys(ATTRIBUTES)) {
            ROOT.setAttribute(NAME, (ATTRIBUTES as any)[NAME]);
        }
    }, [effective, highContrast]);
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
            highContrast: isHighContrast(props.preference),
        };
    }, [props.preference, EDITOR.scheme]);

    useThemeAttributes(VALUE.effective, VALUE.highContrast);

    const ATTRIBUTES = primerThemeAttributes(VALUE.effective, VALUE.highContrast);

    return (
        <THEME_CONTEXT.Provider value={ VALUE }>
            {/*
              * The design system keeps a context of its own, which a few of
              * its components read. It is fed from the value above and asked
              * for CONTEXT ONLY: left to itself it would render a wrapper
              * carrying the theme attributes a second time, and a second
              * writer of those attributes is a second answer to the question
              * of what colour set is in force. There is one answer, and it is
              * the view state (D-20).
              */}
            <DesignSystemProvider
                contextOnly
                colorMode={ ATTRIBUTES['data-color-mode'] }
                dayScheme={ ATTRIBUTES['data-light-theme'] }
                nightScheme={ ATTRIBUTES['data-dark-theme'] }
            >
                { props.children }
            </DesignSystemProvider>
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
