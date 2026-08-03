/**
 * A button that shows an icon and is named for whoever cannot see it.
 *
 * It wraps the icon button of the design system, which is what pays for the
 * focus ring, the hit area and the disabled state. Two things it does NOT
 * delegate: the accessible name, which is required here and merely optional
 * there, and the style anchor, so that a control named in the map of version
 * 1.33.1 keeps answering by its old name.
 *
 * It lived inside 'Card.tsx' while the card was its only caller. The column
 * and the dialogs use it too, and a shared control that lives inside one of
 * its callers is a circular import waiting to happen.
 */

import { IconButton as SystemIconButton } from '@primer/react';

import { AnchorName, anchored } from './anchors';
import { Icon, IconName } from './icons';

/**
 * Renders the button.
 */
export function IconButton(props: {
    icon: IconName;

    /**
     * What the control is called. Required, and not optional as it is in the
     * design system: an icon button without a name is a button nobody using a
     * screen reader can identify (RF-14).
     */
    label: string;

    onClick(): void;
    anchor?: AnchorName;
    pressed?: boolean;
    className?: string;
}) {
    return (
        <SystemIconButton
            { ...anchored({ anchor: props.anchor, className: props.className }) }
            icon={ () => <Icon name={ props.icon } /> }
            aria-label={ props.label }
            aria-pressed={ undefined === props.pressed ? undefined : props.pressed }
            variant="invisible"
            size="small"
            onClick={ props.onClick }
        />
    );
}
