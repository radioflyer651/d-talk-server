

export interface PaginatedResult<T> {
    /** Returns the page of data for an associated query. */
    data: T[];

    /** Returns the total number of results that can be returned for the associated query. */
    totalCount: number;
}

/** Returns a PaginatedResult object with specified inputs. */
export function getPaginatedResult<T>(data: T[], totalResults: number): PaginatedResult<T> {
    return {
        data,
        totalCount: totalResults
    };
}