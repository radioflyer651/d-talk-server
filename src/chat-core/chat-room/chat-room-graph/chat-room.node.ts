import { BaseMessage, AIMessage, ToolMessage, AIMessageChunk } from "@langchain/core/messages";
import { PositionableMessage } from "../../../model/shared-models/chat-core/positionable-message.model";
import { insertPositionableMessages } from "../../utilities/insert-positionable-messages.util";
import { setMessageId } from "../../utilities/set-message-id.util";
import { ChatCallState, ChatState } from "./chat-room.state";
import { ChatCallInfo, IChatLifetimeContributor } from "../../chat-lifetime-contributor.interface";

/** Returns a sorted version of the lifetime contributor list. */
function getSortedContributors(contributors: IChatLifetimeContributor[], direction: 'forward' | 'reverse'): IChatLifetimeContributor[] {
    const copy = contributors.slice();

    if (direction === 'forward') {
        copy.sort((v1, v2) => {
            const order1 = v1.priority ?? 0;
            const order2 = v2.priority ?? 0;

            return order1 - order2;
        });
    } else {
        copy.sort((v1, v2) => {
            const order1 = v1.priority ?? 0;
            const order2 = v2.priority ?? 0;

            return order2 - order1;
        });
    }

    return copy;
}

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
        newMessages: []
    };
}

/**
 * Calls the initialize method on all lifetime contributors that implement it.
 */
export async function initializeLifetime(state: typeof ChatState.State) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'forward');

    // Gather all initialize promises from contributors that implement the method
    const initializePromises = contributors
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
    const contributors = getSortedContributors(state.lifetimeContributors, 'forward');

    // Let each contributor process callMessages before chat starts
    const preChatPromises = contributors
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
    const contributors = getSortedContributors(state.lifetimeContributors, 'forward');

    let callMessages = state.callMessages;
    // Allow each contributor to modify the callMessages in sequence
    for (const contributor of contributors) {
        if (typeof contributor.modifyCallMessages === 'function') {
            callMessages = await contributor.modifyCallMessages(callMessages);
        }
    }

    state.callMessages = callMessages;

    return state;
}

/**
 * Collects pre-chat messages from all contributors that implement addPreChatMessages and prepends them to callMessages.
 */
export async function addPreChatMessages(state: typeof ChatState.State) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'forward');

    const chatCallInfo: ChatCallInfo = { replyNumber: state.replyCount, callMessages: state.callMessages, messageHistory: state.messageHistory };

    let preChatMessages: PositionableMessage<BaseMessage>[] = [];
    // Collect pre-chat messages from all contributors
    for (const contributor of contributors) {
        if (typeof contributor.addPreChatMessages === 'function') {
            const msgs = await contributor.addPreChatMessages(chatCallInfo);
            preChatMessages = preChatMessages.concat(msgs);
        }
    }

    // Prepend pre-chat messages to the callMessages
    state.callMessages = insertPositionableMessages(preChatMessages, state.callMessages);
    return state;
}

export async function inspectChatCallMessages(state: typeof ChatState.State) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'reverse');

    // Let all contributors finalize or clean up after the chat is complete
    const promises = contributors
        .filter(c => typeof c.inspectChatCallMessages === 'function')
        .map(c => c.inspectChatCallMessages!(state.callMessages.slice(), state.messageHistory.slice()));

    // Wait for all chatComplete hooks to finish
    await Promise.all(promises);

    // Return the final state
    return state;
}

/**
 * Handles the reply from the chat call by letting contributors process the reply and insert any new messages if needed.
 */
export async function handleReply(state: typeof ChatState.State, reply: any) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'reverse');

    // Let each contributor handle the reply if they implement handleReply
    const handlePromises = contributors
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
    const contributors = getSortedContributors(state.lifetimeContributors, 'reverse');

    // Let all contributors finalize or clean up after the chat is complete
    const promises = contributors
        .filter(c => typeof c.chatComplete === 'function')
        .map(c => c.chatComplete!(state.messageHistory.slice(), state.newMessages.slice()));

    // Wait for all chatComplete hooks to finish
    await Promise.all(promises);

    // Return the final state
    return state;
}

/** Adds the tools from the lifetimeContributors, to the state, so they can be defined and called. */
export async function getTools(state: typeof ChatState.State) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'forward');

    const toolPromises = contributors.filter(c => !!c.getTools).map(c => c.getTools!());
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
    const toolCallPromises = toolMessage.tool_calls.map(async toolCall => {
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
        setMessageId(toolMessage);

        return toolMessage;
    });

    const results = await Promise.all(toolCallPromises);
    // Add the responses to the message list.
    state.callMessages.push(...results);
    state.messageHistory.push(...results);
    state.newMessages.push(...results);

}

/** Calls the peekToolCallMessages on each lifetime contributor, allowing it to react to the new tool messages before they're passed back to the LLM.. */
export async function peekToolCallMessages(state: typeof ChatState.State) {
    const contributors = getSortedContributors(state.lifetimeContributors, 'reverse');

    for (const contributor of contributors) {
        if (typeof contributor.peekToolCallMessages === 'function') {
            await contributor.peekToolCallMessages(state.messageHistory, state.callMessages, state.newMessages);
        }
    }
    return state;
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

    setMessageId(result);

    // Add the result to the message stacks.
    state.callMessages.push(result);
    state.messageHistory.push(result);
    state.newMessages.push(result);

    // For now, just return the state as-is
    return state;
}

