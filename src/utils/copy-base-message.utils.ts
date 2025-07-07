import { BaseMessage, mapChatMessagesToStoredMessages, mapStoredMessagesToChatMessages, mapStoredMessageToChatMessage } from "@langchain/core/messages";


export function copyBaseMessage(message: BaseMessage): BaseMessage {
    let stored = mapChatMessagesToStoredMessages([message]);
    stored = JSON.parse(JSON.stringify(stored));
    return mapStoredMessageToChatMessage(stored[0]);
}

export function copyBaseMessages(messages: BaseMessage[]): BaseMessage[] {
    let stored = mapChatMessagesToStoredMessages(messages);
    stored = JSON.parse(JSON.stringify(stored));
    return mapStoredMessagesToChatMessages(stored);
}