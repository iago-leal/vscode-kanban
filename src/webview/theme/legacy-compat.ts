/**
 * GENERATED FROM
 * '_reversa_forward/002-primer-design-system/interfaces/legacy-class-map.md'.
 * DO NOT EDIT BY HAND: run 'node ./scripts/generate-legacy-compat.js'.
 *
 * The names version 1.33.1 exposed, filed under the style anchor that
 * reaches the same element today. Putting them back on the element is what
 * makes a stylesheet written against the old interface keep working, which
 * no stylesheet of ours could have done: CSS has no selector aliasing.
 *
 * 39 names of 1.33.1 are covered. What is deliberately left out is
 * listed in §4 of the map, and the reason is given there for each.
 *
 * The life of this module is the life of the compatibility layer described
 * in §5 of the map. It goes when that goes, in the same major version.
 */

/**
 * What an element has to carry to answer by its old name.
 */
export interface LegacyNames {
    classes: string[];
    id?: string;
}

/**
 * Filed under the value of 'data-vsckb'.
 */
export const LEGACY_FOR_ANCHOR: { [anchor: string]: LegacyNames } = {
    'action-add': {
        'classes': [
            'vsckb-add-btn',
        ],
    },
    'action-clear': {
        'classes': [
            'vsckb-clear-btn',
        ],
    },
    'action-edit': {
        'classes': [
            'vsckb-edit-btn',
        ],
    },
    'action-filter': {
        'classes': [],
        'id': 'vsckb-filter-cards-btn',
    },
    'action-reload': {
        'classes': [],
        'id': 'vsckb-reload-board-btn',
    },
    'action-save': {
        'classes': [],
        'id': 'vsckb-save-board-btn',
    },
    'board-header': {
        'classes': [
            'vsckb-additional-header-btns',
        ],
    },
    'card': {
        'classes': [
            'vsckb-kanban-card',
        ],
    },
    'card-actions': {
        'classes': [
            'vsckb-buttons',
        ],
    },
    'card-body': {
        'classes': [
            'vsckb-kanban-card-body',
            'vsckb-body',
        ],
    },
    'card-category': {
        'classes': [
            'vsckb-kanban-card-category',
        ],
    },
    'card-footer': {
        'classes': [
            'vsckb-kanban-card-footer',
            'vsckb-kanban-card-info',
        ],
    },
    'card-progress': {
        'classes': [
            'vsckb-kanban-card-progress',
        ],
    },
    'card-progress-bar': {
        'classes': [
            'vsckb-kanban-card-progress-bar',
        ],
    },
    'card-reference': {
        'classes': [
            'vsckb-ref-badge',
        ],
    },
    'card-references': {
        'classes': [
            'vsckb-badge-list',
            'vsckb-list-of-linked-cards',
        ],
    },
    'card-title': {
        'classes': [
            'vsckb-kanban-card-title',
            'vsckb-title',
        ],
    },
    'column': {
        'classes': [
            'vsckb-kanban-card-col',
        ],
    },
    'column-body': {
        'classes': [
            'vsckb-card-list',
            'vsckb-primary-card-body',
        ],
    },
    'column-header': {
        'classes': [
            'vsckb-primary-card-header',
        ],
    },
    'dialog-cancel': {
        'classes': [
            'vsckb-no-btn',
        ],
    },
    'dialog-confirm': {
        'classes': [
            'vsckb-yes-btn',
            'vsckb-save-btn',
            'vsckb-apply-btn',
        ],
    },
};

/**
 * Filed under a qualifying attribute and its value, as in
 * 'data-vsckb-column="done"'.
 */
export const LEGACY_FOR_STATE: {
    [attribute: string]: { [value: string]: LegacyNames };
} = {
    'column': {
        'done': {
            'classes': [],
            'id': 'vsckb-card-done',
        },
        'in-progress': {
            'classes': [],
            'id': 'vsckb-card-in-progress',
        },
        'testing': {
            'classes': [],
            'id': 'vsckb-card-testing',
        },
        'todo': {
            'classes': [],
            'id': 'vsckb-card-todo',
        },
    },
    'dialog': {
        'add-card': {
            'classes': [],
            'id': 'vsckb-add-card-modal',
        },
        'card-details': {
            'classes': [],
            'id': 'vsckb-card-details-modal',
        },
        'clear-done': {
            'classes': [],
            'id': 'vsckb-clear-done-modal',
        },
        'delete-card': {
            'classes': [],
            'id': 'vsckb-delete-card-modal',
        },
        'edit-card': {
            'classes': [],
            'id': 'vsckb-edit-card-modal',
        },
    },
};

/**
 * Filed under a qualifying attribute alone, whatever its value.
 */
export const LEGACY_FOR_PRESENCE: { [attribute: string]: LegacyNames } = {
    'card-type': {
        'classes': [
            'vsckb-kanban-card-type',
        ],
    },
};
