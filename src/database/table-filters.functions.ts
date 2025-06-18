import { FilterTypes, FilterMetadata, FilterOperatorTypes, FilterDefinition, SortMeta, TableLoadRequest } from "../model/shared-models/table-load-request.model";

// /**
//  * Generates a MongoDB aggregation pipeline for filtering based on LazyLoadMeta.
//  * @param filters - Filters metadata from LazyLoadMeta.
//  * @returns MongoDB aggregation pipeline stages for filtering.
//  */
// export function generateFilterPipeline(filters?: FilterDefinition): any[] {
//     const pipeline: any[] = [];



//     if (filters) {
//         Object.entries(filters).forEach(([field, filter]) => {
//             if (Array.isArray(filter)) {
//                 const orConditions = filter.map(f => createFilterCondition(field, f));
//                 pipeline.push({ $match: { $or: orConditions } });
//             } else if (filter) {
//                 const condition = createFilterCondition(field, filter);
//                 pipeline.push({ $match: condition });
//             }
//         });
//     }

//     return pipeline;
// }

type CreateArrayFilterReturnType = { $or?: any[], $and?: any[]; };
function createArrayFilter(fieldName: string, filters: FilterMetadata[]): CreateArrayFilterReturnType | undefined {
    if (filters.length < 1) {
        return undefined;
    }

    function getOperator(filter: FilterTypes): FilterOperatorTypes {
        if (!filter || Array.isArray(filter)) {
            return 'OR';
        }

        return filter.operator === 'AND'
            ? 'AND'
            : 'OR';
    }

    // The final return value, holding the result of all filters.
    const finalResultArray = [] as any[];
    const finalResult: CreateArrayFilterReturnType = getOperator(filters[0]) === 'OR'
        ? { $or: finalResultArray }
        : { $and: finalResultArray };

    // We must keep building new filters to nest in the last filter.  This is the current
    //  filter being built, and placed in the previous value.
    // We start with the return filter, since it might be all that's needed without nesting more filters.
    let currentReturnOperatorType = getOperator(filters[0]);
    let currentResultArray = [] as any[];
    let currentResult: CreateArrayFilterReturnType = finalResult;

    /** This function will create new filter values to build, and place them in the
     *   previous filter set, making them part of the final result. */
    function startNewOperatorSet(operator: FilterOperatorTypes): void {
        // Create the new result set that we'll replace the current result set with.
        const newResultArray = [] as any[];
        const newResult: CreateArrayFilterReturnType = operator === 'OR'
            ? { $or: newResultArray }
            : { $and: newResultArray };

        // Add this to the current result set.
        currentResultArray.push(newResult);

        // Replace the old result set with the new.
        currentResultArray = newResultArray;
        currentResult = newResult;
        currentReturnOperatorType = operator;
    }

    // For each filter, create a filter, and place it in the most recent filter result set.
    filters.forEach(f => {
        if (Array.isArray(f)) {
            // If no content, then just skip this item.
            if (f.length > 0) {
                currentResultArray.push(createArrayFilter(fieldName, f)!);
            }
        } else if (typeof f === 'object' && !!f) {
            // Get the operator type for this filter.
            const operator = getOperator(f);

            // Compare the operator types.
            if (operator !== currentReturnOperatorType) {
                // We need to switch our array up.
                startNewOperatorSet(operator);
            }

            // Add the current filter to the operator set.
            currentResultArray.push(createFilterCondition(fieldName, f));
        }
    });

    // Return the final result.
    return currentResult;
}

/**
 * Generates a MongoDB aggregation pipeline for filtering based on LazyLoadMeta.
 * @param filters - Filters metadata from LazyLoadMeta.
 * @returns MongoDB aggregation pipeline stages for filtering.
 */
export function generateFilterPipeline(filters?: FilterDefinition): any[] {
    const pipeline: any[] = [];

    if (filters) {
        Object.entries(filters).forEach(([field, filter]) => {
            if (Array.isArray(filter)) {
                pipeline.push({ $match: createArrayFilter(field, filter) });
            } else if (filter) {
                const condition = createFilterCondition(field, filter);
                pipeline.push({ $match: condition });
            }
        });
    }

    return pipeline;
}

/**
 * Creates a MongoDB filter condition based on FilterMetadata.
 * @param field - The field to filter.
 * @param filter - Filter metadata.
 * @returns MongoDB filter condition.
 */
function createFilterCondition(field: string, filter: FilterMetadata): any {
    const { value, matchMode } = filter;

    switch (matchMode) {
        case 'startsWith':
            return { [field]: { $regex: `^${value}`, $options: 'i' } };
        case 'contains':
            return { [field]: { $regex: value, $options: 'i' } };
        case 'endsWith':
            return { [field]: { $regex: `${value}$`, $options: 'i' } };
        case 'equals':
            return { [field]: value };
        case 'notEquals':
            return { [field]: { $ne: value } };
        case 'in':
            return { [field]: { $in: value } };
        case 'lt':
            return { [field]: { $lt: value } };
        case 'lte':
            return { [field]: { $lte: value } };
        case 'gt':
            return { [field]: { $gt: value } };
        case 'gte':
            return { [field]: { $gte: value } };
        case 'before':
            return { [field]: { $lt: value } };
        case 'after':
            return { [field]: { $gt: value } };
        default:
            return {};
    }
}

/**
 * Generates a MongoDB aggregation pipeline for sorting based on LazyLoadMeta.
 * @param sortMeta - Sorting metadata from LazyLoadMeta.
 * @returns MongoDB aggregation pipeline stages for sorting.
 */
export function generateSortPipeline(sortMeta: SortMeta[] | undefined): any[] {
    const pipeline: any[] = [];

    if (sortMeta && Object.entries(sortMeta).length > 0) {
        const sortStage: any = {};
        sortMeta.forEach(({ field, order }) => {
            sortStage[field] = order;
        });
        pipeline.push({ $sort: sortStage });
    }

    return pipeline;
}

/**
 * Combines filter and sort pipelines into a single MongoDB aggregation pipeline.
 * @param tableLoadRequest - LazyLoadMeta containing filters and sorting metadata.
 * @returns Combined MongoDB aggregation pipeline.
 */
export function generateAggregatePipeline(tableLoadRequest: TableLoadRequest): any[] {
    const filterPipeline = generateFilterPipeline(tableLoadRequest.filters || {});
    const sortPipeline = generateSortPipeline(tableLoadRequest.multiSortMeta || []);

    return [...filterPipeline, ...sortPipeline];
}