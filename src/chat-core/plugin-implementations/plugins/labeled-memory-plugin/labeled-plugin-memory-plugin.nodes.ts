import { BaseMessage, SystemMessage } from "@langchain/core/messages";
import { LabeledMemoryPluginState } from "./labeled-plugin-memory-plugin.state";
import { LabeledMemoryPluginParams } from "../../../../model/shared-models/chat-core/plugins/labeled-memory-plugin.params";

/** Returns the message history (and new messages) needed for the memory plugin to retrieve data from the memory store. */
function getRetrievalInstructions(params: LabeledMemoryPluginParams, messageHistory: BaseMessage[]): BaseMessage[] {
    const instructions: BaseMessage[] = [
        new SystemMessage(`You are a memory manager for an LLM.  You inspect memory data that can be included in chat calls, and provide it to the main LLM for their use.`),
        new SystemMessage(`The following is the purpose of this particular memory set you should be concerned with:\n${params.memorySetPurpose}`),
        ...messageHistory,
        new SystemMessage(`You MUST call one ore more functions for your response.`),
    ];

    return instructions;
}

function describeMemoryKeys(memoryKeyDescriptions: string[]) {
    return memoryKeyDescriptions.map((d, i) => `Key ${i}: ${d}\n`);
}

/** Returns the message history (and new messages) needed for the memory plugin to retrieve data from the memory store. */
function getStorageInstructions(params: LabeledMemoryPluginParams, messageHistory: BaseMessage[]): BaseMessage[] {
    const instructions: BaseMessage[] = [
        new SystemMessage(`You are a memory manager for an LLM.  You inspect conversation histories and decide what information to retain for long-term use.\nSince you are involved in each message call made, you should be most interested in more recent messages within the history.`),
        new SystemMessage(`The following is the purpose of this particular memory set you should be concerned with:\n${params.memorySetPurpose}`),
        new SystemMessage(`When storing messages, they must be done in an array of key values for its index.  These key values are sort of like folders/nested folders, and can help drill into subjects more easily.  The description of each of the keys you have access to add data for are as follows: ${describeMemoryKeys(params.keyMeanings)}`),
        ...messageHistory,
        new SystemMessage(`You MUST call one ore more functions for your response.`),
    ];

    return instructions;
}

export async function initializeCall(state: typeof LabeledMemoryPluginState.State) {
    // Get the right message history.
    if (state.operationType === 'retrieve') {
        state.messages = getRetrievalInstructions(state.memoryParams, state.messages);
    } else if (state.operationType === 'store') {
        state.messages = getStorageInstructions(state.memoryParams, state.messages);
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