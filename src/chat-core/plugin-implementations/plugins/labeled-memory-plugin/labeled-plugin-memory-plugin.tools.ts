import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { z } from "zod";
import { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { nullToUndefined } from "../../../../utils/empty-and-null.utils";
import { BaseStore } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";


/** Returns the memory namespace for a specified LabeledMemoryPluginParams. */
function getNamespace(params: LabeledMemoryPluginParams): string[] {
    return [params.projectId.toString(), ...params.memoryKeyPrefix];
}


function createGetMemoryKeyTool(mongoStore: BaseStore, params: LabeledMemoryPluginParams) {
    const getMemoryKeyToolSchema = {
        name: 'retrieve_memory_item',
        description: `Retrieves a specific memory item, specified by its key array.`,
        schema: z.object({
            // namespace: z.array(z.string()).describe(`The array of keys to get the memory item of.  Think of this as a nested folder structure with a bunch of items inside.`),
            key: z.string().describe('The name of the memory item to retrieve from the specific namespace.')
        })
    };


    return tool(
        async ({ key: memoryItem }: z.infer<typeof getMemoryKeyToolSchema.schema>) => {
            return await mongoStore.get(getNamespace(params), memoryItem);
        },
        getMemoryKeyToolSchema
    );
};

function createListNamespacesMemoryTool(mongoStore: BaseStore, params: LabeledMemoryPluginParams) {
    const wildCardNote = `  Note: "*" may be used as a wildcard.  Only use this when you know the keys surrounding another key, and you don't care what the surrounded key is.`;
    const listNamespacesSchema = {
        name: 'list_namespaces',
        description: `Allows search and listing of namespaces in the system.`,
        schema: z.object({
            prefix: z.array(z.string()).nullable().optional().describe(`OPTIONAL: A list of keys that the namespace must start with.${wildCardNote}`),
            suffix: z.array(z.string()).nullable().optional().describe(`OPTIONAL: A list of keys that the namespace must end with.${wildCardNote}`),
            maxDepth: z.number().int().nullable().optional().describe(`OPTIONAL: The maximum number of keys that composes the namespace you're looking for.`),
            limit: z.number().int().nullable().optional().describe(`OPTIONAL: The max number of results to retrieve.`),
            offset: z.number().int().nullable().optional().describe(`OPTIONAL: The offset in the results to start returning items from.`)
        })
    };

    return tool(
        async (options: z.infer<typeof listNamespacesSchema.schema>) => {
            // Convert null to undefined.
            const newOptions = nullToUndefined(options);
            return await mongoStore.listNamespaces(newOptions as any);
        },
        listNamespacesSchema
    );
};

function createPutMemoryTool(mongoStore: BaseStore, params: LabeledMemoryPluginParams) {
    const putMemoryToolSchema = {
        name: 'store_or_update_memory_item',
        description: `Stores or updates a memory item in the specified namespace.`,
        schema: z.object({
            // namespace: z.array(z.string()).describe('The array of keys representing the namespace.  This must be an array of strings, like ["key1", "key2", "key3"]'),
            key: z.string().describe('The name of the memory item to store or update.'),
            // value: z.record(z.any()).describe('The data to store for this memory item.  This is a record set of values, like {"firstProp": 1, "secondProp": "two"}'),
            value: z.object({}).passthrough().describe('The data to store for this memory item.  This is a record set of values, like {"firstProp": 1, "secondProp": "two"}'),
        })
    };
    return tool(
        async ({ key, value }: z.infer<typeof putMemoryToolSchema.schema>) => {
            await mongoStore.put(getNamespace(params), key, value);
            return { success: true };
        },
        putMemoryToolSchema
    );
}

function createDeleteMemoryTool(mongoStore: BaseStore, params: LabeledMemoryPluginParams) {
    const deleteMemoryToolSchema = {
        name: 'delete_memory_item',
        description: `Deletes a memory item from the specified namespace.`,
        schema: z.object({
            // namespace: z.array(z.string()).describe('The array of keys representing the namespace.'),
            key: z.string().describe('The name of the memory item to delete.')
        })
    };
    return tool(
        async ({ key }: z.infer<typeof deleteMemoryToolSchema.schema>) => {
            await mongoStore.delete(getNamespace(params), key);
            return { success: true };
        },
        deleteMemoryToolSchema
    );
}

function createSearchMemoryItemsTool(mongoStore: BaseStore, params: LabeledMemoryPluginParams) {
    const searchMemoryItemsToolSchema = {
        name: 'search_memory_items',
        description: `Searches for memory items within a namespace prefix, with optional filters and semantic query.`,
        schema: z.object({
            // namespacePrefix: z.array(z.string()).describe('The array of keys representing the namespace prefix.'),
            filter: z.record(z.any()).optional().describe('Optional filter for exact matches or comparison operators.'),
            limit: z.number().int().optional().describe('Maximum number of items to return.'),
            offset: z.number().int().optional().describe('Number of items to skip before returning results.'),
            query: z.string().optional().describe('Natural language search query for semantic search.')
        })
    };
    return tool(
        async (options: z.infer<typeof searchMemoryItemsToolSchema.schema>) => {
            return await mongoStore.search(getNamespace(params), options);
        },
        searchMemoryItemsToolSchema
    );
}

/** Returns all of the tools needed for the LabeledMemoryPluginParams. */
export function getMemoryTools(mongoStore: BaseStore, params: LabeledMemoryPluginParams, isForWriteOperations: boolean) {
    const result: (ToolNode | StructuredToolInterface)[] = [
        createGetMemoryKeyTool(mongoStore, params),
        // createListNamespacesMemoryTool(mongoStore, params),
        createSearchMemoryItemsTool(mongoStore, params),
    ];

    if (params.canWrite && isForWriteOperations) {
        result.push(...[
            createPutMemoryTool(mongoStore, params),
            createDeleteMemoryTool(mongoStore, params),
        ]);
    }

    return result;
}