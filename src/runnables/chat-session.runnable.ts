import { Annotation, BaseStore, InMemoryStore, Operation, OperationResults } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { Collection, MongoClient, ObjectId } from "mongodb";
import { MongoDBChatMessageHistory, MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { BufferMemory } from 'langchain/memory';
import { createReactAgent, ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from "@langchain/openai";
import { Embeddings } from "openai/resources/embeddings";
import { AIMessage, BaseMessage, ChatMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

// Import the specific operation types to make TypeScript recognize them
import {
    GetOperation,
    SearchOperation,
    PutOperation,
    ListNamespacesOperation,
    Item,
    SearchItem
} from "@langchain/langgraph-checkpoint/dist/store/base";
import { MongoHelper } from "../mongo-helper";


export async function runMe() {
    const client = await MongoClient.connect('');
    const database = await client.db('');
    const collection = await database.collection('');
    const store = new MongoDBStore({ collection: collection, namespace: 'asdf' });
    const inMem = new InMemoryStore();
    const chatH = new MongoDBChatMessageHistory({ collection, sessionId: '' });
    const bm = new BufferMemory();

    const x = new MongoDBSaver({ client: client, dbName: '', checkpointCollectionName: '' });

    const updateTabletMemory = async (state: typeof ChatMessageAnnotation.State) => {
        const llm = new ChatOpenAI({
            temperature: 0,
            model: '',
        }) as BaseChatModel;

        const instruction = new SystemMessage(`
                    Before responding to the user's next message, update your AI tablet.
                    Use the xxx functions to do so.
            `);

        const theseMessages = [
            ...state.messages,
            instruction,
        ];

        const result = await llm.invoke(theseMessages, {});

        if (result.tool_calls?.length) {

        }
    };

    const toolNode = new ToolNode([], {});
    toolNode.invoke();

}

export const ChatMessageAnnotation = Annotation.Root({
    ...Xt.MessagesAnnotation.spec,
    systemMessages: Annotation<BaseMessage[]>,
    memoryMessages: Annotation<string[]>,
    toolCalls: Annotation<ToolMessage[] | undefined>
});

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

    private async handleOp<Op extends Operation>(op: Operation): Promise<Item | undefined> {
        if (isGetOperation(op)) {
            const result = await this.dbHelper.findDataItem<Item>(this.collectionName, { namespace: op.namespace, key: op.key }, { findOne: true });
            return result || undefined;

        } else if (isSearchOperation(op)) {
            const query: Record<string, any> = { namespace: { $regex: `^${op.namespacePrefix.join('/')}` } };

            // Add filters if they exist
            if (op.filter) {
                Object.entries(op.filter).forEach(([key, value]) => {
                    query[`value.${key}`] = value;
                });
            }

            const limit = op.limit || 10;
            const skip = op.offset || 0;

            // If there's a query string for semantic search, we'd need to implement 
            // vector search here, but for now return filtered items
            const results = await this.dbHelper.findDataItem<Item>(
                this.collectionName,
                query,
                { findOne: false, skip, limit }
            );

            // Return undefined as this isn't a single-item response
            return undefined;

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
                    if (condition.matchType === "prefix") {
                        const prefix = condition.path
                            .filter(segment => segment !== "*")
                            .join("/");
                        return { namespace: { $regex: `^${prefix}` } };
                    } else if (condition.matchType === "suffix") {
                        const suffix = condition.path
                            .filter(segment => segment !== "*")
                            .join("/");
                        return { namespace: { $regex: `${suffix}$` } };
                    }
                    return {};
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
                        $not: {
                            $regex: new RegExp(`^[^/]+(\/[^/]+){${op.maxDepth + 1},}$`)
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

            // Return undefined as this operation returns namespace arrays in batch
            return undefined;

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
