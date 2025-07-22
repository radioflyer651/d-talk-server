import { BaseMessage, AIMessage } from "@langchain/core/messages";
import { MessageGroupingState } from "./message-grouping-state.utils";
import { copyBaseMessages } from "../../utils/copy-base-message.utils";



/** Ensures that all tool calls are not human messages, and that the tool calls have a preceding tool_call message. */
export function cleanToolMessagesForChat(messageHistory: BaseMessage[]) {
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


// /** Ensures that all tool calls are not human messages, and that the tool calls have a preceding tool_call message. */
// export function cleanToolMessagesForChat2(messageHistory: BaseMessage[]) {
//     if (messageHistory.length < 2) {
//         return messageHistory.slice();
//     }

//     const groupState = new MessageGroupingState(messageHistory, 0);


// }