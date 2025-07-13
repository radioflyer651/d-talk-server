import { AIMessage, BaseMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { LabeledMemoryPluginState } from "./labeled-plugin-memory-plugin.state";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";
import { getMemoryTools } from "./labeled-plugin-memory-plugin.tools";
import { END } from "@langchain/langgraph";

const memoryStoreInstructions =
    `
The memory functions you use are implementations of the BaseStore from LangChain (@langchain/langgraph).
Memory is stored in namespaces.  Each namespace is defined by an array of strings (string[]).
Each namespace has a set of values within it.
Each value is a dictionary ({[key: string]: any})
`;

/** Returns the message history (and new messages) needed for the memory plugin to retrieve data from the memory store. */
function getRetrievalInstructions(params: LabeledMemoryPluginParams, messageHistory: BaseMessage[]): BaseMessage[] {
    const instructions: BaseMessage[] = [
        new SystemMessage(`You are a memory manager for an LLM.  You inspect memory data that can be included in chat calls, and provide it to the main LLM for their use.`),
        new SystemMessage(memoryStoreInstructions),
        new SystemMessage(`The following is the purpose of this particular memory set you should be concerned with:\n${params.memorySetPurpose}`),
        ...messageHistory,
    ];

    return instructions;
};

function describeMemoryKeys(memoryKeyDescriptions: string[]) {
    return memoryKeyDescriptions.map((d, i) => `Key ${i}: ${d}\n`);
}

/** Returns the message history (and new messages) needed for the memory plugin to retrieve data from the memory store. */
function getStorageInstructions(params: LabeledMemoryPluginParams, messageHistory: BaseMessage[]): BaseMessage[] {
    const instructions: BaseMessage[] = [
        new SystemMessage(`You are a memory manager for an LLM.  You inspect conversation histories and decide what information to retain for long-term use.\nSince you are involved in each message call made, you should be most interested in more recent messages within the history.`),
        new SystemMessage(memoryStoreInstructions),
        new SystemMessage(`The following is the purpose of this particular memory set you should be concerned with:\n${params.memorySetPurpose}`),
        new SystemMessage(`When storing messages, they must be done in an array of key values for its index.  These key values are sort of like folders/nested folders, and can help drill into subjects more easily.  The description of each of the keys you have access to add data for are as follows: ${describeMemoryKeys(params.keyMeanings)}`),
        ...messageHistory,
    ];

    return instructions;
}

export async function initializeCall(state: typeof LabeledMemoryPluginState.State) {
    state.tools = getMemoryTools(state.store, state.memoryParams, state.operationType === 'store');
    return state;
}

export async function addMemoryInstructions(state: typeof LabeledMemoryPluginState.State) {
    // Get the right message history.
    if (state.operationType === 'retrieve') {
        state.messages = getRetrievalInstructions(state.memoryParams, state.originalChatHistory);
    } else if (state.operationType === 'store') {
        state.messages = getStorageInstructions(state.memoryParams, state.originalChatHistory);
    } else {
        throw new Error(`Memory operation type not implemented: ${state.operationType}`);
    }

    return state;
}

/** Performs the LLM chat call for memory retrieval. */
export async function performMemoryCall(state: typeof LabeledMemoryPluginState.State) {
    const tools = state.tools;

    // Get the LLM.  Handle the addition to the tools, if we can.
    let llm = state.chatModel;

    // Make the LLM call.
    const result = await llm.bindTools!(tools).invoke(state.messages);
    state.messages.push(result);

    // For now, just return the state as-is
    return state;
}

export async function summarizeMemoryData(state: typeof LabeledMemoryPluginState.State) {
    state.messages.push(new SystemMessage(`Add a summary of the data you believe the main LLM should know from your memory operations.`));

    // Get the LLM.  Handle the addition to the tools, if we can.
    let llm = state.chatModel;

    // Make the LLM call.
    const result = await llm.invoke(state.messages);
    state.resultingMemoryMessages = [result];

    // For now, just return the state as-is
    return state;
}

export async function isMemoryOperationsCompleteDecider(state: typeof LabeledMemoryPluginState.State) {
    // Get the last message in the history.
    const aiMessage = state.messages[state.messages.length - 1] as AIMessage;

    // Call the tools if we have tools to call.
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        return 'call-tools';
    }

    // We should summarize the results if we're retrieving memories.
    if (state.operationType === 'retrieve') {
        return 'summarize-results';
    }

    // We're storing memories.  There's nothing else to do here.
    return END;
}


/** Calls the tools from a chat call response. */
export async function callTools(state: typeof LabeledMemoryPluginState.State) {
    // Get the tool call.
    const toolMessage = state.messages[state.messages.length - 1] as AIMessage;

    // Ensure we have tool calls.  Otherwise, we probably shouldn't be here.
    if (!toolMessage.tool_calls) {
        throw new Error(`No tool_calls were found on the last message of the messageHistory.`);
    }

    // Call the tools.
    const toolCallPromises = toolMessage.tool_calls.map(async toolCall => {
        // Find the tool for this call.
        const tool = state.tools.find(t => (t as any)['name'] === toolCall.name);

        // If not found, then we have a problem.
        if (!tool) {
            throw new Error(`Tool ${toolCall.name} was not found in the tool list.`);
        }

        // Execute the tool.
        const toolResult = await tool.invoke(toolCall.args);

        // Return the tool message as a result.
        const toolMessage = new ToolMessage(JSON.stringify(toolResult) ?? '', toolCall.id!);

        return toolMessage;
    });

    // Wait til everything is done.
    const results = await Promise.all(toolCallPromises);

    // Add the responses to the message list.
    state.messages.push(...results);
}