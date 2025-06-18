/*******
 *  Copied from PrimeNG, as this is the info sent in the lazy load requests.
 ***********/

export type FilterTypes = FilterMetadata | FilterMetadata[] | undefined;

export type FilterOperatorTypes = 'AND' | 'OR';

export type FilterDefinition = {
    [s: string]: FilterTypes;
};

/**
 * Meta data for lazy load event.
 * @group Interface
 */
export interface TableLoadRequest {
    first?: number | undefined | null;
    rows?: number | undefined | null;
    sortField?: string | string[] | null | undefined;
    sortOrder?: number | undefined | null;
    filters?: FilterDefinition;
    globalFilter?: string | string[] | undefined | null;
    multiSortMeta?: SortMeta[] | undefined | null;
    forceUpdate?: Function;
    last?: number | undefined | null;
}

/**
 * Represents metadata for filtering a data set.
 * @group Interface
 */
export interface FilterMetadata {
    /**
     * The value used for filtering.
     */
    value?: any;
    /**
     * The match mode for filtering.
     */
    matchMode?: FilterMatchMode;
    /**
     * The operator for filtering.
     */
    operator?: FilterOperatorTypes;
}


/**
 * Defines the possible match modes for filtering.
 * @group Type
 */
export type FilterMatchMode =
    | 'startsWith'
    | 'contains'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'in'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'is'
    | 'isNot'
    | 'before'
    | 'after';

/**
 * Represents metadata for sorting.
 * @group Interface
 */
export interface SortMeta {
    field: string;
    order: number;
}

export function isSortMeta(obj: any): obj is SortMeta {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.field === 'string' &&
        typeof obj.order === 'number'
    );
}

export function isFilterMetadata(obj: any): obj is FilterMetadata {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }

    // value can be any type, so no check
    if ('matchMode' in obj && obj.matchMode !== undefined && typeof obj.matchMode !== 'string') {
        return false;
    };

    if ('operator' in obj && obj.operator !== undefined && (obj.operator !== 'AND' && obj.operator !== 'OR')) {
        return false;
    };

    return true;
}