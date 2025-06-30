import { AIMessage, AIMessageChunk, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { ChatCallState, ChatState } from "./chat-room.state";
import { insertPositionableMessages } from "../../../utilities/insert-positionable-messages.util";


/**
 * Adds the user's message to the message history and prepares the initial chat state.
 */
export async function startChatCall(state: typeof ChatCallState.State): Promise<typeof ChatState.State> {
    // Return the updated state for the next node
    return {
        callMessages: state.messageHistory.slice(),
        chatModel: state.chatModel,
        messageHistory: state.messageHistory,
        lifetimeContributors: state.lifetimeContributors,
        tools: [], // This will be filled in later.
        makeReplyCall: false,
        replyCount: 0,
    };
}

/**
 * Calls the initialize method on all lifetime contributors that implement it.
 */
export async function initializeLifetime(state: typeof ChatState.State) {
    // Gather all initialize promises from contributors that implement the method
    const initializePromises = state.lifetimeContributors
        .filter(c => typeof c.initialize === 'function')
        .map(c => c.initialize!());

    // Wait for all contributors to finish initialization
    await Promise.all(initializePromises);

    return state;
}

/**
 * Calls the preChat method on all lifetime contributors that implement it, allowing them to process callMessages before chat starts.
 */
export async function preChat(state: typeof ChatState.State) {
    // Let each contributor process callMessages before chat starts
    const preChatPromises = state.lifetimeContributors
        .filter(c => typeof c.preChat === 'function')
        .map(c => c.preChat!(state.callMessages));

    // Wait for all preChat hooks to complete
    await Promise.all(preChatPromises);

    return state;
}

/**
 * Allows each lifetime contributor to modify the callMessages before the chat call is made.
 */
export async function modifyCallMessages(state: typeof ChatState.State) {
    let callMessages = state.callMessages;
    // Allow each contributor to modify the callMessages in sequence
    for (const contributor of state.lifetimeContributors) {
        if (typeof contributor.modifyCallMessages === 'function') {
            callMessages = await contributor.modifyCallMessages(callMessages);
        }
    }

    // Update the message history with the modified messages
    state.messageHistory = callMessages;

    return state;
}

/**
 * Collects pre-chat messages from all contributors that implement addPreChatMessages and prepends them to callMessages.
 */
export async function addPreChatMessages(state: typeof ChatState.State) {
    const chatCallInfo = { replyNumber: state.replyCount };

    let preChatMessages: any[] = [];
    // Collect pre-chat messages from all contributors
    for (const contributor of state.lifetimeContributors) {
        if (typeof contributor.addPreChatMessages === 'function') {
            const msgs = await contributor.addPreChatMessages(chatCallInfo);
            preChatMessages = preChatMessages.concat(msgs);
        }
    }

    // Prepend pre-chat messages to the callMessages
    state.callMessages = preChatMessages.concat(state.callMessages);

    return state;
}

/**
 * Handles the reply from the chat call by letting contributors process the reply and insert any new messages if needed.
 */
export async function handleReply(state: typeof ChatState.State, reply: any) {
    // Let each contributor handle the reply if they implement handleReply
    const handlePromises = state.lifetimeContributors
        .filter(c => typeof c.handleReply === 'function')
        .map(c => c.handleReply!(reply));
    const replyResults = await Promise.all(handlePromises);

    // Filter out undefined results (contributors that didn't add messages)
    const newMessages = replyResults.filter(r => !!r);

    // Flatten the array of arrays into a single array
    const flattened = newMessages.reduce((p, c) => {
        p.push(...c);
        return p;
    }, []);

    if (flattened.length > 0) {
        // Insert the new messages into the callMessages list
        insertPositionableMessages(flattened, state.callMessages);
        // Indicate that a reply call should be made
        state.makeReplyCall = true;
    }

    return state;
}

/**
 * Calls chatComplete on all contributors that implement it, allowing them to finalize or clean up after the chat is complete.
 */
export async function chatComplete(state: typeof ChatState.State) {
    // Let all contributors finalize or clean up after the chat is complete
    const promises = state.lifetimeContributors
        .filter(c => typeof c.chatComplete === 'function')
        .map(c => c.chatComplete!(state.messageHistory.slice()));

    // Wait for all chatComplete hooks to finish
    await Promise.all(promises);

    // Return the final state
    return state;
}

/** Adds the tools from the lifetimeContributors, to the state, so they can be defined and called. */
export async function getTools(state: typeof ChatState.State) {
    const toolPromises = state.lifetimeContributors.filter(c => !!c.getTools).map(c => c.getTools!());
    const toolList = (await Promise.all(toolPromises)).filter(x => !!x).reduce((p, c) => [...p, ...c], []);
    state.tools = toolList;
    return state;
}

/** Calls the tools from a chat call response. */
export async function callTools(state: typeof ChatState.State) {
    // Get the tool call.
    const toolMessage = state.messageHistory[state.messageHistory.length - 1] as AIMessage;

    // Ensure we have tool calls.  Otherwise, we probably shouldn't be here.
    if (!toolMessage.tool_calls) {
        throw new Error(`No tool_calls were found on the last message of the messageHistory.`);
    }

    // Call the tools.
    const tollCallPromises = toolMessage.tool_calls.map(async toolCall => {
        // Find the tool for this call.
        const tool = state.tools.find(t => t.name === toolCall.name);

        // If not found, then we have a problem.
        if (!tool) {
            throw new Error(`Tool ${toolCall.name} was not found in the tool list.`);
        }

        // Execute the tool.
        const toolResult = await tool.invoke(toolCall.args);

        // Return the tool message as a result.
        const toolMessage = new ToolMessage(toolResult?.toString() ?? '', toolCall.id!);
        return toolMessage;
    });

    const results = await Promise.all(tollCallPromises);
    // Add the responses to the message list.
    state.callMessages.push(...results);
    state.messageHistory.push(...results);
}

/**
 * The main chat call node. This is where the actual chat logic (e.g., LLM call) would be implemented.
 */
export async function chatCall(state: typeof ChatState.State) {
    // Reset makeReplyCall since this is a new chat call
    state.makeReplyCall = false;

    const tools = state.tools;

    // Get the LLM.  Handle the addition to the tools, if we can.
    let llm = state.chatModel;

    // Make the LLM call.
    let result: AIMessageChunk;
    if (llm.bindTools && tools.length > 0) {
        result = await llm.bindTools(tools).invoke(state.callMessages);
    } else {
        result = await llm.invoke(state.callMessages);
    }

    // Add the result to the message stacks.
    state.callMessages.push(result);
    state.messageHistory.push(result);

    // For now, just return the state as-is
    return state;
}

