import { BaseStore, Operation, OperationResults, Item, PutOperation, SearchOperation, GetOperation, ListNamespacesOperation } from "@langchain/langgraph";
import { SearchItem } from "@langchain/langgraph-checkpoint";
import { MongoHelper } from "../../mongo-helper";

export class MongoDbStore extends BaseStore {
    constructor(
        private readonly collectionName: string,
        private readonly dbHelper: MongoHelper,
    ) {
        super();
    }

    batch = async <Op extends Operation[]>(operations: Op): Promise<OperationResults<Op>> => {
        const results = [] as any;

        // We want to do this one-by-one, in case the operations affect each other.
        for (const op of operations) {
            const thisResult = (await this.handleOp(op)) as OperationResultType<typeof op>;
            results.push(thisResult);
        }

        return results;
    };

    private async handleOp(op: Operation): Promise<Item | Item[] | string[] | undefined> {
        if (isGetOperation(op)) {
            const result = await this.dbHelper.findDataItem<Item>(this.collectionName, { namespace: op.namespace, key: op.key }, { findOne: true });
            return result || undefined;

        } else if (isSearchOperation(op)) {
            const limit = op.limit || 10;
            const skip = op.offset || 0;

            // Assemble the query.
            const namespaceConditions = [] as any[];
            op.namespacePrefix.forEach((p, i) => {
                // There's nothing to match for wildcards.
                if (p !== '*') {
                    namespaceConditions.push({
                        $expr: {
                            $eq: [
                                {
                                    $arrayElemAt: ['$namespace', i]
                                },
                                p
                            ]
                        }
                    });
                }
            });

            const namespaceQuery = namespaceConditions ? [{ $match: { $and: namespaceConditions } }] : [];

            const filterConditions = [] as any[];
            if (op.filter) {
                /** Function to get the first, and only, property from an object. */
                function getOnlyProperty(target: object): { name: string, val: any; } {
                    const e = Object.entries(target);
                    if (e.length !== 1) {
                        throw new Error(`Expected 1 value, but got many in the query.`);
                    }
                    return {
                        name: e[0][0],
                        val: e[0][1]
                    };
                }

                const filterAndConditions = [];
                for (let n in op.filter) {
                    const val = op.filter[n];
                    if (typeof val === 'object') {
                        // Comparison operators.  There should only be one property in the target object.
                        const translation = getOnlyProperty(val);
                        // Add the comparison.
                        filterAndConditions.push({ [translation.name]: [`$value.${n}`, translation.val] });

                    } else {
                        // Direct equality.
                        filterAndConditions.push({ $eq: [`$value.${n}`, val] });
                    }
                }
                if (filterAndConditions.length > 0) {
                    filterConditions.push({ $match: { $expr: { $and: filterAndConditions } } });
                }
            }

            // Get distinct namespaces
            const namespaces = await this.dbHelper.makeCallWithCollection(this.collectionName, async (db, collection) => {
                const pipeline = [
                    ...namespaceQuery,
                    ...filterConditions,
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ];

                const results = await collection.aggregate(pipeline).toArray();
                return results as Item[];
            });

            return namespaces;

        } else if (isPutOperation(op)) {
            const action = op.value === null ? "Delete" : "Store/Update";

            if (action === "Delete") {
                // Delete the item
                await this.dbHelper.deleteDataItems(
                    this.collectionName,
                    { namespace: op.namespace, key: op.key }
                );

            } else {

                await this.dbHelper.makeCallWithCollection<undefined, Item>(this.collectionName, async (db, collection) => {
                    // Convenience variable.
                    const now = new Date();

                    // Try to update the existing object, if it exists.
                    const result = await collection.updateOne({ namespace: op.namespace, key: op.key }, { $set: { value: op.value!, updatedAt: now } });

                    if (result.modifiedCount < 1) {
                        // This is a new record.  We need to insert it.
                        const item: Item = {
                            namespace: op.namespace,
                            key: op.key,
                            value: op.value!,
                            createdAt: now,
                            updatedAt: now
                        };

                        await collection.insertOne(item);
                    }
                });
            }

            // Return undefined as put operations don't return a value
            return undefined;

        } else if (isListNamespacesOperation(op)) {
            const orQuery = [] as any[];
            const limit = op.limit || 10;
            const skip = op.offset || 0;

            // Handle match conditions if present
            if (op.matchConditions && op.matchConditions.length > 0) {
                const conditions = op.matchConditions.map(condition => {
                    // Get a copy of the array of path parts.
                    const path = condition.path.slice();
                    // Determine a multiplier to apply to the
                    //  indices of the search.
                    let indexMultiplier = 1; // For prefix

                    if (condition.matchType === "suffix") {
                        // Reverse the direction of the array
                        //  and set the multiplier to -1, so we're offsetting from the end.
                        indexMultiplier = -1;
                        path.reverse();
                    }

                    // Assemble the query.
                    const andConditions = [] as any[];
                    path.forEach((p, i) => {
                        // There's nothing to match for wildcards.
                        if (p !== '*') {
                            andConditions.push({
                                $eq: [
                                    {
                                        $arrayElementAt: ['$namespace', i * indexMultiplier]
                                    },
                                    p
                                ]
                            });
                        }
                    });

                    return { $and: andConditions };
                });

                if (conditions.length > 0) {
                    orQuery.push({ $match: { $or: conditions } });
                }
            }

            // Apply maxDepth if specified
            let depthFilter = [];
            if (op.maxDepth !== undefined) {
                depthFilter.push({
                    $match: {
                        $expr: {
                            $lte: [{ $size: "$_id" }, op.maxDepth]
                        }
                    }
                });
            }

            // Get distinct namespaces
            const namespaces = await this.dbHelper.makeCallWithCollection(this.collectionName, async (db, collection) => {
                const pipeline = [
                    {
                        $group: {
                            _id: "$namespace"
                        }
                    },
                    // Depth filter for array
                    {
                        $match: {
                            $expr: {
                                $lte: [{ $size: "$_id" }, op.maxDepth]
                            }
                        }
                    },
                    ...depthFilter,
                    ...orQuery,
                    {
                        $sort: { _id: 1 }
                    },
                    {
                        $skip: skip
                    },
                    {
                        $limit: limit
                    }
                ];

                const results = await collection.aggregate(pipeline).toArray();
                return results.map(r => r._id);
            });

            return namespaces;

        } else {
            throw new Error(`Unknown operation type: ${JSON.stringify(op)}`);
        }
    }
}

// Result type definitions for each operation
export type GetOperationResult = Item | null;
export type SearchOperationResult = SearchItem[];
export type PutOperationResult = void;
export type ListNamespacesOperationResult = string[][];
export type OperationResultTypes = GetOperationResult | SearchOperationResult | PutOperationResult | ListNamespacesOperationResult;
export type OperationResultType<T> =
    T extends PutOperation ? PutOperationResult :
    T extends SearchOperation ? SearchOperationResult :
    T extends GetOperation ? GetOperationResult :
    T extends ListNamespacesOperation ? ListNamespacesOperationResult :
    never;


// Type guards for Operation subtypes
/**
 * Type guard for GetOperation
 */
export function isGetOperation(op: Operation): op is GetOperation {
    return 'namespace' in op && 'key' in op && !('value' in op) && !('namespacePrefix' in op);
}

/**
 * Type guard for SearchOperation
 */
export function isSearchOperation(op: Operation): op is SearchOperation {
    return 'namespacePrefix' in op && !('key' in op) && !('namespace' in op && 'value' in op);
}

/**
 * Type guard for PutOperation
 */
export function isPutOperation(op: Operation): op is PutOperation {
    return 'namespace' in op && 'key' in op && 'value' in op;
}

/**
 * Type guard for ListNamespacesOperation
 */
export function isListNamespacesOperation(op: Operation): op is ListNamespacesOperation {
    return 'limit' in op && 'offset' in op && ('matchConditions' in op || 'maxDepth' in op);
}
