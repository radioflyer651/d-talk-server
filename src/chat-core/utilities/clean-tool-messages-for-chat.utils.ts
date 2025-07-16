import { BaseMessage, AIMessage } from "@langchain/core/messages";



/** Ensures that all tool calls are not human messages, and that the tool calls have a preceding tool_call message. */
export function cleanToolMessagesForChat(messageHistory: BaseMessage[]) {
    if (messageHistory.length < 2) {
        return messageHistory.slice();
    }

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

    return messageHistory.filter((h, i) => !deleteIndexes.includes(i));
}