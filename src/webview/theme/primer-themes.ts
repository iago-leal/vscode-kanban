/**
 * The one place that knows the names the design system gives to its colour
 * sets, and which of them the board offers.
 *
 * '@primer/primitives' ships fourteen sets — dimmed, colourblind and
 * tritanopia variants among them — and each is around 118 KB. Only the four
 * the board actually offers are imported here, so that the bundle carries
 * nothing the user cannot reach (decision D-19).
 *
 * Every set is selected the same way: an attribute on the root element says
 * which mode is in force, and another says which named set answers for that
 * mode. This file maps what the board decided into those attributes, and
 * nothing else in the interface repeats the mapping.
 */

import { EffectiveTheme } from '../domain/types';

// What every set takes for granted: border widths, radii, spacing, type scale
// and the motion tokens. They do not change with the colour set and are the
// same eighteen kilobytes whichever sets are offered, so they are imported
// once, apart from the four. Without them the components resolve their
// measurements to nothing and collapse, which is a failure that shows as
// layout, not as an error.
import '@primer/primitives/dist/css/primitives.css';

import '@primer/primitives/dist/css/functional/themes/light.css';
import '@primer/primitives/dist/css/functional/themes/dark.css';
import '@primer/primitives/dist/css/functional/themes/light-high-contrast.css';
import '@primer/primitives/dist/css/functional/themes/dark-high-contrast.css';

/**
 * The named sets the board offers, exactly as the stylesheets above declare
 * them. A name outside this list has no stylesheet in the bundle and would
 * leave the board unpainted.
 */
export const OFFERED_THEMES = [
    'light',
    'dark',
    'light_high_contrast',
    'dark_high_contrast',
] as const;

export type OfferedTheme = typeof OFFERED_THEMES[number];

/**
 * What the root element has to carry for a set to take effect.
 *
 * Both the light and the dark name are always written, because the mode may
 * change underneath — the editor switching theme while the board follows it —
 * and the attribute for the other mode has to be already correct when it does.
 */
export interface PrimerThemeAttributes {
    'data-color-mode': EffectiveTheme;
    'data-light-theme': OfferedTheme;
    'data-dark-theme': OfferedTheme;
}

/**
 * Maps the theme in force onto the attributes the design system reads.
 *
 * @param {EffectiveTheme} effective The scheme being painted.
 * @param {boolean} highContrast Whether the high contrast set is in force.
 *
 * @return {PrimerThemeAttributes} What to write on the root element.
 */
export function primerThemeAttributes(
    effective: EffectiveTheme,
    highContrast: boolean,
): PrimerThemeAttributes {
    return {
        'data-color-mode': effective,
        'data-light-theme': highContrast ? 'light_high_contrast' : 'light',
        'data-dark-theme': highContrast ? 'dark_high_contrast' : 'dark',
    };
}

/**
 * The named set that answers for a given theme, which is the one of the two
 * names above that the mode in force selects.
 *
 * @param {EffectiveTheme} effective The scheme being painted.
 * @param {boolean} highContrast Whether the high contrast set is in force.
 *
 * @return {OfferedTheme} The set in force.
 */
export function primerThemeName(
    effective: EffectiveTheme,
    highContrast: boolean,
): OfferedTheme {
    const ATTRIBUTES = primerThemeAttributes(effective, highContrast);

    return 'dark' === effective ? ATTRIBUTES['data-dark-theme']
                                : ATTRIBUTES['data-light-theme'];
}
