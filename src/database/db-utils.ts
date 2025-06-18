import { Document } from 'mongodb';
import { UpsertDbItem } from '../model/shared-models/db-operation-types.model';
import { PaginatedResult } from '../model/shared-models/paginated-result.model';

/** Returns the search query to use in a mongodb update/upsert operation.
 *   If the _id is not set, we must provide an empty object for the search query.
 *   Otherwise, we need to provide an object with an _id value.
 */
export function getUpsertMatchObject(target: UpsertDbItem<any>): object {
    if (!target._id) {
        return {};
    }

    return { _id: target._id };
}

/** Returns the pipeline operations to get a paginated set from the database. */
export function getPaginatedPipelineEnding(skip: number, limit: number): object[] {
    return [
        {
            $facet: {
                // The actual results.
                result: [
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ],

                // The total count of items in the list.
                totalCount: [
                    {
                        $count: 'totalCount'
                    }
                ]
            }
        }
    ];
}

export interface MongoPaginatedResult<T> {
    result: T[],
    totalCount: {
        totalCount: number;
    };
}

/** Returns a PaginatedResult from the pipeline results in MongoDb, when using the standard getPaginatedPipelineEnding for paginating results. */
export function unpackPaginatedResults<T>(resultsArray: Document[]): PaginatedResult<T> {

    // There's only one item in this result list.  get it.
    const results = (resultsArray)[0];

    // Return the result.
    return {
        data: results.result,
        totalCount: results.totalCount[0].totalCount
    };
}