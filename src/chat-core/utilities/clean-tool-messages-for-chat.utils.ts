import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { copyBaseMessages } from "../../utils/copy-base-message.utils";
import { MessageGroupingState } from "./message-grouping-state.utils";



/** Ensures that all tool calls are not human messages, and that the tool calls have a preceding tool_call message. */
export function cleanToolMessagesForChat2(messageHistory: BaseMessage[]) {
    if (messageHistory.length < 2) {
        return messageHistory.slice();
    }

    // Create a copy of the set, so we can really mess with it.
    messageHistory = copyBaseMessages(messageHistory);

    let hasToolAiCall = false;
    const deleteIndexes = [] as number[];

    for (let i = 0; i < messageHistory.length - 1; i++) {
        const m1 = messageHistory[i];

        if (m1.getType() === 'ai') {
            const aiMessage = m1 as AIMessage;
            if (aiMessage.tool_calls?.length ?? 0 > 0) {
                hasToolAiCall = true;
                continue;
            }
        }

        if (m1.getType() === 'tool') {
            if (hasToolAiCall) {
                continue;
            } else {
                deleteIndexes.push(i);
            }
        }

        hasToolAiCall = false;
    }

    // Only ai messages can have tool calls, so remove any tool calls from non-ai messages.
    messageHistory.forEach(msg => {
        const anonMsg = msg as any;
        if (msg.getType() !== 'ai' && anonMsg.tool_calls) {
            delete anonMsg.tool_calls;
        }
    });

    // Return the filtered items.
    return messageHistory.filter((h, i) => !deleteIndexes.includes(i));
}


/** Ensures that all tool calls are not human messages, and that the tool calls have a preceding tool_call message. 
 *   This also removes "disabled" messages from the list. */
export function cleanToolMessagesForChat(messageHistory: BaseMessage[]) {
    if (messageHistory.length < 2) {
        return messageHistory.slice();
    }

    // This will hold the indexes of the messages that we need to delete.
    const deletionTargets: MessageGroupingState[] = [];

    for (let i = messageHistory.length - 1; i >= 0; i--) {
        // Get this grouping state.
        const groupState = new MessageGroupingState(messageHistory, i);

        // If this is a tool message, then we don't care - we'll let whatever
        //  non-tool message preceding it help determine it's validity.
        if (groupState.messageType === 'tool') {
            continue;
        }

        // Get the tool messages following this item.
        const toolMessages = groupState.getFollowingToolMessages();

        // Determine if it should be deleted.
        if (groupState.isDisabledMessage) {
            // Add this item for deletion.
            deletionTargets.push(groupState);
            // Add any tool messages for deletion.
            deletionTargets.push(...toolMessages);

        } else if (toolMessages.length > 0 && !(groupState.hasToolCalls && groupState.messageType === 'ai')) {
            // We can only have tool messages after AI messages that have tool calls.  Otherwise we get errors.
            deletionTargets.push(...toolMessages);
        }
    }

    // Get the indices for all of the messages collected, and put them in reverse
    //  order, so they can be deleted without affecting anything after them.
    let deleteIndices = deletionTargets.map(t => t.messageIndex).sort((a, b) => a - b).reverse();

    // Delete the messages.
    deleteIndices.forEach(i => {
        messageHistory.splice(i, 1);
    });

    return messageHistory;
}