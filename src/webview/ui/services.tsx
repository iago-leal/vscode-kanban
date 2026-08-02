/**
 * What the interface is allowed to reach for.
 *
 * Everything that is not a pure calculation — the bridge to the extension, the
 * five adapters over the vendored libraries — arrives through this context and
 * through nothing else. No component imports an adapter directly, which is
 * what keeps the promise of D-08 checkable by reading the imports.
 */

import { createContext, ReactNode, useContext } from 'react';

import { Bridge } from '../bridge/vscode-bridge';
import { DiagramPort } from '../adapters/diagrams';
import { HighlightPort } from '../adapters/highlight';
import { MarkdownPort, TimePort } from '../domain/ports';

/**
 * The services the board runs on.
 */
export interface Services {
    bridge: Bridge;
    markdown: MarkdownPort;
    diagrams: DiagramPort;
    highlight: HighlightPort;
    time: TimePort;
}

const SERVICES_CONTEXT = createContext<Services | undefined>(undefined);

/**
 * Puts the services in reach of the interface below it.
 */
export function ServicesProvider(props: {
    services: Services;
    children: ReactNode;
}) {
    return (
        <SERVICES_CONTEXT.Provider value={ props.services }>
            { props.children }
        </SERVICES_CONTEXT.Provider>
    );
}

/**
 * The services of the board.
 *
 * @return {Services} The services.
 *
 * @throws When a component is rendered outside the provider, which is a
 *         mistake of composition and not a state the user can reach.
 */
export function useServices(): Services {
    const SERVICES = useContext(SERVICES_CONTEXT);

    if (!SERVICES) {
        throw new Error('The services of the board are not in reach');
    }

    return SERVICES;
}
